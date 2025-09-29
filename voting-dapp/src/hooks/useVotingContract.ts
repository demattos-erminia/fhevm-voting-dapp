"use client";

import { ethers } from "ethers";
import { useCallback, useEffect, useState } from "react";
import { useMetaMaskSigner } from "./wallet/useMetaMaskSigner";
import { useFhevm } from "../fhevm/useFhevm";
import { Proposal, VoteStats } from "../types";
import { VotingCoreABI } from "../abi/VotingCoreABI";
import { VotingAuthABI } from "../abi/VotingAuthABI";
import { ProposalManagerABI } from "../abi/ProposalManagerABI";
import { VotingCoreAddresses } from "../abi/VotingCoreAddresses";
import { VotingAuthAddresses } from "../abi/VotingAuthAddresses";
import { ProposalManagerAddresses } from "../abi/ProposalManagerAddresses";

export interface UseVotingContractState {
  // Contract instances
  votingCore: ethers.Contract | null;
  proposalManager: ethers.Contract | null;
  votingAuth: ethers.Contract | null;

  // Contract addresses
  votingCoreAddress: string | null;
  proposalManagerAddress: string | null;
  votingAuthAddress: string | null;

  // Loading states
  isLoading: boolean;
  error: string | null;

  // Contract functions
  createProposal: (
    title: string,
    description: string,
    options: string[],
    duration: number,
    minVotesForReveal: number
  ) => Promise<number | null>;

  getProposal: (proposalId: number) => Promise<Proposal | null>;
  getActiveProposals: () => Promise<Proposal[]>;
  getEndedProposals: () => Promise<Proposal[]>;
  getProposalStats: (proposalId: number) => Promise<VoteStats | null>;
  getUserVotedProposals: (userAddress: string) => Promise<number[]>;

  castVote: (proposalId: number, optionIndex: number) => Promise<boolean>;
  hasUserVoted: (proposalId: number, userAddress: string) => Promise<boolean>;

  revealResults: (proposalId: number) => Promise<boolean>;
  getDecryptedResults: (proposalId: number) => Promise<number[] | null>;

  // Auth functions
  registerUser: () => Promise<boolean>;
  getUserProfile: (address: string) => Promise<any>;
  canUserVote: (address: string) => Promise<boolean>;
}

