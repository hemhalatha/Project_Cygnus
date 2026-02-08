/**
 * Resource Allocator
 *
 * Manages resource allocation and coordination between agents.
 */
/**
 * Resource Allocator for managing shared resources
 */
export class ResourceAllocator {
    config;
    pools = new Map();
    allocations = new Map();
    eventListeners = new Map();
    constructor(config) {
        this.config = config;
    }
    /**
     * Create resource pool
     */
    createPool(resourceType, capacity) {
        if (this.pools.has(resourceType)) {
            throw new Error(`Pool already exists: ${resourceType}`);
        }
        this.pools.set(resourceType, {
            resourceType,
            totalCapacity: capacity,
            availableCapacity: capacity,
            allocations: new Map(),
        });
    }
    /**
     * Request resource allocation
     */
    async requestResource(request, requester, allocator) {
        const pool = this.pools.get(request.resourceType);
        if (!pool) {
            throw new Error(`Resource pool not found: ${request.resourceType}`);
        }
        // Check availability
        if (pool.availableCapacity < request.amount) {
            throw new Error(`Insufficient resources: requested ${request.amount}, available ${pool.availableCapacity}`);
        }
        // Create allocation
        const allocationId = this.generateAllocationId();
        const allocation = {
            allocationId,
            resourceType: request.resourceType,
            amount: request.amount,
            allocatedTo: requester,
            allocatedBy: allocator,
            expiresAt: Date.now() + request.duration * 1000,
            status: 'active',
        };
        // Update pool
        pool.availableCapacity -= request.amount;
        pool.allocations.set(allocationId, allocation);
        this.pools.set(request.resourceType, pool);
        // Store allocation
        this.allocations.set(allocationId, allocation);
        // Emit event
        this.emitEvent({
            type: 'resource_allocated',
            timestamp: Date.now(),
            data: { allocation },
        });
        return allocation;
    }
    /**
     * Release resource allocation
     */
    async releaseResource(allocationId) {
        const allocation = this.allocations.get(allocationId);
        if (!allocation) {
            throw new Error(`Allocation not found: ${allocationId}`);
        }
        if (allocation.status !== 'active') {
            throw new Error(`Allocation not active: ${allocation.status}`);
        }
        // Update pool
        const pool = this.pools.get(allocation.resourceType);
        if (pool) {
            pool.availableCapacity += allocation.amount;
            pool.allocations.delete(allocationId);
            this.pools.set(allocation.resourceType, pool);
        }
        // Update allocation
        allocation.status = 'released';
        this.allocations.set(allocationId, allocation);
        // Emit event
        this.emitEvent({
            type: 'resource_released',
            timestamp: Date.now(),
            data: { allocation },
        });
    }
    /**
     * Get allocation
     */
    getAllocation(allocationId) {
        return this.allocations.get(allocationId);
    }
    /**
     * Get allocations by agent
     */
    getAllocationsByAgent(agentDID) {
        return Array.from(this.allocations.values()).filter((a) => a.allocatedTo === agentDID);
    }
    /**
     * Get active allocations
     */
    getActiveAllocations() {
        return Array.from(this.allocations.values()).filter((a) => a.status === 'active');
    }
    /**
     * Get pool status
     */
    getPoolStatus(resourceType) {
        return this.pools.get(resourceType);
    }
    /**
     * Get all pools
     */
    getAllPools() {
        return Array.from(this.pools.values());
    }
    /**
     * Update pool capacity
     */
    updatePoolCapacity(resourceType, newCapacity) {
        const pool = this.pools.get(resourceType);
        if (!pool) {
            throw new Error(`Pool not found: ${resourceType}`);
        }
        const difference = newCapacity - pool.totalCapacity;
        pool.totalCapacity = newCapacity;
        pool.availableCapacity += difference;
        this.pools.set(resourceType, pool);
    }
    /**
     * Clean up expired allocations
     */
    async cleanupExpiredAllocations() {
        const now = Date.now();
        const expired = [];
        for (const [allocationId, allocation] of this.allocations.entries()) {
            if (allocation.status === 'active' && now > allocation.expiresAt) {
                expired.push(allocationId);
            }
        }
        // Release expired allocations
        for (const allocationId of expired) {
            const allocation = this.allocations.get(allocationId);
            if (allocation) {
                allocation.status = 'expired';
                this.allocations.set(allocationId, allocation);
                // Return resources to pool
                const pool = this.pools.get(allocation.resourceType);
                if (pool) {
                    pool.availableCapacity += allocation.amount;
                    pool.allocations.delete(allocationId);
                    this.pools.set(allocation.resourceType, pool);
                }
            }
        }
    }
    /**
     * Get resource utilization
     */
    getUtilization(resourceType) {
        const pool = this.pools.get(resourceType);
        if (!pool || pool.totalCapacity === 0) {
            return 0;
        }
        return (pool.totalCapacity - pool.availableCapacity) / pool.totalCapacity;
    }
    /**
     * Get statistics
     */
    getStatistics() {
        const pools = Array.from(this.pools.values());
        const allocations = Array.from(this.allocations.values());
        return {
            totalPools: pools.length,
            totalAllocations: allocations.length,
            activeAllocations: allocations.filter((a) => a.status === 'active').length,
            releasedAllocations: allocations.filter((a) => a.status === 'released').length,
            expiredAllocations: allocations.filter((a) => a.status === 'expired').length,
            averageUtilization: pools.reduce((sum, p) => sum + this.getUtilization(p.resourceType), 0) /
                pools.length || 0,
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
     * Generate allocation ID
     */
    generateAllocationId() {
        return `alloc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
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
        this.pools.clear();
        this.allocations.clear();
    }
}
//# sourceMappingURL=ResourceAllocator.js.map