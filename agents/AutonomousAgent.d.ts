/**
 * Autonomous Agent
 *
 * Fully autonomous agent integrating all protocols and logic.
 */
import { AgentConfig, TradingOpportunity, Decision, RiskAssessment, TxParams, TxResult } from './runtime/types.js';
import { StellarClient } from '../src/stellar/StellarClient.js';
import { DIDManager } from '../protocols/masumi/index.js';
import { SokosumiCoordinator } from '../protocols/sokosumi/index.js';
import { DID } from '../protocols/masumi/types.js';
/**
 * Autonomous Agent - fully integrated agent
 */
export declare class AutonomousAgent {
    private runtime;
    private characterEngine;
    private memoryManager;
    private pluginManager;
    private stellarClient;
    private policySigner;
    private didManager;
    private credentialManager;
    private agentRegistry;
    private coordinator;
    private x402Client;
    private channelManager;
    private opportunityEvaluator;
    private riskAssessor;
    private transactionExecutor;
    private loanNegotiator;
    private tradingManager;
    private myDID?;
    private isInitialized;
    private isRunning;
    constructor(config: AgentConfig, stellarClient: StellarClient, didManager: DIDManager, coordinator: SokosumiCoordinator);
    /**
     * Initialize agent
     */
    initialize(): Promise<void>;
    /**
     * Start agent
     */
    start(): Promise<void>;
    /**
     * Stop agent
     */
    stop(): Promise<void>;
    /**
     * Evaluate opportunity
     */
    evaluateOpportunity(opportunity: TradingOpportunity): Promise<Decision>;
    /**
     * Assess risk
     */
    assessRisk(counterpartyDID: DID, transactionAmount: number): Promise<RiskAssessment>;
    /**
     * Execute transaction
     */
    executeTransaction(params: TxParams): Promise<TxResult>;
    /**
     * Get loan
     */
    getLoan(amount: number, collateral: number): Promise<import("./logic/LoanNegotiator.js").LoanContract | null>;
    /**
     * Buy item
     */
    buyItem(item: string, quantity: number, maxPrice: number): Promise<import("./logic/TradingManager.js").EscrowContract | null>;
    /**
     * Sell item
     */
    sellItem(item: string, quantity: number, price: number): Promise<import("./logic/TradingManager.js").EscrowContract | null>;
    /**
     * Get agent status
     */
    getStatus(): {
        did: any;
        isInitialized: boolean;
        isRunning: boolean;
        balance: number;
        activeLoans: number;
        activeEscrows: number;
        spending: {
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
    };
    /**
     * Load character configuration
     */
    private loadCharacter;
    /**
     * Start opportunity discovery loop
     */
    private startOpportunityDiscovery;
    /**
     * Start loan monitoring loop
     */
    private startLoanMonitoring;
    /**
     * Start escrow monitoring loop
     */
    private startEscrowMonitoring;
}
//# sourceMappingURL=AutonomousAgent.d.ts.map