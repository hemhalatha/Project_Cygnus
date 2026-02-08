/**
 * Risk Assessor
 *
 * Assesses counterparty risk using credit scores and transaction history.
 */
import { RiskAssessment, CharacterConfig } from '../runtime/types.js';
import { DID, AgentMetadata } from '../../protocols/masumi/types.js';
import { ReputationScore } from '../../protocols/sokosumi/types.js';
/**
 * Transaction history entry
 */
export interface TransactionHistoryEntry {
    counterparty: DID;
    type: 'payment' | 'loan' | 'trade';
    amount: number;
    success: boolean;
    timestamp: number;
}
/**
 * Risk Assessor for evaluating counterparty risk
 */
export declare class RiskAssessor {
    private character;
    private transactionHistory;
    constructor(character: CharacterConfig);
    /**
     * Assess counterparty risk
     */
    assessRisk(counterpartyDID: DID, reputation: ReputationScore | null, metadata: AgentMetadata | null, transactionAmount: number): Promise<RiskAssessment>;
    /**
     * Assess credit risk from reputation
     */
    private assessCreditRisk;
    /**
     * Assess risk from transaction history
     */
    private assessHistoryRisk;
    /**
     * Assess risk from transaction size
     */
    private assessTransactionSizeRisk;
    /**
     * Assess risk from agent capabilities
     */
    private assessCapabilityRisk;
    /**
     * Record transaction outcome
     */
    recordTransaction(entry: TransactionHistoryEntry): void;
    /**
     * Get transaction history
     */
    getHistory(counterpartyDID: DID): TransactionHistoryEntry[];
    /**
     * Clear history
     */
    clearHistory(): void;
    /**
     * Update character configuration
     */
    updateCharacter(character: CharacterConfig): void;
}
//# sourceMappingURL=RiskAssessor.d.ts.map