"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Proposal } from "@/types";
import { formatAddress, formatTimeRemaining, formatTimestamp } from "@/lib/utils";

interface ProposalListProps {
  proposals: Proposal[];
  onSelectProposal: (proposal: Proposal) => void;
  isLoading?: boolean;
  emptyMessage?: string;
}

export const ProposalList = ({
  proposals,
  onSelectProposal,
  isLoading = false,
  emptyMessage = "No proposals found"
}: ProposalListProps) => {
  const [currentTime, setCurrentTime] = useState(Date.now() / 1000);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now() / 1000);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getProposalStatus = (proposal: Proposal) => {
    if (currentTime < proposal.startTime) {
      return { status: "Not Started", color: "text-gray-500" };
    }
    if (currentTime <= proposal.endTime) {
      return { status: "Active", color: "text-green-600" };
    }
    if (!proposal.isRevealed) {
      return { status: "Ended - Results Pending", color: "text-orange-600" };
    }
    return { status: "Completed", color: "text-blue-600" };
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading proposals...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (proposals.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {emptyMessage}
            </h3>
            <p className="text-gray-600">
              Be the first to create a proposal and start a discussion!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {proposals.map((proposal) => {
        const { status, color } = getProposalStatus(proposal);
        const timeRemaining = proposal.endTime - currentTime;
        const isActive = currentTime >= proposal.startTime && currentTime <= proposal.endTime;

        return (
          <Card key={proposal.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">{proposal.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {proposal.description}
                  </CardDescription>
                </div>
                <div className={`text-sm font-medium ${color} ml-4`}>
                  {status}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-gray-600">
                  Created by: {formatAddress(proposal.creator)}
                </div>
                <div className="text-sm text-gray-600">
                  {proposal.options.length} options
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-gray-600">
                  Started: {formatTimestamp(proposal.startTime)}
                </div>
                <div className="text-sm text-gray-600">
                  Ends: {formatTimestamp(proposal.endTime)}
                </div>
              </div>

              {isActive && timeRemaining > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Time Remaining</span>
                    <span className="font-medium text-green-600">
                      {formatTimeRemaining(timeRemaining)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all duration-1000"
                      style={{
                        width: `${Math.max(0, (timeRemaining / (proposal.endTime - proposal.startTime)) * 100)}%`
                      }}
                    ></div>
                  </div>
                </div>
              )}

              {proposal.isRevealed && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm font-medium text-blue-900 mb-2">
                    Results Revealed ✅
                  </div>
                  <div className="text-xs text-blue-700">
                    Minimum votes threshold: {proposal.minVotesForReveal}
                  </div>
                </div>
              )}

              <Button
                onClick={() => onSelectProposal(proposal)}
                className="w-full"
                variant={isActive ? "default" : "outline"}
              >
                {isActive ? "Vote Now" : "View Details"}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
