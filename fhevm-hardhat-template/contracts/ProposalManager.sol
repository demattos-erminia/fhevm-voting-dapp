// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, euint256} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import "./VotingCore.sol";

/// @title Proposal Manager Contract
/// @notice Manages proposal creation, validation, and lifecycle
contract ProposalManager is SepoliaConfig {

    VotingCore public votingCore;

    // Events
    event ProposalValidated(uint256 indexed proposalId, address indexed validator);
    event ProposalRejected(uint256 indexed proposalId, string reason);

    // Structs
    struct ProposalValidation {
        bool isValidated;
        address validator;
        uint256 validationTime;
        string rejectionReason;
    }

    // State variables
    mapping(uint256 => ProposalValidation) public proposalValidations;
    mapping(address => bool) public validators;
    address public admin;

    // Modifiers
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    modifier onlyValidator() {
        require(validators[msg.sender], "Only validator can perform this action");
        _;
    }

    constructor(address _votingCoreAddress) {
        admin = msg.sender;
        votingCore = VotingCore(_votingCoreAddress);
    }

    /// @notice Add a validator
    /// @param validator Address to add as validator
    function addValidator(address validator) external onlyAdmin {
        validators[validator] = true;
    }

    /// @notice Remove a validator
    /// @param validator Address to remove from validators
    function removeValidator(address validator) external onlyAdmin {
        validators[validator] = false;
    }

    /// @notice Create a proposal with validation
    /// @param title Proposal title
    /// @param description Proposal description
    /// @param options Array of voting options
    /// @param duration Voting duration in seconds
    /// @param minVotesForReveal Minimum votes required to reveal results
    function createValidatedProposal(
        string memory title,
        string memory description,
        string[] memory options,
        uint256 duration,
        uint256 minVotesForReveal
    ) external returns (uint256) {
        // Basic validation
        require(bytes(title).length > 0, "Title cannot be empty");
        require(bytes(description).length > 0, "Description cannot be empty");
        require(options.length >= 2, "At least 2 options required");

        // Create proposal in VotingCore
        uint256 proposalId = votingCore.createProposal(
            title,
            description,
            options,
            duration,
            minVotesForReveal
        );

        return proposalId;
    }

    /// @notice Validate a proposal (for validators)
    /// @param proposalId The proposal ID to validate
    function validateProposal(uint256 proposalId) external onlyValidator {
        require(!proposalValidations[proposalId].isValidated, "Already validated");

        proposalValidations[proposalId] = ProposalValidation({
            isValidated: true,
            validator: msg.sender,
            validationTime: block.timestamp,
            rejectionReason: ""
        });

        emit ProposalValidated(proposalId, msg.sender);
    }

    /// @notice Reject a proposal (for validators)
    /// @param proposalId The proposal ID to reject
    /// @param reason Rejection reason
    function rejectProposal(uint256 proposalId, string memory reason) external onlyValidator {
        require(!proposalValidations[proposalId].isValidated, "Already validated");
        require(bytes(reason).length > 0, "Rejection reason required");

        proposalValidations[proposalId] = ProposalValidation({
            isValidated: false,
            validator: msg.sender,
            validationTime: block.timestamp,
            rejectionReason: reason
        });

        emit ProposalRejected(proposalId, reason);
    }

    /// @notice Get proposals created by a user
    /// @param creator The address of the proposal creator
    function getProposalsByCreator(address creator) external view returns (uint256[] memory) {
        uint256 totalProposals = votingCore.proposalCount();
        uint256[] memory userProposals = new uint256[](totalProposals);
        uint256 count = 0;

        for (uint256 i = 1; i <= totalProposals; i++) {
            (
                address _proposalCreator,
                ,,,,,,,,,
                uint256 _voterCount
            ) = votingCore.getProposalInfo(i);
            if (_proposalCreator == creator) {
                userProposals[count] = i;
                count++;
            }
        }

        // Resize array to actual count
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = userProposals[i];
        }

        return result;
    }

    /// @notice Get active proposals
    function getActiveProposals() external view returns (uint256[] memory) {
        uint256 totalProposals = votingCore.proposalCount();
        uint256[] memory activeProposals = new uint256[](totalProposals);
        uint256 count = 0;

        for (uint256 i = 1; i <= totalProposals; i++) {
            (
                address _creator,
                string memory _title,
                string memory _desc,
                string[] memory _options,
                uint256 _startTime,
                uint256 endTime,
                uint256 _minVotes,
                bool isActive,
                bool _isRevealed,
                uint256 _totalOptions,
                uint256 _voterCount
            ) = votingCore.getProposalInfo(i);
            if (isActive && block.timestamp <= endTime) {
                activeProposals[count] = i;
                count++;
            }
        }

        // Resize array
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = activeProposals[i];
        }

        return result;
    }

    /// @notice Get ended proposals
    function getEndedProposals() external view returns (uint256[] memory) {
        uint256 totalProposals = votingCore.proposalCount();
        uint256[] memory endedProposals = new uint256[](totalProposals);
        uint256 count = 0;

        for (uint256 i = 1; i <= totalProposals; i++) {
            (
                address _creator,
                string memory _title,
                string memory _desc,
                string[] memory _options,
                uint256 _startTime,
                uint256 endTime,
                uint256 _minVotes,
                bool _isActive,
                bool _isRevealed,
                uint256 _totalOptions,
                uint256 _voterCount
            ) = votingCore.getProposalInfo(i);
            if (block.timestamp > endTime) {
                endedProposals[count] = i;
                count++;
            }
        }

        // Resize array
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = endedProposals[i];
        }

        return result;
    }

    /// @notice Get voting statistics for a proposal
    function getProposalStats(uint256 proposalId) external view returns (
        uint256 totalVoters,
        uint256 timeRemaining,
        bool canVote,
        bool canReveal
    ) {
        (,,,,uint256 startTime, uint256 endTime, uint256 minVotesForReveal, bool isActive, bool isRevealed,, uint256 voterCount) = votingCore.getProposalInfo(proposalId);

        // Use voter count from VotingCore contract
        uint256 voters = voterCount;

        uint256 remaining = 0;
        if (block.timestamp < endTime) {
            remaining = endTime - block.timestamp;
        }

        bool votingActive = isActive && block.timestamp >= startTime && block.timestamp <= endTime;
        bool canRevealResults = !isRevealed && block.timestamp > endTime && voters >= minVotesForReveal;

        return (voters, remaining, votingActive, canRevealResults);
    }

    /// @notice Transfer admin rights
    /// @param newAdmin New admin address
    function transferAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "Invalid admin address");
        admin = newAdmin;
    }
}
