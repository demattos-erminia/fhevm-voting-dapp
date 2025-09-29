"use client";

import { useState, useEffect, useMemo } from "react";
import { WalletConnect } from "@/components/voting/WalletConnect";
import { CreateProposalForm } from "@/components/voting/CreateProposalForm";
import { ProposalList } from "@/components/voting/ProposalList";
import { VotingInterface } from "@/components/voting/VotingInterface";
import { ResultsVisualization } from "@/components/voting/ResultsVisualization";
import { VotingHistory } from "@/components/voting/VotingHistory";
import { PrivacyProtection } from "@/components/voting/PrivacyProtection";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { useVotingContract } from "@/hooks/useVotingContract";
import { useMetaMaskSigner } from "@/hooks/wallet/useMetaMaskSigner";
import { Proposal, VoteStats } from "@/types";

type Mode = "real" | "mock";
type View = "home" | "create" | "proposals" | "voting" | "results" | "history" | "privacy";

export default function Home() {
  const [mode, setMode] = useState<Mode>("mock"); // Default to mock mode for development
  const [currentView, setCurrentView] = useState<View>("home");
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [proposalStats, setProposalStats] = useState<VoteStats | null>(null);
  const [hasVoted, setHasVoted] = useState(false);

  // Real data states
  const [realProposals, setRealProposals] = useState<Proposal[]>([]);
  const [realActiveProposals, setRealActiveProposals] = useState<Proposal[]>([]);
  const [realEndedProposals, setRealEndedProposals] = useState<Proposal[]>([]);
  const [isLoadingProposals, setIsLoadingProposals] = useState(false);
  const [proposalsError, setProposalsError] = useState<string | null>(null);

  // Results data states
  const [currentResults, setCurrentResults] = useState<number[]>([]);
  const [isLoadingResults, setIsLoadingResults] = useState(false);

  const mockChains = useMemo(() => ({ 31337: "http://localhost:8545" }), []); // Always include localhost as mock chain
  const { accounts, isConnected, chainId, switchToChain, signer: metaMaskSigner, provider: metaMaskProvider } = useMetaMaskSigner(mockChains);

  console.log("page.tsx MetaMask state:", {
    accounts: accounts?.length,
    isConnected,
    chainId,
    signer: !!metaMaskSigner,
    provider: !!metaMaskProvider
  });

  const votingContract = useVotingContract({
    signer: metaMaskSigner || undefined,
    provider: metaMaskProvider || undefined,
    chainId: chainId || undefined,
    isConnected,
    mockChains
  });

  // Load real proposals data
  const loadProposals = async () => {
    try {
      setIsLoadingProposals(true);
      setProposalsError(null);

      console.log(`Loading proposals in ${mode} mode...`);
      console.log(`Current chainId: ${chainId}, isConnected: ${isConnected}`);

      // Debug: Check MetaMask network
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        try {
          const network = await (window as any).ethereum.request({ method: 'eth_chainId' });
          console.log(`MetaMask chainId: ${parseInt(network, 16)}`);
        } catch (error) {
          console.error('Failed to get MetaMask chainId:', error);
        }
      }

      // Only proceed if we're on the correct network for the mode
      const expectedChainId = mode === "mock" ? 31337 : 11155111;
      if (chainId !== expectedChainId) {
        console.log(`Skipping load - wrong network. Expected: ${expectedChainId}, Current: ${chainId}`);
        return;
      }

      // Test basic contract connectivity first
      try {
        const proposalCount = await votingContract.votingCore?.proposalCount();
        console.log("Current proposal count:", proposalCount);
      } catch (error) {
        console.error("Failed to get proposal count:", error);
        throw error; // Re-throw to prevent further execution
      }

      const activeProposals = await votingContract.getActiveProposals();
      console.log("Active proposals loaded:", activeProposals.length);

      const endedProposals = await votingContract.getEndedProposals();
      console.log("Ended proposals loaded:", endedProposals.length);

      // Remove duplicates - a proposal should only be in one category
      const activeIds = new Set(activeProposals.map(p => p.id));
      const uniqueEndedProposals = endedProposals.filter(p => !activeIds.has(p.id));

      const allProposals = [...activeProposals, ...uniqueEndedProposals];

      setRealProposals(allProposals);
      setRealActiveProposals(activeProposals);
      setRealEndedProposals(uniqueEndedProposals);

      console.log(`Successfully loaded ${allProposals.length} total proposals`);
    } catch (error: any) {
      console.error("Failed to load proposals:", error);
      setProposalsError(error.message || "Failed to load proposals");

      // In mock mode, show a helpful error message
      if (mode === "mock") {
        setProposalsError("Mock mode: Ensure local Hardhat node is running and contracts are deployed");
      }

      // Fallback to empty arrays
      setRealProposals([]);
      setRealActiveProposals([]);
      setRealEndedProposals([]);
    } finally {
      setIsLoadingProposals(false);
    }
  };

  // Load proposals when mode changes, network is ready, or when contract is ready
  useEffect(() => {
    const loadProposalsIfReady = () => {
      // Only load proposals if we're connected and contract is ready
      // Don't check chainId here as it might be stale during network switches
      if (isConnected && votingContract.votingCoreAddress) {
        console.log(`Loading proposals for ${mode} mode (current chainId: ${chainId})`);
        loadProposals();
      } else {
        console.log(`Skipping proposal load: connected=${isConnected}, chainId=${chainId}, contractReady=${!!votingContract.votingCoreAddress}`);
      }
    };

    // Add a small delay to allow network switching to complete
    const timeoutId = setTimeout(loadProposalsIfReady, 2000);

    return () => clearTimeout(timeoutId);
  }, [mode, chainId, isConnected, votingContract.votingCoreAddress]);

  // Handle mode changes - switch to appropriate network
  useEffect(() => {
    const switchNetworkForMode = async () => {
      if (!isConnected || !switchToChain) return;

      const targetChainId = mode === "mock" ? 31337 : 11155111;

      // Only switch if we're not already on the target network
      if (chainId === targetChainId) {
        console.log(`Already on correct network ${chainId} for ${mode} mode`);
        return;
      }

      try {
        console.log(`Switching to chain ${targetChainId} for ${mode} mode...`);
        await switchToChain(targetChainId);
        console.log(`Network switch completed for ${mode} mode`);

      } catch (error) {
        console.error("Failed to switch network:", error);
        // Show user-friendly error message
        if (mode === "mock") {
          alert(`Failed to switch to localhost network. Please ensure Hardhat node is running and manually switch to localhost:8545 in MetaMask.`);
        } else {
          alert(`Failed to switch to Sepolia network. Please manually switch in MetaMask.`);
        }
      }
    };

    // Switch network when mode changes
    switchNetworkForMode();
  }, [mode, chainId, isConnected, switchToChain]);

  // Load proposal stats when proposal is selected
  useEffect(() => {
    const loadProposalStats = async () => {
      if (selectedProposal && votingContract && accounts?.[0]) {
        try {
          const stats = await votingContract.getProposalStats(selectedProposal.id);
          setProposalStats(stats);

          // Check if user has voted
          const voted = await votingContract.hasUserVoted(selectedProposal.id, accounts[0]);
          setHasVoted(voted);
        } catch (error) {
          console.error("Failed to load proposal stats:", error);
          setProposalStats(null);
          setHasVoted(false);
        }
      } else {
        setProposalStats(null);
        setHasVoted(false);
      }
    };

    loadProposalStats();
  }, [selectedProposal, votingContract, accounts]);

  // Refresh proposals after creating a new one
  const refreshProposals = () => {
    loadProposals();
  };

  const handleEnterVoting = () => {
    setCurrentView("proposals");
  };

  const handleCreateProposal = () => {
    setCurrentView("create");
  };

  const handleViewProposals = () => {
    setCurrentView("proposals");
  };

  const handleViewHistory = () => {
    setCurrentView("history");
  };

  const handleViewPrivacy = () => {
    setCurrentView("privacy");
  };

  const handleBackToHome = () => {
    setCurrentView("home");
    setSelectedProposal(null);
  };

  // Load results for selected proposal
  const loadProposalResults = async (proposal: Proposal | null) => {
    if (!proposal) {
      setCurrentResults([]);
      return;
    }

    setIsLoadingResults(true);
    try {
      if (!proposal.isRevealed) {
        setCurrentResults([]); // No results available yet
      } else {
        const results = await votingContract.getDecryptedResults(proposal.id);
        setCurrentResults(results || []);
      }
    } catch (error) {
      console.error("Failed to get proposal results:", error);
      setCurrentResults([]);
    } finally {
      setIsLoadingResults(false);
    }
  };

  // Load results when proposal or view changes
  useEffect(() => {
    if (currentView === "results" && selectedProposal) {
      loadProposalResults(selectedProposal);
    }
  }, [selectedProposal, currentView, mode]);

  const handleProposalSubmit = async (proposalData: any) => {
    console.log("=== handleProposalSubmit called ===");
    console.log("MetaMask state:", {
      accounts: accounts?.length,
      isConnected,
      chainId,
      signer: !!metaMaskSigner,
      provider: !!metaMaskProvider
    });
    console.log("Voting contract state:", {
      votingCore: !!votingContract.votingCore,
      votingAuth: !!votingContract.votingAuth,
      votingCoreAddress: votingContract.votingCoreAddress,
      error: votingContract.error
    });

    const result = await votingContract.createProposal(
      proposalData.title,
      proposalData.description,
      proposalData.options,
      proposalData.duration,
      proposalData.minVotesForReveal
    );

    if (result !== null) {
      alert(`Proposal created successfully! ID: ${result}`);
      setCurrentView("proposals");
      // Refresh proposals list
      refreshProposals();
    } else {
      // Check if it's a MetaMask circuit breaker error
      if (votingContract.error && votingContract.error.includes("circuit breaker")) {
        alert(`MetaMask security protection is blocking the transaction. Please try one of these solutions:

1. Refresh the page and try again
2. In MetaMask: Go to Settings > Advanced > Reset Account
3. Or switch to a different account and try again

This is a MetaMask security feature that sometimes triggers with local development networks.`);
      } else {
        alert("Failed to create proposal. Please try again.");
      }
    }
  };

  const handleSelectProposal = async (proposalIdOrProposal: any) => {
    console.log("handleSelectProposal called with:", proposalIdOrProposal, "type:", typeof proposalIdOrProposal);

    let proposal;
    if (typeof proposalIdOrProposal === 'number') {
      // It's a proposalId, need to fetch the full proposal
      console.log("Fetching proposal for id:", proposalIdOrProposal);
      proposal = await votingContract.getProposal(proposalIdOrProposal);
      console.log("Fetched proposal:", proposal);
    } else {
      // It's already a full proposal object
      proposal = proposalIdOrProposal;
    }

    if (proposal) {
      setSelectedProposal(proposal);
      setCurrentView("voting");
    } else {
      console.error("Failed to get proposal data for:", proposalIdOrProposal);
    }
  };

  const handleViewResults = (proposal: any) => {
    setSelectedProposal(proposal);
    setCurrentView("results");
  };

  const handleCastVote = async (optionIndex: number) => {
    if (!selectedProposal) return;

    const success = await votingContract.castVote(selectedProposal.id, optionIndex);
    if (success) {
      alert("Vote submitted successfully!");
      // Refresh proposal data
      const updatedProposal = await votingContract.getProposal(selectedProposal.id);
      if (updatedProposal) {
        setSelectedProposal(updatedProposal);
      }
    } else {
      alert("Failed to submit vote. Please try again.");
    }
  };

  const handleRevealResults = async () => {
    if (!selectedProposal) return;

    const success = await votingContract.revealResults(selectedProposal.id);
    if (success) {
      alert("Results revealed successfully!");
      // Refresh proposal data
      const updatedProposal = await votingContract.getProposal(selectedProposal.id);
      if (updatedProposal) {
        setSelectedProposal(updatedProposal);
      }
    } else {
      alert("Failed to reveal results. Please try again.");
    }
  };

  // Get current proposals based on mode
  const getCurrentProposals = () => {
    // Both real and mock mode now use the same data source (real contracts)
    // In mock mode, it will connect to local Hardhat node
    return {
      active: realActiveProposals,
      ended: realEndedProposals
    };
  };

  if (currentView === "create") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => setCurrentView("proposals")}>
            ← Back to Proposals
          </Button>
          <div className="text-sm text-gray-600">
            Mode: {mode === "real" ? "Real Network" : "Mock Mode"}
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <CreateProposalForm
            onSubmit={handleProposalSubmit}
            isLoading={votingContract.isLoading}
          />
        </div>
      </div>
    );
  }

  if (currentView === "voting" && selectedProposal) {
    return (
      <VotingInterface
        proposal={selectedProposal}
        stats={proposalStats}
        hasVoted={hasVoted}
        canVote={!hasVoted && selectedProposal && Date.now() / 1000 <= selectedProposal.endTime}
        onCastVote={handleCastVote}
        onRevealResults={handleRevealResults}
        onBack={() => setCurrentView("proposals")}
        isLoading={votingContract.isLoading}
        userAddress={accounts?.[0]}
      />
    );
  }

  if (currentView === "results" && selectedProposal) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => setCurrentView("proposals")}>
            ← Back to Proposals
          </Button>
          <div className="text-sm text-gray-600">
            Proposal #{selectedProposal.id} - {selectedProposal.title}
          </div>
        </div>

        {isLoadingResults ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading results...</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <ResultsVisualization
            results={currentResults}
            options={selectedProposal.options}
            totalVotes={currentResults.reduce((a, b) => a + b, 0)}
            isRevealed={selectedProposal.isRevealed}
          />
        )}
      </div>
    );
  }

  if (currentView === "history") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={handleBackToHome}>
            ← Back to Home
          </Button>
          <div className="text-sm text-gray-600">
            Mode: {mode === "real" ? "Real Network" : "Mock Mode"}
          </div>
        </div>

        <VotingHistory
          userAddress={accounts?.[0] || ""}
          onSelectProposal={handleSelectProposal}
          isLoading={votingContract.isLoading}
          votingContract={votingContract}
        />
      </div>
    );
  }

  if (currentView === "privacy") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={handleBackToHome}>
            ← Back to Home
          </Button>
          <div className="text-sm text-gray-600">
            Mode: {mode === "real" ? "Real Network" : "Mock Mode"}
          </div>
        </div>

        <PrivacyProtection showDetailed={true} />
      </div>
    );
  }

  if (currentView === "proposals") {
    const currentProposals = getCurrentProposals();

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={handleBackToHome}>
            ← Back to Home
          </Button>
          <div className="flex items-center gap-4">
            <Button onClick={handleCreateProposal}>
              Create Proposal
            </Button>
            <Button variant="outline" onClick={handleViewHistory}>
              My History
            </Button>
            <div className="text-sm text-gray-600">
              Mode: {mode === "real" ? "Real Network" : "Mock Mode"}
            </div>
          </div>
        </div>

        {/* Error Display */}
        {mode === "real" && proposalsError && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="py-4">
              <div className="text-center text-red-600">
                <p className="font-medium">Failed to load proposals</p>
                <p className="text-sm">{proposalsError}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={refreshProposals}
                >
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Wallet Connection */}
          <div className="lg:col-span-1">
            <WalletConnect mockChains={mockChains} />
          </div>

          {/* Proposals */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Active Proposals</CardTitle>
                  <CardDescription>
                    Currently active voting proposals
                  </CardDescription>
                </CardHeader>
              </Card>

              <ProposalList
                proposals={currentProposals.active}
                onSelectProposal={handleSelectProposal}
                isLoading={mode === "real" ? isLoadingProposals : votingContract.isLoading}
                emptyMessage="No active proposals"
              />

              <Card>
                <CardHeader>
                  <CardTitle>Ended Proposals</CardTitle>
                  <CardDescription>
                    Completed voting proposals with results
                  </CardDescription>
                </CardHeader>
              </Card>

              <ProposalList
                proposals={currentProposals.ended}
                onSelectProposal={handleSelectProposal}
                isLoading={mode === "real" ? isLoadingProposals : votingContract.isLoading}
                emptyMessage="No ended proposals"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero Section */}
      <Card className="mb-8">
        <CardContent className="text-center py-12">
          <div className="text-8xl mb-6">🔐</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Privacy-First Voting
          </h2>
          <p className="text-xl text-gray-600 mb-6 max-w-2xl mx-auto">
            Experience truly private voting powered by Fully Homomorphic Encryption.
            Your vote remains encrypted throughout the entire process, ensuring
            maximum privacy and security.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="text-center">
              <div className="text-4xl mb-2">🔒</div>
              <h3 className="font-semibold text-gray-900">Encrypted Votes</h3>
              <p className="text-sm text-gray-600">Votes are encrypted and unreadable</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">🎯</div>
              <h3 className="font-semibold text-gray-900">Verifiable Results</h3>
              <p className="text-sm text-gray-600">Results can be verified when revealed</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">⚡</div>
              <h3 className="font-semibold text-gray-900">Real-time Updates</h3>
              <p className="text-sm text-gray-600">Live voting status and progress</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Button
          size="lg"
          onClick={handleEnterVoting}
          className="h-16 flex-col"
        >
          <span className="text-2xl mb-1">🗳️</span>
          <span>Start Voting</span>
        </Button>

        <Button
          size="lg"
          variant="outline"
          onClick={handleViewHistory}
          className="h-16 flex-col"
        >
          <span className="text-2xl mb-1">📋</span>
          <span>My History</span>
        </Button>

        <Button
          size="lg"
          variant="outline"
          onClick={handleViewPrivacy}
          className="h-16 flex-col"
        >
          <span className="text-2xl mb-1">🔐</span>
          <span>Privacy Info</span>
        </Button>
      </div>

      {/* Mode Selection */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Choose Your Mode</CardTitle>
          <CardDescription>
            Select whether to use real blockchain networks or local mock environment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                mode === "real"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => setMode("real")}
            >
              <div className="text-3xl mb-3">🌐</div>
              <h3 className="font-semibold text-gray-900 mb-2">Real Network</h3>
              <p className="text-sm text-gray-600 mb-3">
                Connect to Sepolia testnet with real FHEVM functionality
              </p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• Full FHEVM encryption</li>
                <li>• Real blockchain transactions</li>
                <li>• Production-ready environment</li>
              </ul>
            </div>

            <div
              className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                mode === "mock"
                  ? "border-green-500 bg-green-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => setMode("mock")}
            >
              <div className="text-3xl mb-3">🧪</div>
              <h3 className="font-semibold text-gray-900 mb-2">Mock Mode</h3>
              <p className="text-sm text-gray-600 mb-3">
                Use local Hardhat node with simulated FHEVM operations
              </p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• Fast local development</li>
                <li>• Simulated encryption</li>
                <li>• No real blockchain costs</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>🔐 Privacy Protection</CardTitle>
            <CardDescription>
              Your votes are encrypted using FHE technology
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• End-to-end vote encryption</li>
              <li>• Zero-knowledge proofs</li>
              <li>• Anonymous voting results</li>
              <li>• Verifiable computation</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>⚙️ Advanced Features</CardTitle>
            <CardDescription>
              Powerful voting capabilities with smart controls
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Conditional result revelation</li>
              <li>• Multi-option voting support</li>
              <li>• Real-time progress tracking</li>
              <li>• Comprehensive result visualization</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}