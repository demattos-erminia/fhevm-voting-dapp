"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Proposal, VoteStats } from "@/types";
import { formatAddress, formatTimeRemaining, formatTimestamp } from "@/lib/utils";

interface VotingInterfaceProps {
  proposal: Proposal;
  stats: VoteStats | null;
  hasVoted: boolean;
  canVote: boolean;
  onCastVote: (optionIndex: number) => Promise<void>;
  onRevealResults: () => Promise<void>;
  onBack: () => void;
  isLoading: boolean;
  userAddress: string | undefined;
}

export const VotingInterface = ({
  proposal,
  stats,
  hasVoted,
  canVote,
  onCastVote,
  onRevealResults,
  onBack,
  isLoading,
  userAddress,
}: VotingInterfaceProps) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now() / 1000);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now() / 1000);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleVote = async () => {
    if (selectedOption === null) {
      alert("Please select an option to vote");
      return;
    }

    await onCastVote(selectedOption);
  };

  const getProposalStatus = () => {
    if (currentTime < proposal.startTime) {
      return { status: "Not Started", color: "text-gray-500", canVote: false };
    }
    if (currentTime <= proposal.endTime) {
      return { status: "Active", color: "text-green-600", canVote: true };
    }
    if (!proposal.isRevealed) {
      return { status: "Ended - Results Pending", color: "text-orange-600", canVote: false };
    }
    return { status: "Completed", color: "text-blue-600", canVote: false };
  };

  const { status, color, canVote: isVotingActive } = getProposalStatus();
  const timeRemaining = proposal.endTime - currentTime;
  const showTimer = currentTime >= proposal.startTime && currentTime <= proposal.endTime;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          ← Back to Proposals
        </Button>
        <div className={`text-lg font-semibold ${color}`}>
          {status}
        </div>
      </div>

      {/* Proposal Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{proposal.title}</CardTitle>
          <CardDescription className="text-base">
            {proposal.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <div className="text-sm text-gray-600 mb-1">Created by</div>
              <div className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                {formatAddress(proposal.creator)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Voting Period</div>
              <div className="text-sm">
                {formatTimestamp(proposal.startTime)} - {formatTimestamp(proposal.endTime)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Total Voters</div>
              <div className="text-lg font-semibold">
                {stats?.totalVoters ?? 0}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Min Votes to Reveal</div>
              <div className="text-lg font-semibold">
                {proposal.minVotesForReveal}
              </div>
            </div>
          </div>

          {/* Timer */}
          {showTimer && timeRemaining > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600">Time Remaining</span>
                <span className="font-medium text-green-600">
                  {formatTimeRemaining(timeRemaining)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-600 h-3 rounded-full transition-all duration-1000"
                  style={{
                    width: `${Math.max(0, (timeRemaining / (proposal.endTime - proposal.startTime)) * 100)}%`
                  }}
                ></div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Voting Section */}
      {isVotingActive && canVote && !hasVoted && (
        <Card>
          <CardHeader>
            <CardTitle>Cast Your Vote</CardTitle>
            <CardDescription>
              Your vote will be encrypted and remain private. Select one option below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mb-6">
              {proposal.options.map((option, index) => (
                <div
                  key={index}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedOption === index
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setSelectedOption(index)}
                >
                  <div className="flex items-center">
                    <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                      selectedOption === index
                        ? "border-blue-500 bg-blue-500"
                        : "border-gray-300"
                    }`}>
                      {selectedOption === index && (
                        <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                      )}
                    </div>
                    <span className="text-lg">{option}</span>
                  </div>
                </div>
              ))}
            </div>

            <Button
              onClick={handleVote}
              className="w-full"
              size="lg"
              loading={isLoading}
              disabled={selectedOption === null}
            >
              {isLoading ? "Submitting Vote..." : "Submit Encrypted Vote"}
            </Button>

            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="text-sm text-yellow-800">
                <strong>🔐 Privacy Protected:</strong> Your vote will be encrypted using FHE technology.
                No one can see your selection until the voting period ends and results are revealed.
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Already Voted */}
      {hasVoted && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Vote Submitted Successfully
              </h3>
              <p className="text-gray-600 mb-4">
                Your encrypted vote has been recorded on the blockchain.
              </p>
              <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Vote Confirmed
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reveal Results */}
      {currentTime > proposal.endTime && !proposal.isRevealed && stats?.canReveal && (
        <Card>
          <CardHeader>
            <CardTitle>Reveal Voting Results</CardTitle>
            <CardDescription>
              The voting period has ended. As the proposal creator, you can now reveal the results.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="text-sm text-blue-800">
                <strong>Requirements met:</strong>
                <ul className="mt-2 space-y-1">
                  <li>• Voting period ended</li>
                  <li>• {stats.totalVoters} votes cast (minimum: {proposal.minVotesForReveal})</li>
                  <li>• You are the proposal creator</li>
                </ul>
              </div>
            </div>

            <Button
              onClick={onRevealResults}
              className="w-full"
              loading={isLoading}
            >
              {isLoading ? "Revealing Results..." : "Reveal Results"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results Revealed */}
      {proposal.isRevealed && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Results Will Be Available Soon
              </h3>
              <p className="text-gray-600">
                The voting results are being decrypted. Check back in a few moments.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cannot Vote */}
      {!canVote && isVotingActive && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <div className="text-4xl mb-4">🚫</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Cannot Vote
              </h3>
              <p className="text-gray-600">
                You need to register as a voter before participating in proposals.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
