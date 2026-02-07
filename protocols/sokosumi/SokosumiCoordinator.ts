/**
 * Sokosumi Coordinator
 * 
 * Main coordinator integrating service registry, negotiation, and resource allocation.
 */

import {
  ServiceDescription,
  ServiceQuery,
  NegotiationSession,
  Terms,
  Agreement,
  ResourceRequest,
  ResourceAllocation,
  ReputationScore,
  SokosumiConfig,
} from './types.js';
import { DID } from '../masumi/types.js';
import { ServiceRegistry } from './ServiceRegistry.js';
import { NegotiationEngine } from './NegotiationEngine.js';
import { ResourceAllocator } from './ResourceAllocator.js';

/**
 * Sokosumi Coordinator - main entry point for coordination protocol
 */
export class SokosumiCoordinator {
  private config: SokosumiConfig;
  private serviceRegistry: ServiceRegistry;
  private negotiationEngine: NegotiationEngine;
  private resourceAllocator: ResourceAllocator;

  constructor(config: SokosumiConfig) {
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
  async advertiseService(service: ServiceDescription): Promise<void> {
    return await this.serviceRegistry.advertiseService(service);
  }

  /**
   * Discover services
   */
  async discoverServices(query: ServiceQuery): Promise<ServiceDescription[]> {
    return await this.serviceRegistry.discoverServices(query);
  }

  /**
   * Update service availability
   */
  async updateServiceAvailability(
    serviceId: string,
    availability: Partial<ServiceDescription['availability']>
  ): Promise<void> {
    return await this.serviceRegistry.updateAvailability(serviceId, availability);
  }

  /**
   * Remove service
   */
  async removeService(serviceId: string): Promise<void> {
    return await this.serviceRegistry.removeService(serviceId);
  }

  /**
   * Get service by ID
   */
  getService(serviceId: string): ServiceDescription | undefined {
    return this.serviceRegistry.getService(serviceId);
  }

  // Negotiation Methods

  /**
   * Initiate negotiation
   */
  async initiateNegotiation(
    participants: DID[],
    topic: string,
    initiator: DID
  ): Promise<NegotiationSession> {
    return await this.negotiationEngine.initiateNegotiation(
      participants,
      topic,
      initiator
    );
  }

  /**
   * Propose terms
   */
  async proposeTerms(
    sessionId: string,
    proposer: DID,
    terms: Terms
  ): Promise<NegotiationSession> {
    return await this.negotiationEngine.proposeTerms(sessionId, proposer, terms);
  }

  /**
   * Accept terms
   */
  async acceptTerms(
    sessionId: string,
    acceptor: DID,
    signature: string
  ): Promise<Agreement> {
    return await this.negotiationEngine.acceptTerms(sessionId, acceptor, signature);
  }

  /**
   * Reject terms
   */
  async rejectTerms(
    sessionId: string,
    rejector: DID,
    reason?: string
  ): Promise<NegotiationSession> {
    return await this.negotiationEngine.rejectTerms(sessionId, rejector, reason);
  }

  /**
   * Counter-propose
   */
  async counterPropose(
    sessionId: string,
    proposer: DID,
    counterTerms: Terms
  ): Promise<NegotiationSession> {
    return await this.negotiationEngine.counterPropose(
      sessionId,
      proposer,
      counterTerms
    );
  }

  /**
   * Get negotiation session
   */
  getNegotiationSession(sessionId: string): NegotiationSession | undefined {
    return this.negotiationEngine.getSession(sessionId);
  }

  /**
   * Get agreement
   */
  getAgreement(agreementId: string): Agreement | undefined {
    return this.negotiationEngine.getAgreement(agreementId);
  }

  // Resource Allocation Methods

  /**
   * Create resource pool
   */
  createResourcePool(resourceType: string, capacity: number): void {
    return this.resourceAllocator.createPool(resourceType, capacity);
  }

  /**
   * Request resource
   */
  async requestResource(
    request: ResourceRequest,
    requester: DID,
    allocator: DID
  ): Promise<ResourceAllocation> {
    return await this.resourceAllocator.requestResource(
      request,
      requester,
      allocator
    );
  }

  /**
   * Release resource
   */
  async releaseResource(allocationId: string): Promise<void> {
    return await this.resourceAllocator.releaseResource(allocationId);
  }

  /**
   * Get resource allocation
   */
  getResourceAllocation(allocationId: string): ResourceAllocation | undefined {
    return this.resourceAllocator.getAllocation(allocationId);
  }

  /**
   * Get pool status
   */
  getPoolStatus(resourceType: string) {
    return this.resourceAllocator.getPoolStatus(resourceType);
  }

  // Reputation Methods

  /**
   * Get reputation
   */
  async getReputation(agentDID: DID): Promise<ReputationScore | null> {
    return await this.serviceRegistry.getReputation(agentDID);
  }

  /**
   * Record successful transaction
   */
  async recordSuccess(agentDID: DID, responseTime: number): Promise<void> {
    return await this.serviceRegistry.recordSuccess(agentDID, responseTime);
  }

  /**
   * Record failed transaction
   */
  async recordFailure(agentDID: DID): Promise<void> {
    return await this.serviceRegistry.recordFailure(agentDID);
  }

  /**
   * Record dispute
   */
  async recordDispute(agentDID: DID): Promise<void> {
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
  getServicesByAgent(agentDID: DID): ServiceDescription[] {
    return this.serviceRegistry.getServicesByAgent(agentDID);
  }

  /**
   * Get negotiations by participant
   */
  getNegotiationsByParticipant(participantDID: DID): NegotiationSession[] {
    return this.negotiationEngine.getSessionsByParticipant(participantDID);
  }

  /**
   * Get allocations by agent
   */
  getAllocationsByAgent(agentDID: DID): ResourceAllocation[] {
    return this.resourceAllocator.getAllocationsByAgent(agentDID);
  }

  // Event Listeners

  /**
   * Subscribe to service events
   */
  onServiceEvent(eventType: string, listener: (event: any) => void): void {
    this.serviceRegistry.on(eventType, listener);
  }

  /**
   * Subscribe to negotiation events
   */
  onNegotiationEvent(eventType: string, listener: (event: any) => void): void {
    this.negotiationEngine.on(eventType, listener);
  }

  /**
   * Subscribe to resource events
   */
  onResourceEvent(eventType: string, listener: (event: any) => void): void {
    this.resourceAllocator.on(eventType, listener);
  }

  // Cleanup and Maintenance

  /**
   * Start periodic cleanup tasks
   */
  private startCleanupTasks(): void {
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
  async shutdown(): Promise<void> {
    // Clear all data
    this.serviceRegistry.clear();
    this.negotiationEngine.clear();
    this.resourceAllocator.clear();
  }
}
