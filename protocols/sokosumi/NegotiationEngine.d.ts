/**
 * Negotiation Engine
 *
 * Facilitates multi-party negotiations between agents.
 */
import { NegotiationSession, Terms, Agreement, SokosumiConfig, CoordinationEvent } from './types.js';
import { DID } from '../masumi/types.js';
/**
 * Negotiation Engine for multi-party negotiations
 */
export declare class NegotiationEngine {
    private config;
    private sessions;
    private agreements;
    private eventListeners;
    constructor(config: SokosumiConfig);
    /**
     * Initiate a negotiation session
     */
    initiateNegotiation(participants: DID[], topic: string, initiator: DID): Promise<NegotiationSession>;
    /**
     * Propose terms in a negotiation
     */
    proposeTerms(sessionId: string, proposer: DID, terms: Terms): Promise<NegotiationSession>;
    /**
     * Accept terms
     */
    acceptTerms(sessionId: string, acceptor: DID, signature: string): Promise<Agreement>;
    /**
     * Reject terms
     */
    rejectTerms(sessionId: string, rejector: DID, reason?: string): Promise<NegotiationSession>;
    /**
     * Counter-propose terms
     */
    counterPropose(sessionId: string, proposer: DID, counterTerms: Terms): Promise<NegotiationSession>;
    /**
     * Cancel negotiation
     */
    cancelNegotiation(sessionId: string): Promise<void>;
    /**
     * Get negotiation session
     */
    getSession(sessionId: string): NegotiationSession | undefined;
    /**
     * Get sessions by participant
     */
    getSessionsByParticipant(participantDID: DID): NegotiationSession[];
    /**
     * Get active sessions
     */
    getActiveSessions(): NegotiationSession[];
    /**
     * Get agreement
     */
    getAgreement(agreementId: string): Agreement | undefined;
    /**
     * Get agreements by participant
     */
    getAgreementsByParticipant(participantDID: DID): Agreement[];
    /**
     * Complete agreement
     */
    completeAgreement(agreementId: string): Promise<void>;
    /**
     * Dispute agreement
     */
    disputeAgreement(agreementId: string, reason: string): Promise<void>;
    /**
     * Clean up expired sessions
     */
    cleanupExpiredSessions(): Promise<void>;
    /**
     * Get statistics
     */
    getStatistics(): {
        totalSessions: number;
        activeSessions: number;
        agreedSessions: number;
        failedSessions: number;
        totalAgreements: number;
        activeAgreements: number;
        completedAgreements: number;
        disputedAgreements: number;
    };
    /**
     * Add event listener
     */
    on(eventType: string, listener: (event: CoordinationEvent) => void): void;
    /**
     * Remove event listener
     */
    off(eventType: string, listener: (event: CoordinationEvent) => void): void;
    /**
     * Generate session ID
     */
    private generateSessionId;
    /**
     * Generate agreement ID
     */
    private generateAgreementId;
    /**
     * Emit event
     */
    private emitEvent;
    /**
     * Clear all data
     */
    clear(): void;
}
//# sourceMappingURL=NegotiationEngine.d.ts.map