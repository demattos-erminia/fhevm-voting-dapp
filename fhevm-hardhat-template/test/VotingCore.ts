import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { VotingCore } from "../types";
import { expect } from "chai";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
  charlie: HardhatEthersSigner;
};

async function deployFixture() {
  const VotingCoreFactory = await ethers.getContractFactory("VotingCore");
  const votingCore = (await VotingCoreFactory.deploy()) as VotingCore;
  const votingCoreAddress = await votingCore.getAddress();

  return { votingCore, votingCoreAddress };
}

describe("VotingCore", function () {
  let signers: Signers;
  let votingCore: VotingCore;
  let votingCoreAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = {
      deployer: ethSigners[0],
      alice: ethSigners[1],
      bob: ethSigners[2],
      charlie: ethSigners[3]
    };
  });

  beforeEach(async function () {
    // Check whether the tests are running against an FHEVM mock environment
    if (!fhevm.isMock) {
      console.warn(`This hardhat test suite cannot run on Sepolia Testnet`);
      this.skip();
    }

    ({ votingCore, votingCoreAddress } = await deployFixture());
  });

  describe("Proposal Creation", function () {
    it("should create a proposal successfully", async function () {
      const title = "Test Proposal";
      const description = "This is a test proposal";
      const options = ["Option A", "Option B", "Option C"];
      const duration = 3600; // 1 hour
      const minVotesForReveal = 2;

      const tx = await votingCore.connect(signers.alice).createProposal(
        title,
        description,
        options,
        duration,
        minVotesForReveal
      );

      await expect(tx).to.emit(votingCore, "ProposalCreated");

      const proposalCount = await votingCore.proposalCount();
      expect(proposalCount).to.equal(1);

      const proposalInfo = await votingCore.getProposalInfo(1);
      expect(proposalInfo.title).to.equal(title);
      expect(proposalInfo.description).to.equal(description);
      expect(proposalInfo.options).to.deep.equal(options);
      expect(proposalInfo.creator).to.equal(signers.alice.address);
      expect(proposalInfo.isActive).to.be.true;
      expect(proposalInfo.isRevealed).to.be.false;
    });

    it("should reject invalid proposal parameters", async function () {
      // Test invalid number of options (too few)
      await expect(
        votingCore.connect(signers.alice).createProposal(
          "Title",
          "Description",
          ["A"],
          3600,
          1
        )
      ).to.be.revertedWith("Invalid number of options");

      // Test invalid number of options (too many)
      const tooManyOptions = Array(11).fill("Option");
      await expect(
        votingCore.connect(signers.alice).createProposal(
          "Title",
          "Description",
          tooManyOptions,
          3600,
          1
        )
      ).to.be.revertedWith("Invalid number of options");

      // Test invalid duration (too short)
      await expect(
        votingCore.connect(signers.alice).createProposal(
          "Title",
          "Description",
          ["A", "B"],
          0,
          1
        )
      ).to.be.revertedWith("Invalid duration");

      // Test invalid duration (too long)
      await expect(
        votingCore.connect(signers.alice).createProposal(
          "Title",
          "Description",
          ["A", "B"],
          30 * 24 * 60 * 60 + 1, // 30 days + 1 second
          1
        )
      ).to.be.revertedWith("Invalid duration");
    });
  });

  describe("Voting", function () {
    let proposalId: number;

    beforeEach(async function () {
      // Create a proposal for testing
      const tx = await votingCore.connect(signers.alice).createProposal(
        "Test Voting",
        "Test voting description",
        ["Yes", "No"],
        3600,
        1
      );
      await tx.wait();

      const proposalCount = await votingCore.proposalCount();
      proposalId = Number(proposalCount);
    });

    it("should allow encrypted voting", async function () {
      // Create encrypted vote (value = 1 for "Yes" option)
      const encryptedVote = await fhevm
        .createEncryptedInput(votingCoreAddress, signers.bob.address)
        .add32(1)
        .encrypt();

      // Cast vote
      const tx = await votingCore.connect(signers.bob).castVote(
        proposalId,
        0, // Vote for option 0 ("Yes")
        encryptedVote.handles[0],
        encryptedVote.inputProof
      );

      await expect(tx).to.emit(votingCore, "VoteCast");

      // Check that user has voted
      const hasVoted = await votingCore.hasUserVoted(proposalId, signers.bob.address);
      expect(hasVoted).to.be.true;
    });

    it("should prevent double voting", async function () {
      // First vote
      const encryptedVote1 = await fhevm
        .createEncryptedInput(votingCoreAddress, signers.bob.address)
        .add32(1)
        .encrypt();

      await votingCore.connect(signers.bob).castVote(
        proposalId,
        0,
        encryptedVote1.handles[0],
        encryptedVote1.inputProof
      );

      // Second vote should fail
      const encryptedVote2 = await fhevm
        .createEncryptedInput(votingCoreAddress, signers.bob.address)
        .add32(1)
        .encrypt();

      await expect(
        votingCore.connect(signers.bob).castVote(
          proposalId,
          1,
          encryptedVote2.handles[0],
          encryptedVote2.inputProof
        )
      ).to.be.revertedWith("Already voted");
    });

    it("should reject invalid option index", async function () {
      const encryptedVote = await fhevm
        .createEncryptedInput(votingCoreAddress, signers.bob.address)
        .add32(1)
        .encrypt();

      // Try to vote for invalid option index
      await expect(
        votingCore.connect(signers.bob).castVote(
          proposalId,
          999, // Invalid option index
          encryptedVote.handles[0],
          encryptedVote.inputProof
        )
      ).to.be.revertedWith("Invalid option");
    });
  });

  describe("Result Revelation", function () {
    let proposalId: number;

    beforeEach(async function () {
      // Create and immediately end a proposal
      const tx = await votingCore.connect(signers.alice).createProposal(
        "Quick Test",
        "Quick test proposal",
        ["A", "B"],
        1, // 1 second duration
        1
      );
      await tx.wait();

      const proposalCount = await votingCore.proposalCount();
      proposalId = Number(proposalCount);

      // Wait for proposal to end
      await new Promise(resolve => setTimeout(resolve, 2000));
    });

    it("should allow creator to reveal results after voting ends", async function () {
      const tx = await votingCore.connect(signers.alice).revealResults(proposalId);

      await expect(tx).to.emit(votingCore, "ProposalResultDecrypted");

      const proposalInfo = await votingCore.getProposalInfo(proposalId);
      expect(proposalInfo.isRevealed).to.be.true;
    });

    it("should prevent non-creator from revealing results", async function () {
      await expect(
        votingCore.connect(signers.bob).revealResults(proposalId)
      ).to.be.revertedWith("Only creator can perform this action");
    });

    it("should prevent revealing results before voting ends", async function () {
      // Create a new proposal that hasn't ended
      const tx = await votingCore.connect(signers.alice).createProposal(
        "Active Proposal",
        "Still active",
        ["X", "Y"],
        3600, // 1 hour
        1
      );
      await tx.wait();

      const proposalCount = await votingCore.proposalCount();
      const activeProposalId = Number(proposalCount);

      await expect(
        votingCore.connect(signers.alice).revealResults(activeProposalId)
      ).to.be.revertedWith("Voting still active");
    });
  });
});
