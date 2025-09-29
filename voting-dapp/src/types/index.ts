// Voting Types
export interface Proposal {
  id: number;
  creator: string;
  title: string;
  description: string;
  options: string[];
  startTime: number;
  endTime: number;
  minVotesForReveal: number;
  isActive: boolean;
  isRevealed: boolean;
}

export interface VoteStats {
  totalVoters: number;
  timeRemaining: number;
  canVote: boolean;
  canReveal: boolean;
}

export interface UserProfile {
  address: string;
  isRegistered: boolean;
  isBanned: boolean;
  votingWeight: number;
  registrationTime: number;
  banReason: string;
  bannedBy: string;
}

// Contract Types
export interface VotingContract {
  address: string;
  abi: any[];
}

// UI Types
export type LoadingState = "idle" | "loading" | "success" | "error";

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}
