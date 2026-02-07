/**
 * Opportunity Evaluator
 * 
 * Evaluates trading, lending, and borrowing opportunities for autonomous agents.
 */

import {
  TradingOpportunity,
  Decision,
  RiskAssessment,
  CharacterConfig,
} from '../runtime/types.js';
import { DID, AgentMetadata } from '../../protocols/masumi/types.js';
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
export class OpportunityEvaluator {
  private character: CharacterConfig;

  constructor(character: CharacterConfig) {
    this.character = character;
  }

  /**
   * Evaluate a trading opportunity
   */
  async evaluateOpportunity(
    opportunity: TradingOpportunity,
    context: OpportunityContext
  ): Promise<Decision> {
    // Evaluate based on opportunity type
    switch (opportunity.type) {
      case 'buy':
        return await this.evaluateBuyOpportunity(opportunity, context);
      case 'sell':
        return await this.evaluateSellOpportunity(opportunity, context);
      case 'loan':
        return await this.evaluateLoanOpportunity(opportunity, context);
      case 'borrow':
        return await this.evaluateBorrowOpportunity(opportunity, context);
      default:
        return {
          action: 'reject',
          reasoning: `Unknown opportunity type: ${opportunity.type}`,
          confidence: 0,
        };
    }
  }

  /**
   * Evaluate buy opportunity
   */
  private async evaluateBuyOpportunity(
    opportunity: TradingOpportunity,
    context: OpportunityContext
  ): Promise<Decision> {
    const signals = this.character.tradingStrategy.buySignals;
    let totalScore = 0;
    let totalWeight = 0;
    const reasons: string[] = [];

    // Check if asset is preferred
    if (!this.character.economicGoals.preferredAssets.includes(opportunity.asset)) {
      return {
        action: 'reject',
        reasoning: `Asset ${opportunity.asset} not in preferred list`,
        confidence: 0.9,
      };
    }

    // Evaluate buy signals
    if (context.marketData) {
      for (const signal of signals) {
        const score = this.evaluateSignal(signal, context.marketData);
        totalScore += score * signal.weight;
        totalWeight += signal.weight;

        if (score > signal.threshold) {
          reasons.push(`${signal.indicator} triggered (${score.toFixed(2)})`);
        }
      }
    }

    // Check counterparty reputation
    if (context.counterpartyReputation) {
      const repScore = context.counterpartyReputation.overallScore / 1000;
      totalScore += repScore * 0.2;
      totalWeight += 0.2;
      reasons.push(`Counterparty reputation: ${context.counterpartyReputation.overallScore}`);
    }

    // Calculate confidence
    const avgScore = totalWeight > 0 ? totalScore / totalWeight : 0;
    const confidence = Math.min(1, avgScore);

    // Make decision based on risk tolerance
    if (confidence >= this.character.personality.riskTolerance) {
      return {
        action: 'accept',
        reasoning: `Buy signals positive: ${reasons.join(', ')}`,
        confidence,
        parameters: {
          suggestedPrice: opportunity.price,
          suggestedAmount: this.calculatePositionSize(opportunity, confidence),
        },
      };
    } else if (confidence >= this.character.personality.riskTolerance * 0.7) {
      return {
        action: 'negotiate',
        reasoning: `Signals moderate, negotiate better terms: ${reasons.join(', ')}`,
        confidence,
        parameters: {
          targetPrice: opportunity.price! * 0.95, // 5% discount
        },
      };
    } else {
      return {
        action: 'reject',
        reasoning: `Buy signals insufficient: ${reasons.join(', ')}`,
        confidence,
      };
    }
  }

  /**
   * Evaluate sell opportunity
   */
  private async evaluateSellOpportunity(
    opportunity: TradingOpportunity,
    context: OpportunityContext
  ): Promise<Decision> {
    const signals = this.character.tradingStrategy.sellSignals;
    let totalScore = 0;
    let totalWeight = 0;
    const reasons: string[] = [];

    // Evaluate sell signals
    if (context.marketData) {
      for (const signal of signals) {
        const score = this.evaluateSignal(signal, context.marketData);
        totalScore += score * signal.weight;
        totalWeight += signal.weight;

        if (score > signal.threshold) {
          reasons.push(`${signal.indicator} triggered (${score.toFixed(2)})`);
        }
      }
    }

    // Check if price meets target return
    if (opportunity.price && context.marketData) {
      const returnPct = (opportunity.price - context.marketData.currentPrice) / context.marketData.currentPrice;
      if (returnPct >= this.character.economicGoals.targetReturn / 100) {
        totalScore += 0.8;
        totalWeight += 0.3;
        reasons.push(`Target return met: ${(returnPct * 100).toFixed(2)}%`);
      }
    }

    const avgScore = totalWeight > 0 ? totalScore / totalWeight : 0;
    const confidence = Math.min(1, avgScore);

    if (confidence >= this.character.personality.riskTolerance) {
      return {
        action: 'accept',
        reasoning: `Sell signals positive: ${reasons.join(', ')}`,
        confidence,
      };
    } else {
      return {
        action: 'reject',
        reasoning: `Sell signals insufficient: ${reasons.join(', ')}`,
        confidence,
      };
    }
  }

