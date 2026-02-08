/**
 * Sokosumi Coordinator
 *
 * Main coordinator integrating service registry, negotiation, and resource allocation.
 */
import { ServiceRegistry } from './ServiceRegistry.js';
import { NegotiationEngine } from './NegotiationEngine.js';
import { ResourceAllocator } from './ResourceAllocator.js';
/**
 * Sokosumi Coordinator - main entry point for coordination protocol
 */
export class SokosumiCoordinator {
    config;
    serviceRegistry;
    negotiationEngine;
    resourceAllocator;
    constructor(config) {
        this.config = config;
        this.serviceRegistry = new ServiceRegistry(config);
        this.negotiationEngine = new NegotiationEngine(config);
        this.resourceAllocator = new ResourceAllocator(config);
        // Set up periodic cleanup
        this.startCleanupTasks();
    }
    // Service Registry Methods
    /**
     * Advertise a service
     */
    async advertiseService(service) {
        return await this.serviceRegistry.advertiseService(service);
    }
    /**
     * Discover services
     */
    async discoverServices(query) {
        return await this.serviceRegistry.discoverServices(query);
    }
    /**
     * Update service availability
     */
    async updateServiceAvailability(serviceId, availability) {
        return await this.serviceRegistry.updateAvailability(serviceId, availability);
    }
    /**
     * Remove service
     */
    async removeService(serviceId) {
        return await this.serviceRegistry.removeService(serviceId);
    }
    /**
     * Get service by ID
     */
    getService(serviceId) {
        return this.serviceRegistry.getService(serviceId);
    }
    // Negotiation Methods
    /**
     * Initiate negotiation
     */
    async initiateNegotiation(participants, topic, initiator) {
        return await this.negotiationEngine.initiateNegotiation(participants, topic, initiator);
    }
    /**
     * Propose terms
     */
    async proposeTerms(sessionId, proposer, terms) {
        return await this.negotiationEngine.proposeTerms(sessionId, proposer, terms);
    }
    /**
     * Accept terms
     */
    async acceptTerms(sessionId, acceptor, signature) {
        return await this.negotiationEngine.acceptTerms(sessionId, acceptor, signature);
    }
    /**
     * Reject terms
     */
    async rejectTerms(sessionId, rejector, reason) {
        return await this.negotiationEngine.rejectTerms(sessionId, rejector, reason);
    }
    /**
     * Counter-propose
     */
    async counterPropose(sessionId, proposer, counterTerms) {
        return await this.negotiationEngine.counterPropose(sessionId, proposer, counterTerms);
    }
    /**
     * Get negotiation session
     */
    getNegotiationSession(sessionId) {
        return this.negotiationEngine.getSession(sessionId);
    }
    /**
     * Get agreement
     */
    getAgreement(agreementId) {
        return this.negotiationEngine.getAgreement(agreementId);
    }
    // Resource Allocation Methods
    /**
     * Create resource pool
     */
    createResourcePool(resourceType, capacity) {
        return this.resourceAllocator.createPool(resourceType, capacity);
    }
    /**
     * Request resource
     */
    async requestResource(request, requester, allocator) {
        return await this.resourceAllocator.requestResource(request, requester, allocator);
    }
    /**
     * Release resource
     */
    async releaseResource(allocationId) {
        return await this.resourceAllocator.releaseResource(allocationId);
    }
    /**
     * Get resource allocation
     */
    getResourceAllocation(allocationId) {
        return this.resourceAllocator.getAllocation(allocationId);
    }
    /**
     * Get pool status
     */
    getPoolStatus(resourceType) {
        return this.resourceAllocator.getPoolStatus(resourceType);
    }
    // Reputation Methods
    /**
     * Get reputation
     */
    async getReputation(agentDID) {
        return await this.serviceRegistry.getReputation(agentDID);
    }
    /**
     * Record successful transaction
     */
    async recordSuccess(agentDID, responseTime) {
        return await this.serviceRegistry.recordSuccess(agentDID, responseTime);
    }
    /**
     * Record failed transaction
     */
    async recordFailure(agentDID) {
        return await this.serviceRegistry.recordFailure(agentDID);
    }
    /**
     * Record dispute
     */
    async recordDispute(agentDID) {
        return await this.serviceRegistry.recordDispute(agentDID);
    }
    // Statistics and Monitoring
    /**
     * Get overall statistics
     */
    getStatistics() {
        return {
            services: this.serviceRegistry.getStatistics(),
            negotiations: this.negotiationEngine.getStatistics(),
            resources: this.resourceAllocator.getStatistics(),
        };
    }
    /**
     * Get services by agent
     */
    getServicesByAgent(agentDID) {
        return this.serviceRegistry.getServicesByAgent(agentDID);
    }
    /**
     * Get negotiations by participant
     */
    getNegotiationsByParticipant(participantDID) {
        return this.negotiationEngine.getSessionsByParticipant(participantDID);
    }
    /**
     * Get allocations by agent
     */
    getAllocationsByAgent(agentDID) {
        return this.resourceAllocator.getAllocationsByAgent(agentDID);
    }
    // Event Listeners
    /**
     * Subscribe to service events
     */
    onServiceEvent(eventType, listener) {
        this.serviceRegistry.on(eventType, listener);
    }
    /**
     * Subscribe to negotiation events
     */
    onNegotiationEvent(eventType, listener) {
        this.negotiationEngine.on(eventType, listener);
    }
    /**
     * Subscribe to resource events
     */
    onResourceEvent(eventType, listener) {
        this.resourceAllocator.on(eventType, listener);
    }
    // Cleanup and Maintenance
    /**
     * Start periodic cleanup tasks
     */
    startCleanupTasks() {
        // Clean up expired negotiations every minute
        setInterval(() => {
            this.negotiationEngine.cleanupExpiredSessions();
        }, 60000);
        // Clean up expired resource allocations every minute
        setInterval(() => {
            this.resourceAllocator.cleanupExpiredAllocations();
        }, 60000);
    }
    /**
     * Shutdown coordinator
     */
    async shutdown() {
        // Clear all data
        this.serviceRegistry.clear();
        this.negotiationEngine.clear();
        this.resourceAllocator.clear();
    }
}
//# sourceMappingURL=SokosumiCoordinator.js.map