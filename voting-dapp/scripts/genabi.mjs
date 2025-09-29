import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

// Contract names to generate ABI for
const CONTRACTS = ["VotingCore", "ProposalManager", "VotingAuth"];

// <root>/fhevm-hardhat-template
const rel = "../fhevm-hardhat-template";

// <root>/voting-dapp/src/abi
const outdir = path.resolve("./src/abi");

if (!fs.existsSync(outdir)) {
  fs.mkdirSync(outdir, { recursive: true });
}

const dir = path.resolve(rel);
const dirname = path.basename(dir);

const line =
  "\n===================================================================\n";

if (!fs.existsSync(dir)) {
  console.error(
    `${line}Unable to locate ${rel}. Expecting <root>/${dirname}${line}`
  );
  process.exit(1);
}

if (!fs.existsSync(outdir)) {
  console.error(`${line}Unable to locate ${outdir}.${line}`);
  process.exit(1);
}

const deploymentsDir = path.join(dir, "deployments");

function readDeployment(chainName, chainId, contractName, optional) {
  const chainDeploymentDir = path.join(deploymentsDir, chainName);
  const contractFile = path.join(chainDeploymentDir, `${contractName}.json`);

  if (!fs.existsSync(chainDeploymentDir) || !fs.existsSync(contractFile)) {
    if (!optional) {
      console.error(
        `${line}Unable to locate '${contractFile}'.\n\n1. Goto '${dirname}' directory\n2. Run 'npx hardhat run deploy/deploy-voting.ts --network ${chainName}'.${line}`
      );
      process.exit(1);
    }
    return undefined;
  }

  const jsonString = fs.readFileSync(contractFile, "utf-8");
  const obj = JSON.parse(jsonString);
  obj.chainId = chainId;

  return obj;
}

// Auto deployed on localhost
const deployLocalhost = {};
CONTRACTS.forEach(contractName => {
  deployLocalhost[contractName] = readDeployment("localhost", 31337, contractName, false);
});

// Sepolia is optional
const deploySepolia = {};
CONTRACTS.forEach(contractName => {
  let deployment = readDeployment("sepolia", 11155111, contractName, true);
  if (!deployment) {
    deployment = {
      abi: deployLocalhost[contractName].abi,
      address: "0x0000000000000000000000000000000000000000"
    };
  }
  deploySepolia[contractName] = deployment;
});

// Check ABI consistency
CONTRACTS.forEach(contractName => {
  if (deployLocalhost[contractName] && deploySepolia[contractName]) {
    if (
      JSON.stringify(deployLocalhost[contractName].abi) !== JSON.stringify(deploySepolia[contractName].abi)
    ) {
      console.error(
        `${line}Deployments of ${contractName} on localhost and Sepolia differ. Can't use the same abi on both networks. Consider re-deploying the contracts on both networks.${line}`
      );
      process.exit(1);
    }
  }
});

// Generate ABI files
CONTRACTS.forEach(contractName => {
  const tsCode = `
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const ${contractName}ABI = ${JSON.stringify({ abi: deployLocalhost[contractName].abi }, null, 2)} as const;
\n`;

  const tsAddresses = `
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const ${contractName}Addresses = {
  "11155111": { address: "${deploySepolia[contractName].address}", chainId: 11155111, chainName: "sepolia" },
  "31337": { address: "${deployLocalhost[contractName].address}", chainId: 31337, chainName: "hardhat" },
};
`;

  console.log(`Generated ${path.join(outdir, `${contractName}ABI.ts`)}`);
  console.log(`Generated ${path.join(outdir, `${contractName}Addresses.ts`)}`);

  fs.writeFileSync(path.join(outdir, `${contractName}ABI.ts`), tsCode, "utf-8");
  fs.writeFileSync(
    path.join(outdir, `${contractName}Addresses.ts`),
    tsAddresses,
    "utf-8"
  );
});

console.log(`${line}ABI generation completed!${line}`);
