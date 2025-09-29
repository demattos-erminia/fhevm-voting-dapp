// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, euint256} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Voting Authentication Contract
/// @notice Manages user authentication, voting weights, and access control
contract VotingAuth is SepoliaConfig {

    // Events
    event UserRegistered(address indexed user, uint256 votingWeight);
    event VotingWeightUpdated(address indexed user, uint256 newWeight);
    event UserBanned(address indexed user, string reason);
    event UserUnbanned(address indexed user);

    // Structs
    struct UserProfile {
        bool isRegistered;
        bool isBanned;
        uint256 votingWeight;      // Encrypted voting weight
        uint256 registrationTime;
        string banReason;
        address bannedBy;
    }

    // State variables
    mapping(address => UserProfile) public userProfiles;
    mapping(address => bool) public moderators;
    address public admin;

    uint256 public constant DEFAULT_VOTING_WEIGHT = 1;
    uint256 public constant MAX_VOTING_WEIGHT = 100;

    // Modifiers
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    modifier onlyModerator() {
        require(moderators[msg.sender] || msg.sender == admin, "Only moderator can perform this action");
        _;
    }

    modifier onlyRegistered() {
        require(userProfiles[msg.sender].isRegistered, "User not registered");
        _;
    }

    modifier notBanned() {
        require(!userProfiles[msg.sender].isBanned, "User is banned");
        _;
    }

    constructor() {
        admin = msg.sender;
        moderators[msg.sender] = true;
    }

    /// @notice Register a new user
    function registerUser() external whenNotPaused {
        _registerUser();
    }

    /// @notice Register a user with custom voting weight (admin only)
    /// @param user Address of the user to register
    /// @param weight Voting weight for the user
    function registerUserWithWeight(address user, uint256 weight) external onlyModerator {
        require(!userProfiles[user].isRegistered, "User already registered");
        require(weight > 0 && weight <= MAX_VOTING_WEIGHT, "Invalid voting weight");

        userProfiles[user] = UserProfile({
            isRegistered: true,
            isBanned: false,
            votingWeight: weight,
            registrationTime: block.timestamp,
            banReason: "",
            bannedBy: address(0)
        });

        emit UserRegistered(user, weight);
    }

    /// @notice Update voting weight for a user
    /// @param user Address of the user
    /// @param newWeight New voting weight
    function updateVotingWeight(address user, uint256 newWeight) external onlyModerator whenNotPaused {
        _updateVotingWeight(user, newWeight);
    }

    /// @notice Ban a user
    /// @param user Address of the user to ban
    /// @param reason Reason for banning
    function banUser(address user, string memory reason) external onlyModerator {
        require(userProfiles[user].isRegistered, "User not registered");
        require(!userProfiles[user].isBanned, "User already banned");
        require(bytes(reason).length > 0, "Ban reason required");

        userProfiles[user].isBanned = true;
        userProfiles[user].banReason = reason;
        userProfiles[user].bannedBy = msg.sender;

        emit UserBanned(user, reason);
    }

    /// @notice Unban a user
    /// @param user Address of the user to unban
    function unbanUser(address user) external onlyModerator {
        require(userProfiles[user].isRegistered, "User is not registered");
        require(userProfiles[user].isBanned, "User is not banned");

        userProfiles[user].isBanned = false;
        userProfiles[user].banReason = "";
        userProfiles[user].bannedBy = address(0);

        emit UserUnbanned(user);
    }

    /// @notice Add a moderator
    /// @param moderator Address to add as moderator
    function addModerator(address moderator) external onlyAdmin {
        require(userProfiles[moderator].isRegistered, "Moderator must be registered");
        moderators[moderator] = true;
    }

    /// @notice Remove a moderator
    /// @param moderator Address to remove from moderators
    function removeModerator(address moderator) external onlyAdmin {
        require(moderator != admin, "Cannot remove admin from moderators");
        moderators[moderator] = false;
    }

    /// @notice Get user profile information
    function getUserProfile(address user) external view returns (
        bool isRegistered,
        bool isBanned,
        uint256 votingWeight,
        uint256 registrationTime,
        string memory banReason,
        address bannedBy
    ) {
        UserProfile memory profile = userProfiles[user];
        return (
            profile.isRegistered,
            profile.isBanned,
            profile.votingWeight,
            profile.registrationTime,
            profile.banReason,
            profile.bannedBy
        );
    }

    /// @notice Check if user can vote
    function canUserVote(address user) external view returns (bool) {
        UserProfile memory profile = userProfiles[user];
        return profile.isRegistered && !profile.isBanned;
    }

    /// @notice Get user's voting weight
    function getVotingWeight(address user) external view returns (uint256) {
        require(userProfiles[user].isRegistered, "User not registered");
        return userProfiles[user].votingWeight;
    }

    /// @notice Check if address is moderator
    function isModerator(address user) external view returns (bool) {
        return moderators[user];
    }

    /// @notice Get all registered users (simplified demo implementation)
    function getRegisteredUsers(uint256 /* offset */, uint256 /* limit */)
        external
        pure
        returns (address[] memory users, uint256 totalCount)
    {
        // This is a simplified implementation for demo purposes
        // In a real application, you'd maintain a separate array of registered users
        // with proper indexing and pagination
        return (new address[](0), 0);
    }

    /// @notice Transfer admin rights
    /// @param newAdmin New admin address
    function transferAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "Invalid admin address");
        require(userProfiles[newAdmin].isRegistered, "New admin must be registered");

        // Remove old admin from moderators if they're not the same
        if (newAdmin != admin) {
            moderators[admin] = false;
            moderators[newAdmin] = true;
        }

        admin = newAdmin;
    }

    /// @notice Emergency pause functionality
    bool public paused;

    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    modifier whenPaused() {
        require(paused, "Contract is not paused");
        _;
    }

    function pause() external onlyAdmin whenNotPaused {
        paused = true;
    }

    function unpause() external onlyAdmin whenPaused {
        paused = false;
    }


    // Internal implementations
    function _registerUser() internal {
        require(!userProfiles[msg.sender].isRegistered, "User already registered");

        userProfiles[msg.sender] = UserProfile({
            isRegistered: true,
            isBanned: false,
            votingWeight: DEFAULT_VOTING_WEIGHT,
            registrationTime: block.timestamp,
            banReason: "",
            bannedBy: address(0)
        });

        emit UserRegistered(msg.sender, DEFAULT_VOTING_WEIGHT);
    }

    function _updateVotingWeight(address user, uint256 newWeight) internal {
        require(userProfiles[user].isRegistered, "User not registered");
        require(newWeight > 0 && newWeight <= MAX_VOTING_WEIGHT, "Invalid voting weight");

        userProfiles[user].votingWeight = newWeight;

        emit VotingWeightUpdated(user, newWeight);
    }
}
