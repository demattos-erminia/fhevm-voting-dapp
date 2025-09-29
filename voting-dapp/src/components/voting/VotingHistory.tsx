"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatTimestamp } from "@/lib/utils";

interface VotingHistoryItem {
  proposalId: number;
  proposalTitle: string;
  votedAt: number;
  hasVoted: boolean;
  status: 'active' | 'ended' | 'revealed';
  endTime: number;
  totalVotes?: number;
}

interface VotingHistoryProps {
  userAddress: string;
  onSelectProposal: (proposalId: number) => void;
  isLoading?: boolean;
  votingContract?: any;
}

export const VotingHistory = ({
  userAddress,
  onSelectProposal,
  isLoading = false,
  votingContract
}: VotingHistoryProps) => {
  const [history, setHistory] = useState<VotingHistoryItem[]>([]);
  const [currentTime, setCurrentTime] = useState(Date.now() / 1000);
  const [stats, setStats] = useState({
    proposalsVoted: 0,
    activeProposals: 0,
    resultsAvailable: 0
  });

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now() / 1000);
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Load voting history from contracts
  useEffect(() => {
    const loadVotingHistory = async () => {
      if (!userAddress || !votingContract || !votingContract.votingCore) {
        setHistory([]);
        return;
      }

      try {
        // Get all proposal IDs where user has voted
        const votedProposalIds = await votingContract.getUserVotedProposals(userAddress);

        const historyItems: VotingHistoryItem[] = [];

        console.log("votedProposalIds from contract:", votedProposalIds);
        for (const proposalId of votedProposalIds) {
          console.log("Processing proposalId:", proposalId, "type:", typeof proposalId);
          try {
            // Get proposal details
            const proposal = await votingContract.getProposal(proposalId);
            if (!proposal) continue;

            // Get proposal stats
            const stats = await votingContract.getProposalStats(proposalId);

            // Determine status
            let status: 'active' | 'ended' | 'revealed' = 'active';
            if (proposal.isRevealed) {
              status = 'revealed';
            } else if (currentTime > proposal.endTime) {
              status = 'ended';
            }

            historyItems.push({
              proposalId,
              proposalTitle: proposal.title,
              votedAt: Date.now() / 1000, // We don't store exact vote time, use current time as approximation
              hasVoted: true,
              status,
              endTime: proposal.endTime,
              totalVotes: stats?.totalVoters || 0,
            });
          } catch (err) {
            console.error(`Failed to load proposal ${proposalId}:`, err);
          }
        }

        setHistory(historyItems);

        // Calculate statistics
        const historyProposalIds = historyItems.map(item => item.proposalId);
        const proposalsVoted = historyProposalIds.length;

        // Get all proposals to calculate active and results available
        let activeProposals = 0;
        let resultsAvailable = 0;

        try {
          if (votingContract) {
            const allActiveProposals = await votingContract.getActiveProposals();
            activeProposals = allActiveProposals.length;

            const allEndedProposals = await votingContract.getEndedProposals();
            // Count proposals that have results available (isRevealed = true)
            for (const proposal of allEndedProposals) {
              if (proposal.isRevealed) {
                resultsAvailable++;
              }
            }
          }
        } catch (error) {
          console.error("Failed to load proposal statistics:", error);
        }

        setStats({
          proposalsVoted,
          activeProposals,
          resultsAvailable
        });

      } catch (err) {
        console.error("Failed to load voting history:", err);
        setHistory([]);
        setStats({
          proposalsVoted: 0,
          activeProposals: 0,
          resultsAvailable: 0
        });
      }
    };

    loadVotingHistory();
  }, [userAddress, votingContract?.votingCore]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'ended':
        return 'text-orange-600 bg-orange-100';
      case 'revealed':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'ended':
        return 'Ended';
      case 'revealed':
        return 'Results Available';
      default:
        return 'Unknown';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading voting history...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>My Voting History</CardTitle>
          <CardDescription>
            Track your participation in community proposals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Voting History
            </h3>
            <p className="text-gray-600 mb-6">
              Your voting history will be displayed here once you start participating in proposals.
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <div>✅ View all proposals you've interacted with</div>
              <div>✅ See your voting status for each proposal</div>
              <div>✅ Track proposal outcomes and results</div>
              <div>✅ Filter by voting status and time period</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* History Display - will show real data when implemented */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your recent proposal interactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {history.map((item) => (
                <div
                  key={item.proposalId}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium text-gray-900 line-clamp-1">
                        {item.proposalTitle}
                      </h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {getStatusText(item.status)}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>Proposal #{item.proposalId}</span>
                      {item.hasVoted ? (
                        <span className="text-green-600 flex items-center gap-1">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          Voted {formatTimestamp(item.votedAt)}
                        </span>
                      ) : (
                        <span className="text-orange-600 flex items-center gap-1">
                          <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                          Not voted
                        </span>
                      )}
                      {item.totalVotes && (
                        <span>{item.totalVotes} total votes</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.status === 'active' && !item.hasVoted && (
                      <Button
                        size="sm"
                        onClick={() => onSelectProposal(item.proposalId)}
                      >
                        Vote Now
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSelectProposal(item.proposalId)}
                    >
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics Card - will show real data when voting history is implemented */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {stats.proposalsVoted}
              </div>
              <div className="text-sm text-gray-600">Proposals Voted</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {stats.activeProposals}
              </div>
              <div className="text-sm text-gray-600">Active Proposals</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {stats.resultsAvailable}
              </div>
              <div className="text-sm text-gray-600">Results Available</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
