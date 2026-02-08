/**
 * Resource Allocator
 *
 * Manages resource allocation and coordination between agents.
 */
import { ResourceAllocation, ResourceRequest, SokosumiConfig, CoordinationEvent } from './types.js';
import { DID } from '../masumi/types.js';
/**
 * Resource pool
 */
interface ResourcePool {
    resourceType: string;
    totalCapacity: number;
    availableCapacity: number;
    allocations: Map<string, ResourceAllocation>;
}
/**
 * Resource Allocator for managing shared resources
 */
export declare class ResourceAllocator {
    private config;
    private pools;
    private allocations;
    private eventListeners;
    constructor(config: SokosumiConfig);
    /**
     * Create resource pool
     */
    createPool(resourceType: string, capacity: number): void;
    /**
     * Request resource allocation
     */
    requestResource(request: ResourceRequest, requester: DID, allocator: DID): Promise<ResourceAllocation>;
    /**
     * Release resource allocation
     */
    releaseResource(allocationId: string): Promise<void>;
    /**
     * Get allocation
     */
    getAllocation(allocationId: string): ResourceAllocation | undefined;
    /**
     * Get allocations by agent
     */
    getAllocationsByAgent(agentDID: DID): ResourceAllocation[];
    /**
     * Get active allocations
     */
    getActiveAllocations(): ResourceAllocation[];
    /**
     * Get pool status
     */
    getPoolStatus(resourceType: string): ResourcePool | undefined;
    /**
     * Get all pools
     */
    getAllPools(): ResourcePool[];
    /**
     * Update pool capacity
     */
    updatePoolCapacity(resourceType: string, newCapacity: number): void;
    /**
     * Clean up expired allocations
     */
    cleanupExpiredAllocations(): Promise<void>;
    /**
     * Get resource utilization
     */
    getUtilization(resourceType: string): number;
    /**
     * Get statistics
     */
    getStatistics(): {
        totalPools: number;
        totalAllocations: number;
        activeAllocations: number;
        releasedAllocations: number;
        expiredAllocations: number;
        averageUtilization: number;
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
     * Generate allocation ID
     */
    private generateAllocationId;
    /**
     * Emit event
     */
    private emitEvent;
    /**
     * Clear all data
     */
    clear(): void;
}
export {};
//# sourceMappingURL=ResourceAllocator.d.ts.map