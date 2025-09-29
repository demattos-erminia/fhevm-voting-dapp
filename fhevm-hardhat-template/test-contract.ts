import { ethers } from "hardhat";

async function main() {
  console.log("Testing contract calls...");

  // Get contract instances
  const VotingAuth = await ethers.getContractFactory("VotingAuth");
  const votingAuth = await ethers.getContractAt("VotingAuth", "0x5c653ca4AeA7F2Da07f0AABf75F85766EAFDA615");

  console.log("VotingAuth contract connected");

  try {
    // Check paused state
    const paused = await votingAuth.paused();
    console.log("Contract paused:", paused);

    // Get signer
    const [signer] = await ethers.getSigners();
    const userAddress = await signer.getAddress();
    console.log("Signer address:", userAddress);

    // Check user profile
    const userProfile = await votingAuth.getUserProfile(userAddress);
    console.log("User profile:", userProfile);

    if (!userProfile[0]) { // isRegistered
      console.log("User not registered, attempting to register...");
      const tx = await votingAuth.registerUser();
      console.log("Register transaction sent:", tx.hash);

      const receipt = await tx.wait();
      console.log("Register transaction confirmed");
    } else {
      console.log("User already registered");
    }

  } catch (error) {
    console.error("Error:", error);
  }
}

main().catch(console.error);

