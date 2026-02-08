/**
 * Negotiation Engine
 *
 * Facilitates multi-party negotiations between agents.
 */
/**
 * Negotiation Engine for multi-party negotiations
 */
export class NegotiationEngine {
    config;
    sessions = new Map();
    agreements = new Map();
    eventListeners = new Map();
    constructor(config) {
        this.config = config;
    }
    /**
     * Initiate a negotiation session
     */
    async initiateNegotiation(participants, topic, initiator) {
        // Validate participants
        if (participants.length < 2) {
            throw new Error('Negotiation requires at least 2 participants');
        }
        if (!participants.includes(initiator)) {
            throw new Error('Initiator must be a participant');
        }
        // Check concurrent negotiations limit
        const activeCount = Array.from(this.sessions.values()).filter((s) => s.status === 'active').length;
        if (activeCount >= this.config.maxConcurrentNegotiations) {
            throw new Error('Maximum concurrent negotiations reached');
        }
        // Create session
        const sessionId = this.generateSessionId();
        const session = {
            sessionId,
            participants,
            topic,
            currentProposal: null,
            proposalHistory: [],
            status: 'active',
            createdAt: Date.now(),
            expiresAt: Date.now() + this.config.negotiationTimeout * 1000,
        };
        this.sessions.set(sessionId, session);
        // Emit event
        this.emitEvent({
            type: 'negotiation_started',
            timestamp: Date.now(),
            data: { session },
        });
        return session;
    }
    /**
     * Propose terms in a negotiation
     */
    async proposeTerms(sessionId, proposer, terms) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }
        // Validate session
        if (session.status !== 'active') {
            throw new Error(`Session not active: ${session.status}`);
        }
        if (Date.now() > session.expiresAt) {
            session.status = 'expired';
            this.sessions.set(sessionId, session);
            throw new Error('Session expired');
        }
        if (!session.participants.includes(proposer)) {
            throw new Error('Proposer not a participant');
        }
        // Add to proposal history
        const proposal = {
            proposer,
            terms: { ...terms, proposer },
            timestamp: Date.now(),
        };
        session.proposalHistory.push(proposal);
        session.currentProposal = terms;
        this.sessions.set(sessionId, session);
        return session;
    }
    /**
     * Accept terms
     */
    async acceptTerms(sessionId, acceptor, signature) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }
        if (!session.currentProposal) {
            throw new Error('No proposal to accept');
        }
        if (!session.participants.includes(acceptor)) {
            throw new Error('Acceptor not a participant');
        }
        // Mark last proposal as accepted
        if (session.proposalHistory.length > 0) {
            session.proposalHistory[session.proposalHistory.length - 1].response = 'accept';
        }
        // Create agreement
        const agreementId = this.generateAgreementId();
        const agreement = {
            agreementId,
            sessionId,
            participants: session.participants,
            terms: session.currentProposal,
            signatures: {
                [acceptor]: signature,
            },
            createdAt: Date.now(),
            status: 'active',
        };
        // Check if all participants have signed
        if (Object.keys(agreement.signatures).length === session.participants.length) {
            session.status = 'agreed';
            this.agreements.set(agreementId, agreement);
        }
        this.sessions.set(sessionId, session);
        // Emit event
        if (session.status === 'agreed') {
            this.emitEvent({
                type: 'negotiation_completed',
                timestamp: Date.now(),
                data: { session, agreement },
            });
        }
        return agreement;
    }
    /**
     * Reject terms
     */
    async rejectTerms(sessionId, rejector, reason) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }
        if (!session.participants.includes(rejector)) {
            throw new Error('Rejector not a participant');
        }
        // Mark last proposal as rejected
        if (session.proposalHistory.length > 0) {
            session.proposalHistory[session.proposalHistory.length - 1].response = 'reject';
        }
        this.sessions.set(sessionId, session);
        return session;
    }
    /**
     * Counter-propose terms
     */
    async counterPropose(sessionId, proposer, counterTerms) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }
        // Mark last proposal as countered
        if (session.proposalHistory.length > 0) {
            session.proposalHistory[session.proposalHistory.length - 1].response = 'counter';
        }
        // Add counter-proposal
        return await this.proposeTerms(sessionId, proposer, counterTerms);
    }
    /**
     * Cancel negotiation
     */
    async cancelNegotiation(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }
        session.status = 'failed';
        this.sessions.set(sessionId, session);
    }
    /**
     * Get negotiation session
     */
    getSession(sessionId) {
        return this.sessions.get(sessionId);
    }
    /**
     * Get sessions by participant
     */
    getSessionsByParticipant(participantDID) {
        return Array.from(this.sessions.values()).filter((s) => s.participants.includes(participantDID));
    }
    /**
     * Get active sessions
     */
    getActiveSessions() {
        return Array.from(this.sessions.values()).filter((s) => s.status === 'active');
    }
    /**
     * Get agreement
     */
    getAgreement(agreementId) {
        return this.agreements.get(agreementId);
    }
    /**
     * Get agreements by participant
     */
    getAgreementsByParticipant(participantDID) {
        return Array.from(this.agreements.values()).filter((a) => a.participants.includes(participantDID));
    }
    /**
     * Complete agreement
     */
    async completeAgreement(agreementId) {
        const agreement = this.agreements.get(agreementId);
        if (!agreement) {
            throw new Error(`Agreement not found: ${agreementId}`);
        }
        agreement.status = 'completed';
        this.agreements.set(agreementId, agreement);
    }
    /**
     * Dispute agreement
     */
    async disputeAgreement(agreementId, reason) {
        const agreement = this.agreements.get(agreementId);
        if (!agreement) {
            throw new Error(`Agreement not found: ${agreementId}`);
        }
        agreement.status = 'disputed';
        this.agreements.set(agreementId, agreement);
    }
    /**
     * Clean up expired sessions
     */
    async cleanupExpiredSessions() {
        const now = Date.now();
        for (const [sessionId, session] of this.sessions.entries()) {
            if (session.status === 'active' && now > session.expiresAt) {
                session.status = 'expired';
                this.sessions.set(sessionId, session);
            }
        }
    }
    /**
     * Get statistics
     */
    getStatistics() {
        const sessions = Array.from(this.sessions.values());
        const agreements = Array.from(this.agreements.values());
        return {
            totalSessions: sessions.length,
            activeSessions: sessions.filter((s) => s.status === 'active').length,
            agreedSessions: sessions.filter((s) => s.status === 'agreed').length,
            failedSessions: sessions.filter((s) => s.status === 'failed').length,
            totalAgreements: agreements.length,
            activeAgreements: agreements.filter((a) => a.status === 'active').length,
            completedAgreements: agreements.filter((a) => a.status === 'completed').length,
            disputedAgreements: agreements.filter((a) => a.status === 'disputed').length,
        };
    }
    /**
     * Add event listener
     */
    on(eventType, listener) {
        if (!this.eventListeners.has(eventType)) {
            this.eventListeners.set(eventType, []);
        }
        this.eventListeners.get(eventType).push(listener);
    }
    /**
     * Remove event listener
     */
    off(eventType, listener) {
        const listeners = this.eventListeners.get(eventType);
        if (listeners) {
            const index = listeners.indexOf(listener);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }
    // Private methods
    /**
     * Generate session ID
     */
    generateSessionId() {
        return `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }
    /**
     * Generate agreement ID
     */
    generateAgreementId() {
        return `agreement-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }
    /**
     * Emit event
     */
    emitEvent(event) {
        const listeners = this.eventListeners.get(event.type);
        if (listeners) {
            for (const listener of listeners) {
                try {
                    listener(event);
                }
                catch (error) {
                    console.error(`Error in event listener for ${event.type}:`, error);
                }
            }
        }
        const wildcardListeners = this.eventListeners.get('*');
        if (wildcardListeners) {
            for (const listener of wildcardListeners) {
                try {
                    listener(event);
                }
                catch (error) {
                    console.error(`Error in wildcard event listener:`, error);
                }
            }
        }
    }
    /**
     * Clear all data
     */
    clear() {
        this.sessions.clear();
        this.agreements.clear();
    }
}
//# sourceMappingURL=NegotiationEngine.js.map