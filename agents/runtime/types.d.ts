/**
 * Agent Runtime Type Definitions
 *
 * Core types for the ElizaOS-based agent runtime system.
 */
import { Transaction } from '../../src/stellar/xdr/types.js';
/**
 * Agent configuration
 */
export interface AgentConfig {
    characterFile: string;
    plugins: PluginConfig[];
    stellarNetwork: 'testnet' | 'mainnet';
    riskTolerance: number;
    spendingLimits: SpendingLimits;
    secretKey?: string;
    publicKey?: string;
}
/**
 * Plugin configuration
 */
export interface PluginConfig {
    name: string;
    enabled: boolean;
    config?: Record<string, any>;
}
/**
 * Spending limits for agent
 */
export interface SpendingLimits {
    maxSingleTransaction: number;
    dailyLimit: number;
    weeklyLimit: number;
}
/**
 * Character configuration defining agent personality and behavior
 */
export interface CharacterConfig {
    name: string;
    personality: {
        riskTolerance: number;
        negotiationStyle: 'aggressive' | 'balanced' | 'conservative';
        learningRate: number;
    };
    economicGoals: {
        targetReturn: number;
        maxLossThreshold: number;
        preferredAssets: string[];
    };
    tradingStrategy: {
        buySignals: TradingSignal[];
        sellSignals: TradingSignal[];
        positionSizing: 'fixed' | 'proportional' | 'kelly';
    };
    lendingStrategy: {
        minCreditScore: number;
        maxLoanToValue: number;
        preferredDuration: number;
        interestRateModel: InterestRateModel;
    };
    spendingLimits: SpendingLimits;
}
/**
 * Trading signal for decision-making
 */
export interface TradingSignal {
    indicator: string;
    threshold: number;
    weight: number;
}
/**
 * Interest rate model for lending
 */
export interface InterestRateModel {
    baseRate: number;
    creditScoreMultiplier: number;
    durationMultiplier: number;
    collateralDiscount: number;
}
/**
 * Trading opportunity
 */
export interface TradingOpportunity {
    type: 'buy' | 'sell' | 'loan' | 'borrow';
    asset: string;
    amount: number;
    price?: number;
    counterparty?: string;
    terms?: any;
    confidence: number;
}
/**
 * Decision result
 */
export interface Decision {
    action: 'accept' | 'reject' | 'negotiate';
    reasoning: string;
    confidence: number;
    parameters?: Record<string, any>;
}
/**
 * Risk assessment
 */
export interface RiskAssessment {
    score: number;
    factors: RiskFactor[];
    recommendation: 'proceed' | 'caution' | 'reject';
}
/**
 * Risk factor
 */
export interface RiskFactor {
    name: string;
    impact: number;
    description: string;
}
/**
 * Transaction parameters
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
 * Signed transaction
 */
export interface SignedTransaction {
    transaction: Transaction;
    signature: string;
    hash: string;
}
/**
 * Transaction result
 */
export interface TxResult {
    success: boolean;
    hash: string;
    ledger?: number;
    error?: string;
}
/**
 * Transaction outcome for memory
 */
export interface TxOutcome {
    result: TxResult;
    timestamp: number;
    gasUsed?: number;
    finalBalance?: number;
}
/**
 * History filter for querying past transactions
 */
export interface HistoryFilter {
    startDate?: Date;
    endDate?: Date;
    type?: string;
    counterparty?: string;
    minAmount?: number;
    maxAmount?: number;
    status?: 'success' | 'failed';
}
/**
 * Memory entry
 */
export interface MemoryEntry {
    id: string;
    timestamp: number;
    type: 'transaction' | 'decision' | 'interaction';
    data: any;
    tags: string[];
}
/**
 * Agent state
 */
export interface AgentState {
    isRunning: boolean;
    balance: number;
    creditScore: number;
    transactionCount: number;
    lastActivity: number;
    activeLoans: number;
    activeEscrows: number;
}
/**
 * Plugin interface
 */
export interface Plugin {
    name: string;
    version: string;
    initialize(runtime: any): Promise<void>;
    shutdown(): Promise<void>;
    getCapabilities(): string[];
}
/**
 * Provider interface for state composition
 */
export interface Provider {
    name: string;
    getData(): Promise<any>;
}
/**
 * Action interface for agent operations
 */
export interface Action {
    name: string;
    description: string;
    execute(params: any): Promise<any>;
    validate(params: any): boolean;
}
/**
 * Evaluator interface for outcome analysis
 */
export interface Evaluator {
    name: string;
    evaluate(outcome: any): Promise<EvaluationResult>;
}
/**
 * Evaluation result
 */
export interface EvaluationResult {
    success: boolean;
    score: number;
    feedback: string;
    shouldLearn: boolean;
}
/**
 * Agent DID (Decentralized Identifier)
 */
export type AgentDID = string;
/**
 * Contract client interface
 */
export interface ContractClient {
    contractId: string;
    invoke(functionName: string, args: any[]): Promise<any>;
    query(functionName: string, args: any[]): Promise<any>;
}
//# sourceMappingURL=types.d.ts.map