import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("Deploying FHEVM Voting Contracts...");

  // Deploy VotingAuth contract
  const votingAuth = await deploy("VotingAuth", {
    from: deployer,
    log: true,
  });

  console.log(`VotingAuth contract: ${votingAuth.address}`);

  // Deploy VotingCore contract
  const votingCore = await deploy("VotingCore", {
    from: deployer,
    log: true,
  });

  console.log(`VotingCore contract: ${votingCore.address}`);

  // Deploy ProposalManager contract with VotingCore address
  const proposalManager = await deploy("ProposalManager", {
    from: deployer,
    args: [votingCore.address],
    log: true,
  });

  console.log(`ProposalManager contract: ${proposalManager.address}`);

  console.log("All voting contracts deployed successfully!");
  console.log("========================================");
  console.log(`VotingAuth: ${votingAuth.address}`);
  console.log(`VotingCore: ${votingCore.address}`);
  console.log(`ProposalManager: ${proposalManager.address}`);
  console.log("========================================");
};

export default func;
func.id = "deploy_voting_system"; // id required to prevent reexecution
func.tags = ["VotingAuth", "VotingCore", "ProposalManager"];
