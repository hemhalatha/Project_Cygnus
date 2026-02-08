/**
 * Service Registry
 *
 * Registry for agent service advertisement and discovery.
 */
import { ServiceDescription, ServiceQuery, ReputationScore, SokosumiConfig, CoordinationEvent } from './types.js';
import { DID } from '../masumi/types.js';
/**
 * Service Registry for advertising and discovering services
 */
export declare class ServiceRegistry {
    private config;
    private services;
    private reputations;
    private eventListeners;
    constructor(config: SokosumiConfig);
    /**
     * Advertise a service
     */
    advertiseService(service: ServiceDescription): Promise<void>;
    /**
     * Discover services
     */
    discoverServices(query: ServiceQuery): Promise<ServiceDescription[]>;
    /**
     * Update service availability
     */
    updateAvailability(serviceId: string, availability: Partial<ServiceDescription['availability']>): Promise<void>;
    /**
     * Remove service
     */
    removeService(serviceId: string): Promise<void>;
    /**
     * Get service by ID
     */
    getService(serviceId: string): ServiceDescription | undefined;
    /**
     * Get services by agent
     */
    getServicesByAgent(agentDID: DID): ServiceDescription[];
    /**
     * Get reputation score
     */
    getReputation(agentDID: DID): Promise<ReputationScore | null>;
    /**
     * Update reputation score
     */
    updateReputation(agentDID: DID, update: Partial<ReputationScore>): Promise<void>;
    /**
     * Record successful transaction
     */
    recordSuccess(agentDID: DID, responseTime: number): Promise<void>;
    /**
     * Record failed transaction
     */
    recordFailure(agentDID: DID): Promise<void>;
    /**
     * Record dispute
     */
    recordDispute(agentDID: DID): Promise<void>;
    /**
     * Get all services
     */
    getAllServices(): ServiceDescription[];
    /**
     * Get statistics
     */
    getStatistics(): {
        totalServices: number;
        availableServices: number;
        serviceTypes: number;
        averageReputation: number;
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
     * Emit event
     */
    private emitEvent;
    /**
     * Clear registry
     */
    clear(): void;
}
//# sourceMappingURL=ServiceRegistry.d.ts.map