  /**
   * Evaluate loan opportunity (giving loan)
   */
  private async evaluateLoanOpportunity(
    opportunity: TradingOpportunity,
    context: OpportunityContext
  ): Promise<Decision> {
    const strategy = this.character.lendingStrategy;
    const reasons: string[] = [];

    // Check counterparty credit score
    if (context.counterpartyReputation) {
      const creditScore = context.counterpartyReputation.overallScore;
      
      if (creditScore < strategy.minCreditScore) {
        return {
          action: 'reject',
          reasoning: `Credit score too low: ${creditScore} < ${strategy.minCreditScore}`,
          confidence: 0.9,
        };
      }

      reasons.push(`Credit score acceptable: ${creditScore}`);
    }

    // Calculate interest rate based on risk
    const baseRate = strategy.interestRateModel.baseRate;
    const creditMultiplier = context.counterpartyReputation
      ? (1000 - context.counterpartyReputation.overallScore) / 1000
      : 0.5;
    
    const interestRate = baseRate * (1 + creditMultiplier * strategy.interestRateModel.creditScoreMultiplier);
    reasons.push(`Calculated interest rate: ${interestRate} bps`);

    // Check loan-to-value ratio
    const loanAmount = opportunity.amount;
    const collateralValue = opportunity.terms?.collateralValue || 0;
    const ltv = collateralValue > 0 ? loanAmount / collateralValue : 1;

    if (ltv > strategy.maxLoanToValue) {
      return {
        action: 'negotiate',
        reasoning: `LTV too high (${(ltv * 100).toFixed(2)}%), negotiate more collateral`,
        confidence: 0.7,
        parameters: {
          requiredCollateral: loanAmount / strategy.maxLoanToValue,
          interestRate,
        },
      };
    }

    return {
      action: 'accept',
      reasoning: `Loan terms acceptable: ${reasons.join(', ')}`,
      confidence: 0.8,
      parameters: {
        interestRate,
        duration: strategy.preferredDuration,
      },
    };
  }

  /**
   * Evaluate borrow opportunity
   */
  private async evaluateBorrowOpportunity(
    opportunity: TradingOpportunity,
    context: OpportunityContext
  ): Promise<Decision> {
    const reasons: string[] = [];

    // Check if we need the loan
    const interestRate = opportunity.terms?.interestRate || 0;
    const maxAcceptableRate = this.character.lendingStrategy.interestRateModel.baseRate * 2;

    if (interestRate > maxAcceptableRate) {
      return {
        action: 'negotiate',
        reasoning: `Interest rate too high: ${interestRate} > ${maxAcceptableRate}`,
        confidence: 0.6,
        parameters: {
          targetRate: maxAcceptableRate,
        },
      };
    }

    reasons.push(`Interest rate acceptable: ${interestRate}`);

    // Check if we have collateral
    const collateralRequired = opportunity.terms?.collateralRequired || 0;
    reasons.push(`Collateral required: ${collateralRequired}`);

    return {
      action: 'accept',
      reasoning: `Borrow terms acceptable: ${reasons.join(', ')}`,
      confidence: 0.7,
    };
  }

  /**
   * Evaluate trading signal
   */
  private evaluateSignal(signal: any, marketData: MarketData): number {
    // Simplified signal evaluation
    // In production, this would use technical indicators
    switch (signal.indicator) {
      case 'price_momentum':
        return marketData.priceChange24h > 0 ? 0.8 : 0.2;
      case 'volume':
        return marketData.volume24h > 1000000 ? 0.7 : 0.3;
      case 'volatility':
        return marketData.volatility < 0.1 ? 0.8 : 0.4;
      default:
        return 0.5;
    }
  }

  /**
   * Calculate position size based on strategy
   */
  private calculatePositionSize(
    opportunity: TradingOpportunity,
    confidence: number
  ): number {
    const strategy = this.character.tradingStrategy.positionSizing;
    const maxAmount = this.character.spendingLimits.maxSingleTransaction;

    switch (strategy) {
      case 'fixed':
        return Math.min(opportunity.amount, maxAmount);
      case 'proportional':
        return Math.min(opportunity.amount * confidence, maxAmount);
      case 'kelly':
        // Simplified Kelly criterion
        const kellyFraction = confidence * 0.5;
        return Math.min(opportunity.amount * kellyFraction, maxAmount);
      default:
        return Math.min(opportunity.amount, maxAmount);
    }
  }

  /**
   * Update character configuration
   */
  updateCharacter(character: CharacterConfig): void {
    this.character = character;
  }
}
