/**
 * Opportunity Evaluator
 *
 * Evaluates trading, lending, and borrowing opportunities for autonomous agents.
 */
import { TradingOpportunity, Decision, CharacterConfig } from '../runtime/types.js';
import { AgentMetadata } from '../../protocols/masumi/types.js';
import { ServiceDescription, ReputationScore } from '../../protocols/sokosumi/types.js';
/**
 * Market data for opportunity evaluation
 */
export interface MarketData {
    asset: string;
    currentPrice: number;
    volume24h: number;
    priceChange24h: number;
    volatility: number;
    timestamp: number;
}
/**
 * Opportunity context
 */
export interface OpportunityContext {
    marketData?: MarketData;
    counterpartyReputation?: ReputationScore;
    counterpartyMetadata?: AgentMetadata;
    serviceDescription?: ServiceDescription;
}
/**
 * Opportunity Evaluator for autonomous decision-making
 */
export declare class OpportunityEvaluator {
    private character;
    constructor(character: CharacterConfig);
    /**
     * Evaluate a trading opportunity
     */
    evaluateOpportunity(opportunity: TradingOpportunity, context: OpportunityContext): Promise<Decision>;
    /**
     * Evaluate buy opportunity
     */
    private evaluateBuyOpportunity;
    /**
     * Evaluate sell opportunity
     */
    private evaluateSellOpportunity;
    /**
     * Evaluate loan opportunity (giving loan)
     */
    private evaluateLoanOpportunity;
    /**
     * Evaluate borrow opportunity
     */
    private evaluateBorrowOpportunity;
    /**
     * Evaluate trading signal
     */
    private evaluateSignal;
    /**
     * Calculate position size based on strategy
     */
    private calculatePositionSize;
    /**
     * Update character configuration
     */
    updateCharacter(character: CharacterConfig): void;
}
//# sourceMappingURL=OpportunityEvaluator.d.ts.map