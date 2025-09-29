const { ethers } = require("hardhat");

async function main() {
  // Connect to localhost
  const provider = new ethers.JsonRpcProvider("http://localhost:8545");

  // Get signer (first account from Hardhat)
  const signer = await provider.getSigner();

  console.log("Connected to localhost, signer address:", await signer.getAddress());

  // Contract addresses
  const votingAuthAddress = "0x5c653ca4AeA7F2Da07f0AABf75F85766EAFDA615";

  // Get contract instance
  const VotingAuth = await ethers.getContractFactory("VotingAuth");
  const votingAuth = VotingAuth.attach(votingAuthAddress).connect(signer);

  console.log("VotingAuth contract attached");

  try {
    // Check if user is registered
    const userAddress = await signer.getAddress();
    console.log("Checking user profile for:", userAddress);

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

