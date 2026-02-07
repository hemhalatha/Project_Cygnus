/**
 * Character Engine
 * 
 * Implements decision-making logic based on character configuration.
 */

import {
  CharacterConfig,
  TradingOpportunity,
  Decision,
  RiskAssessment,
  RiskFactor,
  AgentDID,
} from './types.js';

/**
 * Character engine for personality-driven decision-making
 */
export class CharacterEngine {
  private character: CharacterConfig | null = null;

  /**
   * Initialize with character configuration
   */
  async initialize(character: CharacterConfig): Promise<void> {
    this.character = character;
    console.log(`Character engine initialized for: ${character.name}`);
  }

  /**
   * Evaluate a trading opportunity
   */
  async evaluateOpportunity(
    opportunity: TradingOpportunity,
    state: any,
    character: CharacterConfig
  ): Promise<Decision> {
    // Calculate opportunity score based on character preferences
    const score = this.calculateOpportunityScore(opportunity, character);
    
    // Apply risk tolerance
    const riskAdjustedScore = score * (1 - character.personality.riskTolerance * 0.5);
    
    // Make decision based on score
    let action: 'accept' | 'reject' | 'negotiate';
    let reasoning: string;
    
    if (riskAdjustedScore > 0.7) {
      action = 'accept';
      reasoning = `High confidence opportunity (score: ${riskAdjustedScore.toFixed(2)}) aligns with ${character.personality.negotiationStyle} strategy`;
    } else if (riskAdjustedScore > 0.4) {
      action = 'negotiate';
      reasoning = `Moderate opportunity (score: ${riskAdjustedScore.toFixed(2)}) - negotiation recommended`;
    } else {
      action = 'reject';
      reasoning = `Low confidence opportunity (score: ${riskAdjustedScore.toFixed(2)}) - risk too high for ${character.personality.negotiationStyle} approach`;
    }

    return {
      action,
      reasoning,
      confidence: riskAdjustedScore,
      parameters: {
        originalScore: score,
        riskAdjustment: character.personality.riskTolerance,
      },
    };
  }

  /**
   * Assess risk for a counterparty
   */
  async assessRisk(
    counterparty: AgentDID,
    history: any[],
    character: CharacterConfig
  ): Promise<RiskAssessment> {
    const factors: RiskFactor[] = [];
    let totalRisk = 0;

    // Factor 1: Transaction history
    if (history.length === 0) {
      factors.push({
        name: 'No History',
        impact: 0.5,
        description: 'No previous transactions with this counterparty',
      });
      totalRisk += 0.5;
    } else {
      const successRate = history.filter(h => h.outcome.result.success).length / history.length;
      const historyRisk = 1 - successRate;
      factors.push({
        name: 'Transaction History',
        impact: historyRisk,
        description: `${(successRate * 100).toFixed(0)}% success rate over ${history.length} transactions`,
      });
      totalRisk += historyRisk * 0.4;
    }

    // Factor 2: Recent activity
    if (history.length > 0) {
      const recentHistory = history.slice(-5);
      const recentSuccessRate = recentHistory.filter(h => h.outcome.result.success).length / recentHistory.length;
      const recentRisk = 1 - recentSuccessRate;
      factors.push({
        name: 'Recent Performance',
        impact: recentRisk,
        description: `${(recentSuccessRate * 100).toFixed(0)}% success rate in last 5 transactions`,
      });
      totalRisk += recentRisk * 0.3;
    }

    // Factor 3: Character risk tolerance
    const riskToleranceFactor = character.personality.riskTolerance;
    factors.push({
      name: 'Risk Tolerance',
      impact: riskToleranceFactor,
      description: `Agent risk tolerance: ${(riskToleranceFactor * 100).toFixed(0)}%`,
    });

    // Normalize total risk
    totalRisk = Math.min(totalRisk, 1.0);

    // Determine recommendation
    let recommendation: 'proceed' | 'caution' | 'reject';
    if (totalRisk < 0.3) {
      recommendation = 'proceed';
    } else if (totalRisk < 0.6) {
      recommendation = 'caution';
    } else {
      recommendation = 'reject';
    }

    return {
      score: totalRisk,
      factors,
      recommendation,
    };
  }

  /**
   * Calculate opportunity score based on character preferences
   */
  private calculateOpportunityScore(
    opportunity: TradingOpportunity,
    character: CharacterConfig
  ): number {
    let score = opportunity.confidence;

    // Adjust based on opportunity type and character strategy
    switch (opportunity.type) {
      case 'buy':
        score *= this.evaluateBuySignals(opportunity, character);
        break;
      case 'sell':
        score *= this.evaluateSellSignals(opportunity, character);
        break;
      case 'loan':
        score *= this.evaluateLoanOpportunity(opportunity, character);
        break;
      case 'borrow':
        score *= this.evaluateBorrowOpportunity(opportunity, character);
        break;
    }

    // Adjust based on negotiation style
    switch (character.personality.negotiationStyle) {
      case 'aggressive':
        score *= 1.2; // More willing to take opportunities
        break;
      case 'conservative':
        score *= 0.8; // More cautious
        break;
      case 'balanced':
        // No adjustment
        break;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Evaluate buy signals
   */
  private evaluateBuySignals(
    opportunity: TradingOpportunity,
    character: CharacterConfig
  ): number {
    let signalScore = 0;
    let totalWeight = 0;

    for (const signal of character.tradingStrategy.buySignals) {
      // Simplified signal evaluation
      // In production, this would check actual market indicators
      signalScore += signal.weight;
      totalWeight += signal.weight;
    }

    return totalWeight > 0 ? signalScore / totalWeight : 0.5;
  }

  /**
   * Evaluate sell signals
   */
  private evaluateSellSignals(
    opportunity: TradingOpportunity,
    character: CharacterConfig
  ): number {
    let signalScore = 0;
    let totalWeight = 0;

    for (const signal of character.tradingStrategy.sellSignals) {
      signalScore += signal.weight;
      totalWeight += signal.weight;
    }

    return totalWeight > 0 ? signalScore / totalWeight : 0.5;
  }

  /**
   * Evaluate loan opportunity (as lender)
   */
  private evaluateLoanOpportunity(
    opportunity: TradingOpportunity,
    character: CharacterConfig
  ): number {
    const strategy = character.lendingStrategy;
    
    // Check if terms match preferences
    // This is simplified - in production would check actual loan terms
    let score = 0.5;

    // Adjust based on interest rate model
    score *= (strategy.baseRate / 1000); // Normalize

    return Math.min(score, 1.0);
  }

  /**
   * Evaluate borrow opportunity
   */
  private evaluateBorrowOpportunity(
    opportunity: TradingOpportunity,
    character: CharacterConfig
  ): number {
    // Evaluate if borrowing makes sense given economic goals
    const targetReturn = character.economicGoals.targetReturn;
    
    // Simplified evaluation
    let score = 0.5;
    
    if (opportunity.terms && opportunity.terms.interestRate) {
      // Only borrow if expected return exceeds interest rate
      if (targetReturn > opportunity.terms.interestRate) {
        score = 0.8;
      } else {
        score = 0.2;
      }
    }

    return score;
  }
}
