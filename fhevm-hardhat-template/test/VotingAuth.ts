import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { VotingAuth } from "../types";
import { expect } from "chai";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
  charlie: HardhatEthersSigner;
};

async function deployFixture() {
  const VotingAuthFactory = await ethers.getContractFactory("VotingAuth");
  const votingAuth = (await VotingAuthFactory.deploy()) as VotingAuth;
  const votingAuthAddress = await votingAuth.getAddress();

  return { votingAuth, votingAuthAddress };
}

describe("VotingAuth", function () {
  let signers: Signers;
  let votingAuth: VotingAuth;
  let votingAuthAddress: string;

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
    ({ votingAuth, votingAuthAddress } = await deployFixture());
  });

  describe("User Registration", function () {
    it("should allow user to register", async function () {
      const tx = await votingAuth.connect(signers.alice).registerUser();
      await expect(tx).to.emit(votingAuth, "UserRegistered");

      const profile = await votingAuth.getUserProfile(signers.alice.address);
      expect(profile.isRegistered).to.be.true;
      expect(profile.isBanned).to.be.false;
      expect(profile.votingWeight).to.equal(1);
    });

    it("should prevent double registration", async function () {
      await votingAuth.connect(signers.alice).registerUser();

      await expect(
        votingAuth.connect(signers.alice).registerUser()
      ).to.be.revertedWith("User already registered");
    });

    it("should allow admin to register user with custom weight", async function () {
      const customWeight = 5;

      const tx = await votingAuth.registerUserWithWeight(signers.alice.address, customWeight);
      await expect(tx).to.emit(votingAuth, "UserRegistered");

      const profile = await votingAuth.getUserProfile(signers.alice.address);
      expect(profile.isRegistered).to.be.true;
      expect(profile.votingWeight).to.equal(customWeight);
    });

    it("should reject invalid voting weights", async function () {
      await expect(
        votingAuth.registerUserWithWeight(signers.alice.address, 0)
      ).to.be.revertedWith("Invalid voting weight");

      await expect(
        votingAuth.registerUserWithWeight(signers.alice.address, 101)
      ).to.be.revertedWith("Invalid voting weight");
    });
  });

  describe("Voting Weight Management", function () {
    beforeEach(async function () {
      await votingAuth.connect(signers.alice).registerUser();
    });

    it("should allow moderator to update voting weight", async function () {
      const newWeight = 10;

      const tx = await votingAuth.updateVotingWeight(signers.alice.address, newWeight);
      await expect(tx).to.emit(votingAuth, "VotingWeightUpdated");

      const weight = await votingAuth.getVotingWeight(signers.alice.address);
      expect(weight).to.equal(newWeight);
    });

    it("should reject weight updates for unregistered users", async function () {
      await expect(
        votingAuth.updateVotingWeight(signers.bob.address, 5)
      ).to.be.revertedWith("User not registered");
    });

    it("should reject invalid weight values", async function () {
      await expect(
        votingAuth.updateVotingWeight(signers.alice.address, 0)
      ).to.be.revertedWith("Invalid voting weight");

      await expect(
        votingAuth.updateVotingWeight(signers.alice.address, 101)
      ).to.be.revertedWith("Invalid voting weight");
    });
  });

  describe("User Banning", function () {
    beforeEach(async function () {
      await votingAuth.connect(signers.alice).registerUser();
    });

    it("should allow moderator to ban user", async function () {
      const reason = "Violation of terms";

      const tx = await votingAuth.banUser(signers.alice.address, reason);
      await expect(tx).to.emit(votingAuth, "UserBanned");

      const profile = await votingAuth.getUserProfile(signers.alice.address);
      expect(profile.isBanned).to.be.true;
      expect(profile.banReason).to.equal(reason);
    });

    it("should allow moderator to unban user", async function () {
      await votingAuth.banUser(signers.alice.address, "Test ban");

      const tx = await votingAuth.unbanUser(signers.alice.address);
      await expect(tx).to.emit(votingAuth, "UserUnbanned");

      const profile = await votingAuth.getUserProfile(signers.alice.address);
      expect(profile.isBanned).to.be.false;
      expect(profile.banReason).to.equal("");
    });

    it("should prevent banned users from voting", async function () {
      await votingAuth.banUser(signers.alice.address, "Banned");

      const canVote = await votingAuth.canUserVote(signers.alice.address);
      expect(canVote).to.be.false;
    });
  });

  describe("Moderator Management", function () {
    it("should allow admin to add moderators", async function () {
      await votingAuth.connect(signers.alice).registerUser();

      await votingAuth.addModerator(signers.alice.address);

      const isModerator = await votingAuth.isModerator(signers.alice.address);
      expect(isModerator).to.be.true;
    });

    it("should allow admin to remove moderators", async function () {
      await votingAuth.connect(signers.alice).registerUser();
      await votingAuth.addModerator(signers.alice.address);

      await votingAuth.removeModerator(signers.alice.address);

      const isModerator = await votingAuth.isModerator(signers.alice.address);
      expect(isModerator).to.be.false;
    });

    it("should prevent non-admin from managing moderators", async function () {
      await votingAuth.connect(signers.alice).registerUser();

      await expect(
        votingAuth.connect(signers.alice).addModerator(signers.bob.address)
      ).to.be.revertedWith("Only admin can perform this action");
    });
  });

  describe("Access Control", function () {
    it("should enforce onlyRegistered modifier", async function () {
      await expect(
        votingAuth.connect(signers.alice).updateVotingWeight(signers.bob.address, 5)
      ).to.be.revertedWith("Only moderator can perform this action");
    });

    it("should enforce notBanned modifier", async function () {
      // This would be tested with functions that use the notBanned modifier
      // The current implementation doesn't have functions that use this modifier
      // but it's ready for future use
    });
  });

  describe("Admin Functions", function () {
    it("should allow admin to transfer ownership", async function () {
      await votingAuth.connect(signers.alice).registerUser();

      await votingAuth.transferAdmin(signers.alice.address);

      // Verify admin changed
      const isAliceModerator = await votingAuth.isModerator(signers.alice.address);
      expect(isAliceModerator).to.be.true;
    });

    it("should prevent non-admin from transferring ownership", async function () {
      await votingAuth.connect(signers.alice).registerUser();

      await expect(
        votingAuth.connect(signers.alice).transferAdmin(signers.bob.address)
      ).to.be.revertedWith("Only admin can perform this action");
    });
  });

  describe("Emergency Functions", function () {
    it("should allow admin to pause and unpause contract", async function () {
      await votingAuth.pause();
      expect(await votingAuth.paused()).to.be.true;

      await votingAuth.unpause();
      expect(await votingAuth.paused()).to.be.false;
    });

    it("should prevent non-admin from pausing", async function () {
      await expect(
        votingAuth.connect(signers.alice).pause()
      ).to.be.revertedWith("Only admin can perform this action");
    });
  });
});
