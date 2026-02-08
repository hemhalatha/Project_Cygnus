// Transaction Types

export interface TransactionParams {
  source: string;
  destination: string;
  amount: string;
  memo?: string;
}

export type TransactionStatusType = 'pending' | 'confirmed' | 'failed';

export interface TransactionStatus {
  hash: string;
  status: TransactionStatusType;
  error?: string;
  timestamp: number;
}

export type TradingOperationType = 'buy' | 'sell' | 'swap';

export interface TradingOperation {
  type: TradingOperationType;
  amount: string;
  asset?: string;
  agentDid: string;
}
