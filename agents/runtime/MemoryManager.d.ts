/**
 * Memory Manager
 *
 * Manages persistent storage for agent memory including transaction history,
 * decisions, and learned behaviors.
 */
import { Transaction, TxOutcome, HistoryFilter, MemoryEntry, TradingOpportunity, Decision, AgentDID, EvaluationResult } from './types.js';
/**
 * Memory manager for agent persistence
 */
export declare class MemoryManager {
    private memoryPath;
    private transactions;
    private decisions;
    private learnings;
    private counterpartyHistory;
    constructor(memoryPath?: string);
    /**
     * Initialize memory manager
     */
    initialize(): Promise<void>;
    /**
     * Record a transaction
     */
    recordTransaction(tx: Transaction, outcome: TxOutcome): Promise<void>;
    /**
     * Record a decision
     */
    recordDecision(opportunity: TradingOpportunity, decision: Decision): Promise<void>;
    /**
     * Record a learning
     */
    recordLearning(evaluation: EvaluationResult): Promise<void>;
    /**
     * Query transaction history
     */
    queryHistory(filter: HistoryFilter): Promise<Transaction[]>;
    /**
     * Get counterparty history
     */
    getCounterpartyHistory(counterparty: AgentDID): Promise<any[]>;
    /**
     * Get recent decisions
     */
    getRecentDecisions(count?: number): Promise<MemoryEntry[]>;
    /**
     * Get learnings
     */
    getLearnings(): Promise<EvaluationResult[]>;
    /**
     * Clear all memory
     */
    clear(): Promise<void>;
    /**
     * Flush memory to disk
     */
    flush(): Promise<void>;
    /**
     * Load memory from disk
     */
    private load;
    /**
     * Save memory to disk
     */
    private save;
    /**
     * Rebuild counterparty history from transactions
     */
    private rebuildCounterpartyHistory;
    /**
     * Generate transaction ID
     */
    private generateTxId;
    /**
     * Generate unique ID
     */
    private generateId;
}
//# sourceMappingURL=MemoryManager.d.ts.map