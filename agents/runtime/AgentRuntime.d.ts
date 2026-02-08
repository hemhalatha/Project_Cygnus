/**
 * Agent Runtime
 *
 * Core runtime for autonomous agents with lifecycle management,
 * plugin coordination, and decision-making capabilities.
 */
import { AgentConfig, CharacterConfig, TradingOpportunity, Decision, RiskAssessment, TxParams, Transaction, SignedTransaction, TxResult, TxOutcome, HistoryFilter, AgentState, Provider, Action, Evaluator, AgentDID } from './types.js';
import { MemoryManager } from './MemoryManager.js';
/**
 * Main agent runtime class
 */
export declare class AgentRuntime {
    private config;
    private character;
    private memoryManager;
    private pluginManager;
    private characterEngine;
    private state;
    private providers;
    private actions;
    private evaluators;
    constructor(config: AgentConfig);
    /**
     * Initialize the agent runtime
     */
    initialize(): Promise<void>;
    /**
     * Start the agent
     */
    start(): Promise<void>;
    /**
     * Stop the agent
     */
    stop(): Promise<void>;
    /**
     * Evaluate a trading opportunity
     */
    evaluateOpportunity(opportunity: TradingOpportunity): Promise<Decision>;
    /**
     * Assess risk for a counterparty
     */
    assessRisk(counterparty: AgentDID): Promise<RiskAssessment>;
    /**
     * Construct a transaction
     */
    constructTransaction(params: TxParams): Promise<Transaction>;
    /**
     * Sign a transaction
     */
    signTransaction(tx: Transaction): Promise<SignedTransaction>;
    /**
     * Broadcast a transaction
     */
    broadcastTransaction(signedTx: SignedTransaction): Promise<TxResult>;
    /**
     * Record a transaction in memory
     */
    recordTransaction(tx: Transaction, outcome: TxOutcome): Promise<void>;
    /**
     * Query transaction history
     */
    queryHistory(filter: HistoryFilter): Promise<Transaction[]>;
    /**
     * Get current agent state
     */
    getState(): AgentState;
    /**
     * Register a provider
     */
    registerProvider(provider: Provider): void;
    /**
     * Register an action
     */
    registerAction(action: Action): void;
    /**
     * Register an evaluator
     */
    registerEvaluator(evaluator: Evaluator): void;
    /**
     * Execute an action
     */
    executeAction(actionName: string, params: any): Promise<any>;
    /**
     * Get character configuration
     */
    getCharacter(): CharacterConfig | null;
    /**
     * Get memory manager
     */
    getMemoryManager(): MemoryManager;
    /**
     * Load character configuration from file
     */
    private loadCharacter;
    /**
     * Validate character configuration
     */
    private validateCharacter;
    /**
     * Compose state from all providers
     */
    private composeState;
    /**
     * Validate spending limits
     */
    private validateSpendingLimits;
}
//# sourceMappingURL=AgentRuntime.d.ts.map