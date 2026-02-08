/**
 * Central Type Exports
 * 
 * This file provides a single import point for all shared types
 * used throughout the backend application.
 */

// Transaction types
export type {
  Transaction,
  TimeBounds,
  Memo,
  Operation,
  TxParams,
  SignedTransaction,
  TxResult,
  TxOutcome,
} from './transaction.js';

// Re-export XDR types for convenience
export type {
  TransactionEnvelope,
  MemoType,
  OperationType,
  OperationBody,
  Asset,
  AssetType,
  PaymentOp,
  DecoratedSignature,
} from '../stellar/xdr/types.js';
