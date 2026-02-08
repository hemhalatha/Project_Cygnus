// Smart Contract Types

export interface CreditProfile {
  agentDid: string;
  score: number;
  totalTransactions: number;
  successfulTransactions: number;
  defaults: number;
  totalVolume: string;
  accountAge: number;
  lastUpdated: number;
}

export interface TransactionLimits {
  maxBuyAmount: string;
  maxSellAmount: string;
  maxLoanAmount: string;
  maxBorrowAmount: string;
  dailyTransactionLimit: string;
}

export interface LoanTerms {
  principal: string;
  interestRate: number;
  duration: number;
  collateralAmount: string;
  collateralAsset: string;
  installments: number;
}

export interface Payment {
  dueDate: number;
  amount: string;
  paid: boolean;
}

export type LoanStatusType = 'Active' | 'Repaid' | 'Defaulted' | 'Liquidated';

export interface LoanState {
  lender: string;
  borrower: string;
  principal: string;
  interestRate: number;
  duration: number;
  collateralAmount: string;
  collateralAsset: string;
  repaymentSchedule: Payment[];
  status: LoanStatusType;
  createdAt: number;
  totalRepaid: string;
}

export type TransactionOutcome = 'Success' | 'Default' | 'Partial';
