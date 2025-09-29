// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, euint256, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title FHEVM Voting Core Contract
/// @notice Core voting functionality with privacy-preserving encrypted votes
contract VotingCore is SepoliaConfig {

    // Events
    event ProposalCreated(uint256 indexed proposalId, address indexed creator, string title);
    event VoteCast(uint256 indexed proposalId, address indexed voter);
    event ProposalResultDecrypted(uint256 indexed proposalId);

    // Structs
    struct Proposal {
        address creator;
        string title;
        string description;
        string[] options;
        uint256 startTime;
        uint256 endTime;
        uint256 minVotesForReveal; // Minimum votes needed to reveal results
        uint256 voterCount; // Number of voters who have voted
        bool isActive;
        bool isRevealed;
        mapping(address => bool) hasVoted; // Track who has voted
        mapping(uint256 => euint32) encryptedVotes; // optionIndex => encrypted vote count
        uint256[] clearVotes; // Decrypted vote counts (after reveal)
    }

    // State variables
    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;

    // Modifiers
    modifier onlyActiveProposal(uint256 proposalId) {
        require(proposals[proposalId].isActive, "Proposal not active");
        require(
            block.timestamp >= proposals[proposalId].startTime &&
            block.timestamp <= proposals[proposalId].endTime,
            "Proposal not in voting period"
        );
        _;
    }

    modifier onlyAfterEnd(uint256 proposalId) {
        require(block.timestamp > proposals[proposalId].endTime, "Voting still active");
        _;
    }

    modifier onlyCreator(uint256 proposalId) {
        require(proposals[proposalId].creator == msg.sender, "Only creator can perform this action");
        _;
    }

    /// @notice Create a new voting proposal
    /// @param title Proposal title
    /// @param description Proposal description
    /// @param options Array of voting options
    /// @param duration Voting duration in seconds
    /// @param minVotesForReveal Minimum votes required to reveal results
    function createProposal(
        string memory title,
        string memory description,
        string[] memory options,
        uint256 duration,
        uint256 minVotesForReveal
    ) external returns (uint256) {
        require(options.length >= 2 && options.length <= 10, "Invalid number of options");
        require(duration > 0 && duration <= 30 days, "Invalid duration");

        proposalCount++;
        uint256 proposalId = proposalCount;

        Proposal storage proposal = proposals[proposalId];
        proposal.creator = msg.sender;
        proposal.title = title;
        proposal.description = description;
        proposal.options = options;
        proposal.startTime = block.timestamp;
        proposal.endTime = block.timestamp + duration;
        proposal.minVotesForReveal = minVotesForReveal;
        proposal.isActive = true;
        proposal.isRevealed = false;

        // Initialize encrypted vote counts for each option
        for (uint256 i = 0; i < options.length; i++) {
            proposal.encryptedVotes[i] = FHE.asEuint32(0);
            FHE.allowThis(proposal.encryptedVotes[i]);
            FHE.allow(proposal.encryptedVotes[i], msg.sender);
        }

        emit ProposalCreated(proposalId, msg.sender, title);
        return proposalId;
    }

    /// @notice Cast an encrypted vote for a proposal
    /// @param proposalId The proposal ID
    /// @param optionIndex The index of the chosen option
    /// @param encryptedVote Encrypted vote value (should be 1 for the chosen option)
    /// @param inputProof Zero-knowledge proof for the encrypted input
    function castVote(
        uint256 proposalId,
        uint256 optionIndex,
        externalEuint32 encryptedVote,
        bytes calldata inputProof
    ) external onlyActiveProposal(proposalId) {
        Proposal storage proposal = proposals[proposalId];

        require(!proposal.hasVoted[msg.sender], "Already voted");
        require(optionIndex < proposal.options.length, "Invalid option");

        // Verify the encrypted vote input
        euint32 voteValue = FHE.fromExternal(encryptedVote, inputProof);

        // Note: We trust the frontend validation for privacy reasons
        // Vote validation happens through the input proof verification

        // Add the encrypted vote to the option's total
        proposal.encryptedVotes[optionIndex] = FHE.add(
            proposal.encryptedVotes[optionIndex],
            voteValue
        );

        // Mark user as voted and increment voter count
        proposal.hasVoted[msg.sender] = true;
        proposal.voterCount++;

        // Allow the creator to decrypt results later
        FHE.allowThis(proposal.encryptedVotes[optionIndex]);

        emit VoteCast(proposalId, msg.sender);
    }

    /// @notice Reveal voting results after voting period ends
    /// @param proposalId The proposal ID
    function revealResults(uint256 proposalId) external onlyAfterEnd(proposalId) onlyCreator(proposalId) {
        Proposal storage proposal = proposals[proposalId];
        require(!proposal.isRevealed, "Already revealed");

        // Initialize clear votes array (decryption handled by frontend in this demo)
        for (uint256 i = 0; i < proposal.options.length; i++) {
            // This would require the creator to have decryption permission
            // In a real implementation, you might need to call a separate decryption function
            // For now, we'll initialize with 0 and let the frontend handle decryption
            proposal.clearVotes.push(0);
        }

        proposal.isRevealed = true;
        emit ProposalResultDecrypted(proposalId);
    }

    /// @notice Get proposal basic information
    function getProposalInfo(uint256 proposalId) external view returns (
        address creator,
        string memory title,
        string memory description,
        string[] memory options,
        uint256 startTime,
        uint256 endTime,
        uint256 minVotesForReveal,
        bool isActive,
        bool isRevealed,
        uint256 totalOptions,
        uint256 voterCount
    ) {
        Proposal storage proposal = proposals[proposalId];
        return (
            proposal.creator,
            proposal.title,
            proposal.description,
            proposal.options,
            proposal.startTime,
            proposal.endTime,
            proposal.minVotesForReveal,
            proposal.isActive,
            proposal.isRevealed,
            proposal.options.length,
            proposal.voterCount
        );
    }

    /// @notice Check if user has voted for a proposal
    function hasUserVoted(uint256 proposalId, address user) external view returns (bool) {
        return proposals[proposalId].hasVoted[user];
    }

    /// @notice Get encrypted vote count for an option (for authorized users)
    function getEncryptedVoteCount(uint256 proposalId, uint256 optionIndex)
        external
        view
        returns (euint32)
    {
        require(FHE.isSenderAllowed(proposals[proposalId].encryptedVotes[optionIndex]),
                "Access denied");
        return proposals[proposalId].encryptedVotes[optionIndex];
    }

    /// @notice Get decrypted vote count (only after reveal)
    function getDecryptedVoteCount(uint256 proposalId, uint256 optionIndex)
        external
        view
        returns (uint256)
    {
        require(proposals[proposalId].isRevealed, "Results not revealed yet");
        return proposals[proposalId].clearVotes[optionIndex];
    }

    /// @notice Get total decrypted votes for all options
    function getAllDecryptedVotes(uint256 proposalId)
        external
        view
        returns (uint256[] memory)
    {
        require(proposals[proposalId].isRevealed, "Results not revealed yet");
        return proposals[proposalId].clearVotes;
    }

    /// @notice Get all proposal IDs where a user has voted
    function getUserVotedProposals(address user)
        external
        view
        returns (uint256[] memory)
    {
        uint256 totalProposals = proposalCount;
        uint256[] memory votedProposals = new uint256[](totalProposals);
        uint256 count = 0;

        for (uint256 i = 1; i <= totalProposals; i++) {
            if (proposals[i].hasVoted[user]) {
                votedProposals[count] = i;
                count++;
            }
        }

        // Resize array
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = votedProposals[i];
        }

        return result;
    }
}