export const useVotingContract = (params: {
  signer?: ethers.JsonRpcSigner;
  provider?: ethers.Eip1193Provider;
  chainId?: number;
  isConnected: boolean;
  mockChains?: Record<number, string>;
}): UseVotingContractState => {
  const { signer: metaMaskSigner, provider: metaMaskProvider, chainId, isConnected, mockChains } = params;

  console.log("useVotingContract state:", {
    metaMaskSigner: !!metaMaskSigner,
    metaMaskProvider: !!metaMaskProvider,
    chainId,
    isConnected
  });

  // In both mock and real modes, we use MetaMask for signing
  // The mockChains configuration tells MetaMask to connect to local hardhat node for chainId 31337
  const provider = metaMaskProvider;
  const signer = metaMaskSigner;

  // In mock mode, use direct localhost provider for FHEVM instance
  const fhevmProvider = chainId === 31337 ? "http://localhost:8545" : metaMaskProvider;

  const { instance: fhevmInstance, status: fhevmStatus } = useFhevm({
    provider: fhevmProvider, // Use direct localhost provider in mock mode
    chainId,
    enabled: !!chainId && !!fhevmProvider, // Only enable when connected and have provider
    initialMockChains: mockChains, // This tells useFhevm which chains are mock
  });

  const [votingCore, setVotingCore] = useState<ethers.Contract | null>(null);
  const [proposalManager, setProposalManager] = useState<ethers.Contract | null>(null);
  const [votingAuth, setVotingAuth] = useState<ethers.Contract | null>(null);

  const [votingCoreAddress, setVotingCoreAddress] = useState<string | null>(null);
  const [proposalManagerAddress, setProposalManagerAddress] = useState<string | null>(null);
  const [votingAuthAddress, setVotingAuthAddress] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Contract ABIs from generated files
  const votingCoreAbi = VotingCoreABI.abi;
  const proposalManagerAbi = ProposalManagerABI.abi;
  const votingAuthAbi = VotingAuthABI.abi;

  // Initialize contracts when signer and chainId are available
  useEffect(() => {
    console.log("initContracts effect triggered, signer:", !!signer, "chainId:", chainId);
    const initContracts = async () => {
      if (!signer || !chainId) {
        console.log("initContracts: missing signer or chainId, clearing contracts");
        setVotingCore(null);
        setProposalManager(null);
        setVotingAuth(null);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Get contract addresses from generated address files
        console.log("Looking up addresses for chainId:", chainId);
        const coreDeployment = VotingCoreAddresses[chainId.toString() as keyof typeof VotingCoreAddresses];
        const managerDeployment = ProposalManagerAddresses[chainId.toString() as keyof typeof ProposalManagerAddresses];
        const authDeployment = VotingAuthAddresses[chainId.toString() as keyof typeof VotingAuthAddresses];

        console.log("Deployments found:", {
          core: !!coreDeployment,
          manager: !!managerDeployment,
          auth: !!authDeployment
        });

        if (!coreDeployment || !managerDeployment || !authDeployment) {
          console.error("Missing deployment for chain", chainId);
          console.log("Available chains:", Object.keys(VotingCoreAddresses));
          throw new Error(`No deployment found for chain ${chainId}`);
        }

        const coreAddress = coreDeployment.address;
        const managerAddress = managerDeployment.address;
        const authAddress = authDeployment.address;

        const coreContract = new ethers.Contract(coreAddress, votingCoreAbi, signer);
        const managerContract = new ethers.Contract(managerAddress, proposalManagerAbi, signer);
        const authContract = new ethers.Contract(authAddress, votingAuthAbi, signer);

        setVotingCore(coreContract);
        setProposalManager(managerContract);
        setVotingAuth(authContract);

        setVotingCoreAddress(coreAddress);
        setProposalManagerAddress(managerAddress);
        setVotingAuthAddress(authAddress);

      } catch (err: any) {
        setError("Failed to initialize contracts: " + err.message);
        console.error("Contract initialization error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    initContracts();
  }, [signer, chainId]);

  const createProposal = useCallback(async (
    title: string,
    description: string,
    options: string[],
    duration: number,
    minVotesForReveal: number
  ): Promise<number | null> => {
    console.log("=== CREATE PROPOSAL STARTED ===");
    console.log("Title:", title);
    console.log("Description:", description);
    console.log("Options:", options);
    console.log("Duration:", duration);
    console.log("MinVotesForReveal:", minVotesForReveal);

    if (!votingCore || !votingAuth || !votingCoreAddress) {
      console.error("CONTRACTS NOT INITIALIZED");
      console.error("Debug info:", {
        votingCore: !!votingCore,
        votingAuth: !!votingAuth,
        votingCoreAddress,
        proposalManager: !!proposalManager,
        proposalManagerAddress,
        votingAuthAddress,
        signer: !!signer,
        chainId,
        isConnected
      });
      setError("Contracts not initialized");
      return null;
    }

    try {
      setIsLoading(true);
      console.log("Loading set to true");

      // Check if user is registered (this will trigger MetaMask signature)
      console.log("Checking user registration...");
      const userAddress = await signer!.getAddress();
      console.log("User address:", userAddress);

      try {
        const userProfile = await votingAuth.getUserProfile(userAddress);
        console.log("User profile retrieved:", userProfile);
        const isRegistered = userProfile[0];

        if (!isRegistered) {
          console.log("User not registered, registering...");
          console.log("VotingAuth address:", votingAuthAddress);
          console.log("Chain ID:", chainId);

          const registerTx = await votingAuth.registerUser();
          console.log("Register tx sent:", registerTx.hash);
          await registerTx.wait();
          console.log("User registered successfully");
        } else {
          console.log("User already registered");
        }
      } catch (registerError: any) {
        console.error("Registration error:", registerError);
        throw new Error(`User registration failed: ${registerError.message}`);
      }

      // Create the proposal (this will trigger MetaMask signature)
      console.log("Creating proposal...");
      console.log("VotingCore address:", votingCoreAddress);
      console.log("Proposal data:", { title, description, options, duration, minVotesForReveal });

      const tx = await votingCore.createProposal(
        title,
        description,
        options,
        duration,
        minVotesForReveal
      );

      console.log("Transaction sent:", tx.hash, "waiting for confirmation...");
      const receipt = await tx.wait();
      console.log("Transaction confirmed, gas used:", receipt.gasUsed);

      // Get the updated proposal count
      let contractForCall = votingCore;
      if (chainId === 31337 && votingCoreAddress) {
        const directProvider = new ethers.JsonRpcProvider('http://localhost:8545');
        contractForCall = new ethers.Contract(votingCoreAddress, votingCoreAbi, directProvider);
      }
      const proposalCount = await contractForCall.proposalCount();
      return Number(proposalCount);

    } catch (err: any) {
      console.error("=== CREATE PROPOSAL FAILED ===");
      console.error("Error message:", err.message);
      console.error("Error code:", err.code);
      console.error("Error data:", err.data);
      console.error("Full error:", err);
      setError("Failed to create proposal: " + err.message);
      console.error("Create proposal error:", err);
      return null;
    } finally {
      setIsLoading(false);
      console.log("=== CREATE PROPOSAL FINISHED ===");
    }
  }, [votingCore, votingCoreAddress, votingCoreAbi, chainId, votingAuth, signer]);

  const getProposal = useCallback(async (proposalId: number): Promise<Proposal | null> => {
    if (!votingCore || !votingCoreAddress) return null;

    try {
      // For mock mode, use direct localhost provider for read-only calls
      let contractForCall = votingCore;
      if (chainId === 31337) {
        const directProvider = new ethers.JsonRpcProvider('http://localhost:8545');
        contractForCall = new ethers.Contract(votingCoreAddress, votingCoreAbi, directProvider);
      }

      const proposalInfo = await contractForCall.getProposalInfo(proposalId);

      return {
        id: proposalId,
        creator: proposalInfo[0],
        title: proposalInfo[1],
        description: proposalInfo[2],
        options: proposalInfo[3],
        startTime: Number(proposalInfo[4]),
        endTime: Number(proposalInfo[5]),
        minVotesForReveal: Number(proposalInfo[6]),
        isActive: proposalInfo[7],
        isRevealed: proposalInfo[8],
      };
    } catch (err) {
      console.error("Failed to get proposal:", err);
      return null;
    }
  }, [votingCore, votingCoreAddress, votingCoreAbi, chainId]);

  const getActiveProposals = useCallback(async (): Promise<Proposal[]> => {
    if (!proposalManager || !proposalManagerAddress || !votingCore || !votingCoreAddress) return [];

    try {
      // For mock mode, use direct localhost provider for read-only calls
      let managerContract = proposalManager;
      if (chainId === 31337) {
        const directProvider = new ethers.JsonRpcProvider('http://localhost:8545');
        managerContract = new ethers.Contract(proposalManagerAddress, proposalManagerAbi, directProvider);
      }

      const activeIds = await managerContract.getActiveProposals();
      const proposals: Proposal[] = [];

      for (const id of activeIds) {
        const proposal = await getProposal(Number(id));
        if (proposal) proposals.push(proposal);
      }

      return proposals;
    } catch (err) {
      console.error("Failed to get active proposals:", err);
      return [];
    }
  }, [proposalManager, proposalManagerAddress, proposalManagerAbi, votingCore, votingCoreAddress, votingCoreAbi, chainId, getProposal]);

  const getEndedProposals = useCallback(async (): Promise<Proposal[]> => {
    if (!proposalManager || !proposalManagerAddress || !votingCore || !votingCoreAddress) return [];

    try {
      // For mock mode, use direct localhost provider for read-only calls
      let managerContract = proposalManager;
      if (chainId === 31337) {
        const directProvider = new ethers.JsonRpcProvider('http://localhost:8545');
        managerContract = new ethers.Contract(proposalManagerAddress, proposalManagerAbi, directProvider);
      }

      const endedIds = await managerContract.getEndedProposals();
      const proposals: Proposal[] = [];

      for (const id of endedIds) {
        const proposal = await getProposal(Number(id));
        if (proposal) proposals.push(proposal);
      }

      return proposals;
    } catch (err) {
      console.error("Failed to get ended proposals:", err);
      return [];
    }
  }, [proposalManager, proposalManagerAddress, proposalManagerAbi, votingCore, votingCoreAddress, votingCoreAbi, chainId, getProposal]);

  const getProposalStats = useCallback(async (proposalId: number): Promise<VoteStats | null> => {
    console.log("getProposalStats called with proposalId:", proposalId);
    console.log("proposalManager:", !!proposalManager, "proposalManagerAddress:", proposalManagerAddress);

    if (!proposalManager || !proposalManagerAddress) {
      console.error("getProposalStats: contracts not initialized");
      return null;
    }

    try {
      // For mock mode, use direct localhost provider for read-only calls
      let managerContract = proposalManager;
      if (chainId === 31337) {
        console.log("Creating direct contract for mock mode");
        const directProvider = new ethers.JsonRpcProvider('http://localhost:8545');
        managerContract = new ethers.Contract(proposalManagerAddress, proposalManagerAbi, directProvider);
        console.log("Direct contract created:", !!managerContract);
      }

      console.log("Calling getProposalStats on contract");
      const stats = await managerContract.getProposalStats(proposalId);
      console.log("getProposalStats result:", stats);
      return {
        totalVoters: Number(stats[0]),
        timeRemaining: Number(stats[1]),
        canVote: stats[2],
        canReveal: stats[3],
      };
    } catch (err) {
      console.error("Failed to get proposal stats:", err);
      return null;
    }
  }, [proposalManager, proposalManagerAddress, proposalManagerAbi, chainId]);

  const castVote = useCallback(async (proposalId: number, optionIndex: number): Promise<boolean> => {
    if (!votingCore || !fhevmInstance) {
      setError("Contracts not initialized");
      return false;
    }

    try {
      setIsLoading(true);

      // Create encrypted vote (value = 1 for selected option)
      const contractAddress = await votingCore.getAddress();
      const userAddress = await signer!.getAddress();

      // Create encrypted input using FHEVM instance
      const input = fhevmInstance.createEncryptedInput(contractAddress, userAddress);
      input.add32(BigInt(1)); // Vote value = 1

      // Encrypt the input
      const encryptedVote = await input.encrypt();

      const tx = await votingCore.castVote(
        proposalId,
        optionIndex,
        encryptedVote.handles[0],
        encryptedVote.inputProof
      );

      await tx.wait();
      return true;
    } catch (err: any) {
      setError("Failed to cast vote: " + err.message);
      console.error("Cast vote error:", err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [votingCore, fhevmInstance, signer]);

  const hasUserVoted = useCallback(async (proposalId: number, userAddress: string): Promise<boolean> => {
    console.log("hasUserVoted called with proposalId:", proposalId, "userAddress:", userAddress);
    console.log("votingCore:", !!votingCore, "votingCoreAddress:", votingCoreAddress);

    if (!votingCore || !votingCoreAddress) {
      console.error("hasUserVoted: contracts not initialized");
      return false;
    }

    try {
      // For mock mode, use direct localhost provider for read-only calls
      let contractForCall = votingCore;
      if (chainId === 31337) {
        console.log("Creating direct contract for hasUserVoted in mock mode");
        const directProvider = new ethers.JsonRpcProvider('http://localhost:8545');
        contractForCall = new ethers.Contract(votingCoreAddress, votingCoreAbi, directProvider);
        console.log("Direct contract created for hasUserVoted:", !!contractForCall);
      }

      console.log("Calling hasUserVoted on contract");
      const result = await contractForCall.hasUserVoted(proposalId, userAddress);
      console.log("hasUserVoted result:", result);
      return result;
    } catch (err) {
      console.error("Failed to check vote status:", err);
      return false;
    }
  }, [votingCore, votingCoreAddress, votingCoreAbi, chainId]);

  const revealResults = useCallback(async (proposalId: number): Promise<boolean> => {
    if (!votingCore) {
      setError("Voting contract not initialized");
      return false;
    }

    try {
      setIsLoading(true);

      const tx = await votingCore.revealResults(proposalId);
      await tx.wait();
      return true;
    } catch (err: any) {
      setError("Failed to reveal results: " + err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [votingCore]);

  const getDecryptedResults = useCallback(async (proposalId: number): Promise<number[] | null> => {
    if (!votingCore || !votingCoreAddress) return null;

    try {
      const proposal = await getProposal(proposalId);
      if (!proposal || !proposal.isRevealed) return null;

      // For mock mode, use direct localhost provider for read-only calls
      let contractForCall = votingCore;
      if (chainId === 31337) {
        const directProvider = new ethers.JsonRpcProvider('http://localhost:8545');
        contractForCall = new ethers.Contract(votingCoreAddress, votingCoreAbi, directProvider);
      }

      const results: number[] = [];
      for (let i = 0; i < proposal.options.length; i++) {
        const count = await contractForCall.getDecryptedVoteCount(proposalId, i);
        results.push(Number(count));
      }

      return results;
    } catch (err) {
      console.error("Failed to get decrypted results:", err);
      return null;
    }
  }, [votingCore, votingCoreAddress, votingCoreAbi, chainId, getProposal]);

  const registerUser = useCallback(async (): Promise<boolean> => {
    if (!votingAuth) {
      setError("Auth contract not initialized");
      return false;
    }

    try {
      setIsLoading(true);

      const tx = await votingAuth.registerUser();
      await tx.wait();
      return true;
    } catch (err: any) {
      setError("Failed to register user: " + err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [votingAuth]);

  const getUserProfile = useCallback(async (address: string): Promise<any> => {
    if (!votingAuth) return null;

    try {
      return await votingAuth.getUserProfile(address);
    } catch (err) {
      console.error("Failed to get user profile:", err);
      return null;
    }
  }, [votingAuth]);

  const canUserVote = useCallback(async (address: string): Promise<boolean> => {
    if (!votingAuth) return false;

    try {
      return await votingAuth.canUserVote(address);
    } catch (err) {
      console.error("Failed to check voting eligibility:", err);
      return false;
    }
  }, [votingAuth]);

  const getUserVotedProposals = useCallback(async (userAddress: string): Promise<number[]> => {
    if (!votingCore || !votingCoreAddress) return [];

    try {
      // For mock mode, use direct localhost provider for read-only calls
      let contractForCall = votingCore;
      if (chainId === 31337) {
        const directProvider = new ethers.JsonRpcProvider('http://localhost:8545');
        contractForCall = new ethers.Contract(votingCoreAddress, votingCoreAbi, directProvider);
      }

      const votedProposalIds = await contractForCall.getUserVotedProposals(userAddress);
      console.log("getUserVotedProposals raw result:", votedProposalIds);
      console.log("getUserVotedProposals type:", typeof votedProposalIds);
      console.log("getUserVotedProposals isArray:", Array.isArray(votedProposalIds));

      if (!Array.isArray(votedProposalIds)) {
        console.error("getUserVotedProposals did not return an array");
        return [];
      }

      const result = votedProposalIds.map((id: bigint) => {
        console.log("Converting proposalId:", id, "to number:", Number(id));
        const numId = Number(id);
        if (isNaN(numId) || numId <= 0) {
          console.error("Invalid proposalId:", id, "converted to:", numId);
          return null;
        }
        return numId;
      }).filter(id => id !== null) as number[];

      console.log("Final converted proposalIds:", result);
      return result;
    } catch (err) {
      console.error("Failed to get user voted proposals:", err);
      return [];
    }
  }, [votingCore, votingCoreAddress, votingCoreAbi, chainId]);

  return {
    votingCore,
    proposalManager,
    votingAuth,
    votingCoreAddress,
    proposalManagerAddress,
    votingAuthAddress,
    isLoading,
    error,
    createProposal,
    getProposal,
    getActiveProposals,
    getEndedProposals,
    getProposalStats,
    castVote,
    hasUserVoted,
    revealResults,
    getDecryptedResults,
    registerUser,
    getUserProfile,
    canUserVote,
    getUserVotedProposals,
  };
};
