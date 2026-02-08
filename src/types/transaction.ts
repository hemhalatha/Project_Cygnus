/**
 * Transaction Type Definitions
 * 
 * Centralized transaction-related types for the backend.
 * These types are re-exported from XDR types and runtime types.
 */

import type {
  Transaction as XDRTransaction,
  TimeBounds,
  Memo,
  Operation,
} from '../stellar/xdr/types.js';

/**
 * Core transaction structure (re-exported from XDR types)
 */
export type Transaction = XDRTransaction;

/**
 * Export supporting types
 */
export type { TimeBounds, Memo, Operation };

/**
 * Transaction parameters for constructing transactions
 */
export interface TxParams {
  type: 'payment' | 'contract_invoke' | 'create_account';
  destination?: string;
  amount?: number;
  asset?: string;
  contractId?: string;
  functionName?: string;
  args?: any[];
  memo?: string;
}

/**
 * Signed transaction with signature and hash
 */
export interface SignedTransaction {
  transaction: Transaction;
  signature: string;
  hash: string;
}

/**
 * Transaction result after submission
 */
export interface TxResult {
  success: boolean;
  hash: string;
  ledger?: number | string; // Can be number or string depending on Stellar SDK version
  error?: string;
}

/**
 * Transaction outcome for memory/history
 */
export interface TxOutcome {
  result: TxResult;
  timestamp: number;
  gasUsed?: number;
  finalBalance?: number;
}
