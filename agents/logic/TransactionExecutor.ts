/**
 * Transaction Executor
 * 
 * Executes autonomous transactions with monitoring and history recording.
 */

import {
  TxParams,
  SignedTransaction,
  TxResult,
  TxOutcome,
  SpendingLimits,
} from '../runtime/types.js';
import { StellarClient } from '../../src/stellar/StellarClient.js';
import { PolicySigner } from '../../src/stellar/PolicySigner.js';
import { MemoryManager } from '../runtime/MemoryManager.js';

/**
 * Spending tracker
 */
interface SpendingTracker {
  daily: { amount: number; date: string };
  weekly: { amount: number; weekStart: string };
}

/**
 * Transaction Executor for autonomous execution
 */
export class TransactionExecutor {
  private stellarClient: StellarClient;
  private policySigner: PolicySigner;
  private memoryManager: MemoryManager;
  private spendingLimits: SpendingLimits;
  private spendingTracker: SpendingTracker;
  private publicKey: string;
  private secretKey: string;

  constructor(
    stellarClient: StellarClient,
    policySigner: PolicySigner,
    memoryManager: MemoryManager,
    spendingLimits: SpendingLimits,
    publicKey: string,
    secretKey: string
  ) {
    this.stellarClient = stellarClient;
    this.policySigner = policySigner;
    this.memoryManager = memoryManager;
    this.spendingLimits = spendingLimits;
    this.publicKey = publicKey;
    this.secretKey = secretKey;

    // Initialize spending tracker
    const today = new Date().toISOString().split('T')[0];
    const weekStart = this.getWeekStart();
    this.spendingTracker = {
      daily: { amount: 0, date: today },
      weekly: { amount: 0, weekStart },
    };
  }

  /**
   * Execute transaction autonomously
   */
  async executeTransaction(params: TxParams): Promise<TxResult> {
    // Check spending limits
    const limitCheck = this.checkSpendingLimits(params);
    if (!limitCheck.allowed) {
      return {
        success: false,
        hash: '',
        error: limitCheck.reason,
      };
    }

    try {
      // Construct transaction
      const tx = await this.stellarClient.constructTransaction(
        this.publicKey,
        params
      );

      // Evaluate with policy signer
      const policyResult = await this.policySigner.evaluateTransaction(tx);
      if (!policyResult.authorized) {
        return {
          success: false,
          hash: '',
          error: `Policy rejected: ${policyResult.reason}`,
        };
      }

      // Sign transaction
      const signedTx = await this.stellarClient.signTransaction(
        tx,
        this.secretKey
      );

      // Broadcast transaction
      const result = await this.stellarClient.broadcastTransaction(signedTx);

      // Update spending tracker
      if (result.success && params.amount) {
        this.updateSpendingTracker(params.amount);
      }

      // Record in memory
      await this.recordTransaction(tx, result);

      // Monitor transaction status
      if (result.success) {
        this.monitorTransaction(result.hash);
      }

      return result;
    } catch (error) {
      const errorResult: TxResult = {
        success: false,
        hash: '',
        error: `Execution failed: ${error}`,
      };

      // Record failure
      await this.memoryManager.store({
        id: `tx-error-${Date.now()}`,
        timestamp: Date.now(),
        type: 'transaction',
        data: { params, error: errorResult.error },
        tags: ['error', 'transaction'],
      });

      return errorResult;
    }
  }

  /**
   * Check spending limits
   */
  private checkSpendingLimits(params: TxParams): { allowed: boolean; reason?: string } {
    if (!params.amount) {
      return { allowed: true };
    }

    const amount = params.amount;

    // Check single transaction limit
    if (amount > this.spendingLimits.maxSingleTransaction) {
      return {
        allowed: false,
        reason: `Amount ${amount} exceeds single transaction limit ${this.spendingLimits.maxSingleTransaction}`,
      };
    }

    // Check daily limit
    const today = new Date().toISOString().split('T')[0];
    if (this.spendingTracker.daily.date !== today) {
      // Reset daily tracker
      this.spendingTracker.daily = { amount: 0, date: today };
    }

    if (this.spendingTracker.daily.amount + amount > this.spendingLimits.dailyLimit) {
      return {
        allowed: false,
        reason: `Would exceed daily limit: ${this.spendingTracker.daily.amount + amount} > ${this.spendingLimits.dailyLimit}`,
      };
    }

    // Check weekly limit
    const weekStart = this.getWeekStart();
    if (this.spendingTracker.weekly.weekStart !== weekStart) {
      // Reset weekly tracker
      this.spendingTracker.weekly = { amount: 0, weekStart };
    }

    if (this.spendingTracker.weekly.amount + amount > this.spendingLimits.weeklyLimit) {
      return {
        allowed: false,
        reason: `Would exceed weekly limit: ${this.spendingTracker.weekly.amount + amount} > ${this.spendingLimits.weeklyLimit}`,
      };
    }

    return { allowed: true };
  }

  /**
   * Update spending tracker
   */
  private updateSpendingTracker(amount: number): void {
    this.spendingTracker.daily.amount += amount;
    this.spendingTracker.weekly.amount += amount;
  }

  /**
   * Get week start date
   */
  private getWeekStart(): string {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek;
    const weekStart = new Date(now.setDate(diff));
    return weekStart.toISOString().split('T')[0];
  }

  /**
   * Record transaction in memory
   */
  private async recordTransaction(
    tx: any,
    result: TxResult
  ): Promise<void> {
    const outcome: TxOutcome = {
      result,
      timestamp: Date.now(),
    };

    await this.memoryManager.store({
      id: `tx-${result.hash || Date.now()}`,
      timestamp: Date.now(),
      type: 'transaction',
      data: { transaction: tx, outcome },
      tags: ['transaction', result.success ? 'success' : 'failed'],
    });
  }

  /**
   * Monitor transaction status
   */
  private async monitorTransaction(hash: string): Promise<void> {
    // Poll transaction status
    const maxAttempts = 10;
    const pollInterval = 1000; // 1 second

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval));

      try {
        const status = await this.stellarClient.getTransactionStatus(hash);
        
        if (status.success) {
          // Transaction confirmed
          await this.memoryManager.store({
            id: `tx-confirmed-${hash}`,
            timestamp: Date.now(),
            type: 'transaction',
            data: { hash, status, ledger: status.ledger },
            tags: ['transaction', 'confirmed'],
          });
          break;
        }
      } catch (error) {
        // Continue polling
      }
    }
  }

  /**
   * Get spending status
   */
  getSpendingStatus() {
    return {
      daily: {
        spent: this.spendingTracker.daily.amount,
        limit: this.spendingLimits.dailyLimit,
        remaining: this.spendingLimits.dailyLimit - this.spendingTracker.daily.amount,
        date: this.spendingTracker.daily.date,
      },
      weekly: {
        spent: this.spendingTracker.weekly.amount,
        limit: this.spendingLimits.weeklyLimit,
        remaining: this.spendingLimits.weeklyLimit - this.spendingTracker.weekly.amount,
        weekStart: this.spendingTracker.weekly.weekStart,
      },
      singleTransaction: {
        limit: this.spendingLimits.maxSingleTransaction,
      },
    };
  }

  /**
   * Reset spending tracker (for testing)
   */
  resetSpendingTracker(): void {
    const today = new Date().toISOString().split('T')[0];
    const weekStart = this.getWeekStart();
    this.spendingTracker = {
      daily: { amount: 0, date: today },
      weekly: { amount: 0, weekStart },
    };
  }

  /**
   * Update spending limits
   */
  updateSpendingLimits(limits: SpendingLimits): void {
    this.spendingLimits = limits;
  }
}
