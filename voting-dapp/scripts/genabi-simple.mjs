import * as fs from "fs";
import * as path from "path";

// Contract names
const CONTRACTS = ["VotingCore", "ProposalManager", "VotingAuth"];

// Paths
const artifactsDir = path.resolve("../fhevm-hardhat-template/artifacts/contracts");
const outdir = path.resolve("./src/abi");

if (!fs.existsSync(outdir)) {
  fs.mkdirSync(outdir, { recursive: true });
}

console.log("Generating ABI files from artifacts...");

CONTRACTS.forEach(contractName => {
  const artifactPath = path.join(artifactsDir, `${contractName}.sol`, `${contractName}.json`);

  if (!fs.existsSync(artifactPath)) {
    console.error(`Artifact not found: ${artifactPath}`);
    return;
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));

  // Generate ABI file
  const tsCode = `
/*
  This file is auto-generated from artifacts.
  Contract: ${contractName}
*/
export const ${contractName}ABI = ${JSON.stringify({ abi: artifact.abi }, null, 2)} as const;
\n`;

  // Generate addresses file (placeholder addresses)
  const tsAddresses = `
/*
  This file is auto-generated from artifacts.
  Contract: ${contractName}
*/
export const ${contractName}Addresses = {
  "11155111": { address: "0x0000000000000000000000000000000000000000", chainId: 11155111, chainName: "sepolia" },
  "31337": { address: "0x0000000000000000000000000000000000000000", chainId: 31337, chainName: "hardhat" },
};
`;

  fs.writeFileSync(path.join(outdir, `${contractName}ABI.ts`), tsCode, "utf-8");
  fs.writeFileSync(path.join(outdir, `${contractName}Addresses.ts`), tsAddresses, "utf-8");

  console.log(`Generated ${contractName}ABI.ts`);
  console.log(`Generated ${contractName}Addresses.ts`);
});

console.log("ABI generation completed!");
