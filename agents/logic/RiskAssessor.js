/**
 * Risk Assessor
 *
 * Assesses counterparty risk using credit scores and transaction history.
 */
/**
 * Risk Assessor for evaluating counterparty risk
 */
export class RiskAssessor {
    character;
    transactionHistory = new Map();
    constructor(character) {
        this.character = character;
    }
    /**
     * Assess counterparty risk
     */
    async assessRisk(counterpartyDID, reputation, metadata, transactionAmount) {
        const factors = [];
        let totalRisk = 0;
        let totalWeight = 0;
        // Factor 1: Credit score / reputation
        if (reputation) {
            const creditRisk = this.assessCreditRisk(reputation);
            factors.push(creditRisk);
            totalRisk += creditRisk.impact * 0.4;
            totalWeight += 0.4;
        }
        else {
            // No reputation data - high risk
            factors.push({
                name: 'Unknown Reputation',
                impact: 0.8,
                description: 'No reputation data available for counterparty',
            });
            totalRisk += 0.8 * 0.4;
            totalWeight += 0.4;
        }
        // Factor 2: Transaction history
        const historyRisk = this.assessHistoryRisk(counterpartyDID);
        factors.push(historyRisk);
        totalRisk += historyRisk.impact * 0.3;
        totalWeight += 0.3;
        // Factor 3: Transaction size
        const sizeRisk = this.assessTransactionSizeRisk(transactionAmount);
        factors.push(sizeRisk);
        totalRisk += sizeRisk.impact * 0.2;
        totalWeight += 0.2;
        // Factor 4: Agent capabilities
        if (metadata) {
            const capabilityRisk = this.assessCapabilityRisk(metadata);
            factors.push(capabilityRisk);
            totalRisk += capabilityRisk.impact * 0.1;
            totalWeight += 0.1;
        }
        // Calculate overall risk score
        const riskScore = totalWeight > 0 ? totalRisk / totalWeight : 0.5;
        // Determine recommendation
        let recommendation;
        if (riskScore < this.character.personality.riskTolerance * 0.5) {
            recommendation = 'proceed';
        }
        else if (riskScore < this.character.personality.riskTolerance) {
            recommendation = 'caution';
        }
        else {
            recommendation = 'reject';
        }
        return {
            score: riskScore,
            factors,
            recommendation,
        };
    }
    /**
     * Assess credit risk from reputation
     */
    assessCreditRisk(reputation) {
        const score = reputation.overallScore;
        const successRate = reputation.successRate;
        const disputes = reputation.disputes;
        // Calculate risk based on reputation metrics
        let risk = 0;
        // Credit score component (0-1000 scale)
        if (score < 400) {
            risk += 0.8;
        }
        else if (score < 600) {
            risk += 0.5;
        }
        else if (score < 800) {
            risk += 0.2;
        }
        else {
            risk += 0.1;
        }
        // Success rate component
        if (successRate < 0.7) {
            risk += 0.3;
        }
        else if (successRate < 0.9) {
            risk += 0.1;
        }
        // Disputes component
        if (disputes > 5) {
            risk += 0.3;
        }
        else if (disputes > 2) {
            risk += 0.1;
        }
        // Normalize
        risk = Math.min(1, risk / 3);
        return {
            name: 'Credit Score',
            impact: risk,
            description: `Score: ${score}, Success Rate: ${(successRate * 100).toFixed(1)}%, Disputes: ${disputes}`,
        };
    }
    /**
     * Assess risk from transaction history
     */
    assessHistoryRisk(counterpartyDID) {
        const history = this.transactionHistory.get(counterpartyDID) || [];
        if (history.length === 0) {
            return {
                name: 'Transaction History',
                impact: 0.5,
                description: 'No previous transactions with this counterparty',
            };
        }
        // Calculate success rate
        const successCount = history.filter((tx) => tx.success).length;
        const successRate = successCount / history.length;
        // Calculate recency
        const recentTxs = history.filter((tx) => Date.now() - tx.timestamp < 30 * 24 * 60 * 60 * 1000 // 30 days
        );
        const recentSuccessRate = recentTxs.length > 0
            ? recentTxs.filter((tx) => tx.success).length / recentTxs.length
            : successRate;
        // Calculate risk
        let risk = 1 - recentSuccessRate;
        return {
            name: 'Transaction History',
            impact: risk,
            description: `${history.length} transactions, ${(successRate * 100).toFixed(1)}% success rate`,
        };
    }
    /**
     * Assess risk from transaction size
     */
    assessTransactionSizeRisk(amount) {
        const maxSingle = this.character.spendingLimits.maxSingleTransaction;
        const ratio = amount / maxSingle;
        let risk = 0;
        let description = '';
        if (ratio > 1) {
            risk = 0.9;
            description = `Amount exceeds limit: ${amount} > ${maxSingle}`;
        }
        else if (ratio > 0.8) {
            risk = 0.6;
            description = `Large transaction: ${(ratio * 100).toFixed(1)}% of limit`;
        }
        else if (ratio > 0.5) {
            risk = 0.3;
            description = `Medium transaction: ${(ratio * 100).toFixed(1)}% of limit`;
        }
        else {
            risk = 0.1;
            description = `Small transaction: ${(ratio * 100).toFixed(1)}% of limit`;
        }
        return {
            name: 'Transaction Size',
            impact: risk,
            description,
        };
    }
    /**
     * Assess risk from agent capabilities
     */
    assessCapabilityRisk(metadata) {
        const capabilities = metadata.capabilities;
        const accountAge = Date.now() - metadata.createdAt;
        const ageInDays = accountAge / (24 * 60 * 60 * 1000);
        let risk = 0;
        // New accounts are riskier
        if (ageInDays < 7) {
            risk += 0.5;
        }
        else if (ageInDays < 30) {
            risk += 0.2;
        }
        // Few capabilities might indicate limited experience
        if (capabilities.length < 2) {
            risk += 0.2;
        }
        risk = Math.min(1, risk);
        return {
            name: 'Agent Profile',
            impact: risk,
            description: `Account age: ${ageInDays.toFixed(0)} days, Capabilities: ${capabilities.length}`,
        };
    }
    /**
     * Record transaction outcome
     */
    recordTransaction(entry) {
        const history = this.transactionHistory.get(entry.counterparty) || [];
        history.push(entry);
        this.transactionHistory.set(entry.counterparty, history);
        // Keep only last 100 transactions per counterparty
        if (history.length > 100) {
            history.shift();
        }
    }
    /**
     * Get transaction history
     */
    getHistory(counterpartyDID) {
        return this.transactionHistory.get(counterpartyDID) || [];
    }
    /**
     * Clear history
     */
    clearHistory() {
        this.transactionHistory.clear();
    }
    /**
     * Update character configuration
     */
    updateCharacter(character) {
        this.character = character;
    }
}
//# sourceMappingURL=RiskAssessor.js.map