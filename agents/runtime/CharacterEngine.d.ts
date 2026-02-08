/**
 * Character Engine
 *
 * Implements decision-making logic based on character configuration.
 */
import { CharacterConfig, TradingOpportunity, Decision, RiskAssessment, AgentDID } from './types.js';
/**
 * Character engine for personality-driven decision-making
 */
export declare class CharacterEngine {
    private character;
    /**
     * Initialize with character configuration
     */
    initialize(character: CharacterConfig): Promise<void>;
    /**
     * Evaluate a trading opportunity
     */
    evaluateOpportunity(opportunity: TradingOpportunity, state: any, character: CharacterConfig): Promise<Decision>;
    /**
     * Assess risk for a counterparty
     */
    assessRisk(counterparty: AgentDID, history: any[], character: CharacterConfig): Promise<RiskAssessment>;
    /**
     * Calculate opportunity score based on character preferences
     */
    private calculateOpportunityScore;
    /**
     * Evaluate buy signals
     */
    private evaluateBuySignals;
    /**
     * Evaluate sell signals
     */
    private evaluateSellSignals;
    /**
     * Evaluate loan opportunity (as lender)
     */
    private evaluateLoanOpportunity;
    /**
     * Evaluate borrow opportunity
     */
    private evaluateBorrowOpportunity;
}
//# sourceMappingURL=CharacterEngine.d.ts.map