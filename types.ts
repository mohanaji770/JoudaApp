export enum VerdictType {
  SAFE = "SAFE",
  RISKY = "RISKY",
  UNSAFE = "UNSAFE"
}

export interface AnalysisResult {
  verdict: VerdictType;
  verdictTitle: string; // e.g., "غير آمن"
  analysis: string;
  guidance: string;
  alternatives?: string;
  matchedStoreItem?: string; // Name of the item if it exists in Jouda inventory
  timestamp: number;
  imageUrl?: string;
}

export interface LoadingState {
  isLoading: boolean;
  message: string;
}