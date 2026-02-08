/**
 * Transaction Executor
 *
 * Executes autonomous transactions with monitoring and history recording.
 */
import { TxParams, TxResult, SpendingLimits } from '../runtime/types.js';
import { StellarClient } from '../../src/stellar/StellarClient.js';
import { PolicySigner } from '../../src/stellar/PolicySigner.js';
import { MemoryManager } from '../runtime/MemoryManager.js';
/**
 * Transaction Executor for autonomous execution
 */
export declare class TransactionExecutor {
    private stellarClient;
    private policySigner;
    private memoryManager;
    private spendingLimits;
    private spendingTracker;
    private publicKey;
    private secretKey;
    constructor(stellarClient: StellarClient, policySigner: PolicySigner, memoryManager: MemoryManager, spendingLimits: SpendingLimits, publicKey: string, secretKey: string);
    /**
     * Execute transaction autonomously
     */
    executeTransaction(params: TxParams): Promise<TxResult>;
    /**
     * Check spending limits
     */
    private checkSpendingLimits;
    /**
     * Update spending tracker
     */
    private updateSpendingTracker;
    /**
     * Get week start date
     */
    private getWeekStart;
    /**
     * Record transaction in memory
     */
    private recordTransaction;
    /**
     * Monitor transaction status
     */
    private monitorTransaction;
    /**
     * Get spending status
     */
    getSpendingStatus(): {
        daily: {
            spent: number;
            limit: number;
            remaining: number;
            date: string;
        };
        weekly: {
            spent: number;
            limit: number;
            remaining: number;
            weekStart: string;
        };
        singleTransaction: {
            limit: number;
        };
    };
    /**
     * Reset spending tracker (for testing)
     */
    resetSpendingTracker(): void;
    /**
     * Update spending limits
     */
    updateSpendingLimits(limits: SpendingLimits): void;
}
//# sourceMappingURL=TransactionExecutor.d.ts.map