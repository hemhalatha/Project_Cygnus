/**
 * Service Registry
 *
 * Registry for agent service advertisement and discovery.
 */
/**
 * Service Registry for advertising and discovering services
 */
export class ServiceRegistry {
    config;
    services = new Map();
    reputations = new Map();
    eventListeners = new Map();
    constructor(config) {
        this.config = config;
    }
    /**
     * Advertise a service
     */
    async advertiseService(service) {
        // Validate service
        if (!service.serviceId || !service.agentDID) {
            throw new Error('Service must have serviceId and agentDID');
        }
        // Check reputation threshold
        const reputation = await this.getReputation(service.agentDID);
        if (reputation && reputation.overallScore < this.config.reputationThreshold) {
            throw new Error(`Agent reputation below threshold: ${reputation.overallScore}`);
        }
        // Store service
        this.services.set(service.serviceId, service);
        // Emit event
        this.emitEvent({
            type: 'service_registered',
            timestamp: Date.now(),
            data: { service },
        });
    }
    /**
     * Discover services
     */
    async discoverServices(query) {
        let results = Array.from(this.services.values());
        // Filter by service type
        if (query.serviceType) {
            results = results.filter((s) => s.serviceType === query.serviceType);
        }
        // Filter by capabilities
        if (query.capabilities && query.capabilities.length > 0) {
            results = results.filter((s) => query.capabilities.every((cap) => s.capabilities.includes(cap)));
        }
        // Filter by price
        if (query.maxPrice !== undefined) {
            results = results.filter((s) => !s.pricing.amount || s.pricing.amount <= query.maxPrice);
        }
        // Filter by reputation
        if (query.minReputation !== undefined) {
            const filteredResults = [];
            for (const service of results) {
                const reputation = await this.getReputation(service.agentDID);
                if (reputation && reputation.overallScore >= query.minReputation) {
                    filteredResults.push(service);
                }
            }
            results = filteredResults;
        }
        // Filter by availability
        if (query.availability) {
            results = results.filter((s) => s.availability.status === query.availability);
        }
        // Emit event
        this.emitEvent({
            type: 'service_discovered',
            timestamp: Date.now(),
            data: { query, resultCount: results.length },
        });
        return results;
    }
    /**
     * Update service availability
     */
    async updateAvailability(serviceId, availability) {
        const service = this.services.get(serviceId);
        if (!service) {
            throw new Error(`Service not found: ${serviceId}`);
        }
        service.availability = {
            ...service.availability,
            ...availability,
        };
        this.services.set(serviceId, service);
    }
    /**
     * Remove service
     */
    async removeService(serviceId) {
        this.services.delete(serviceId);
    }
    /**
     * Get service by ID
     */
    getService(serviceId) {
        return this.services.get(serviceId);
    }
    /**
     * Get services by agent
     */
    getServicesByAgent(agentDID) {
        return Array.from(this.services.values()).filter((s) => s.agentDID === agentDID);
    }
    /**
     * Get reputation score
     */
    async getReputation(agentDID) {
        return this.reputations.get(agentDID) || null;
    }
    /**
     * Update reputation score
     */
    async updateReputation(agentDID, update) {
        const current = this.reputations.get(agentDID) || {
            agentDID,
            overallScore: 500,
            transactionCount: 0,
            successRate: 1.0,
            averageResponseTime: 0,
            disputes: 0,
            lastUpdated: Date.now(),
        };
        const updated = {
            ...current,
            ...update,
            lastUpdated: Date.now(),
        };
        this.reputations.set(agentDID, updated);
    }
    /**
     * Record successful transaction
     */
    async recordSuccess(agentDID, responseTime) {
        const reputation = await this.getReputation(agentDID);
        if (reputation) {
            const newCount = reputation.transactionCount + 1;
            const newSuccessRate = (reputation.successRate * reputation.transactionCount + 1) / newCount;
            const newAvgResponseTime = (reputation.averageResponseTime * reputation.transactionCount + responseTime) /
                newCount;
            await this.updateReputation(agentDID, {
                transactionCount: newCount,
                successRate: newSuccessRate,
                averageResponseTime: newAvgResponseTime,
                overallScore: Math.min(1000, reputation.overallScore + 10),
            });
        }
        else {
            await this.updateReputation(agentDID, {
                transactionCount: 1,
                successRate: 1.0,
                averageResponseTime: responseTime,
                overallScore: 510,
            });
        }
    }
    /**
     * Record failed transaction
     */
    async recordFailure(agentDID) {
        const reputation = await this.getReputation(agentDID);
        if (reputation) {
            const newCount = reputation.transactionCount + 1;
            const newSuccessRate = (reputation.successRate * reputation.transactionCount) / newCount;
            await this.updateReputation(agentDID, {
                transactionCount: newCount,
                successRate: newSuccessRate,
                overallScore: Math.max(0, reputation.overallScore - 20),
            });
        }
        else {
            await this.updateReputation(agentDID, {
                transactionCount: 1,
                successRate: 0.0,
                overallScore: 480,
            });
        }
    }
    /**
     * Record dispute
     */
    async recordDispute(agentDID) {
        const reputation = await this.getReputation(agentDID);
        if (reputation) {
            await this.updateReputation(agentDID, {
                disputes: reputation.disputes + 1,
                overallScore: Math.max(0, reputation.overallScore - 50),
            });
        }
    }
    /**
     * Get all services
     */
    getAllServices() {
        return Array.from(this.services.values());
    }
    /**
     * Get statistics
     */
    getStatistics() {
        const services = Array.from(this.services.values());
        const reputations = Array.from(this.reputations.values());
        return {
            totalServices: services.length,
            availableServices: services.filter((s) => s.availability.status === 'available').length,
            serviceTypes: new Set(services.map((s) => s.serviceType)).size,
            averageReputation: reputations.reduce((sum, r) => sum + r.overallScore, 0) /
                reputations.length || 0,
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
        // Also emit to wildcard listeners
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
     * Clear registry
     */
    clear() {
        this.services.clear();
        this.reputations.clear();
    }
}
//# sourceMappingURL=ServiceRegistry.js.map