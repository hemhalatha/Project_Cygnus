/**
 * Sokosumi Coordination Protocol Types
 *
 * Agent coordination, service discovery, and resource allocation.
 */
import { DID } from '../masumi/types.js';
/**
 * Service description
 */
export interface ServiceDescription {
    serviceId: string;
    agentDID: DID;
    serviceType: string;
    endpoint: string;
    pricing: PricingModel;
    capabilities: string[];
    availability: ServiceAvailability;
    metadata?: Record<string, any>;
}
/**
 * Pricing model
 */
export interface PricingModel {
    type: 'fixed' | 'dynamic' | 'auction' | 'free';
    amount?: number;
    currency?: string;
    unit?: string;
    dynamicFactors?: string[];
}
/**
 * Service availability
 */
export interface ServiceAvailability {
    status: 'available' | 'busy' | 'offline';
    capacity: number;
    currentLoad: number;
    responseTime: number;
}
/**
 * Service query
 */
export interface ServiceQuery {
    serviceType?: string;
    capabilities?: string[];
    maxPrice?: number;
    minReputation?: number;
    location?: string;
    availability?: 'available' | 'busy' | 'offline';
}
/**
 * Negotiation session
 */
export interface NegotiationSession {
    sessionId: string;
    participants: DID[];
    topic: string;
    currentProposal: Terms | null;
    proposalHistory: ProposalRecord[];
    status: NegotiationStatus;
    createdAt: number;
    expiresAt: number;
}
/**
 * Negotiation status
 */
export type NegotiationStatus = 'active' | 'agreed' | 'failed' | 'expired';
/**
 * Terms for negotiation
 */
export interface Terms {
    proposer: DID;
    price?: number;
    duration?: number;
    deliverables?: string[];
    conditions?: string[];
    metadata?: Record<string, any>;
}
/**
 * Proposal record
 */
export interface ProposalRecord {
    proposer: DID;
    terms: Terms;
    timestamp: number;
    response?: 'accept' | 'reject' | 'counter';
}
/**
 * Agreement
 */
export interface Agreement {
    agreementId: string;
    sessionId: string;
    participants: DID[];
    terms: Terms;
    signatures: Record<DID, string>;
    createdAt: number;
    status: 'active' | 'completed' | 'disputed';
}
/**
 * Resource allocation
 */
export interface ResourceAllocation {
    allocationId: string;
    resourceType: string;
    amount: number;
    allocatedTo: DID;
    allocatedBy: DID;
    expiresAt: number;
    status: 'active' | 'released' | 'expired';
}
/**
 * Resource request
 */
export interface ResourceRequest {
    resourceType: string;
    amount: number;
    duration: number;
    priority: 'low' | 'medium' | 'high';
    metadata?: Record<string, any>;
}
/**
 * Reputation score
 */
export interface ReputationScore {
    agentDID: DID;
    overallScore: number;
    transactionCount: number;
    successRate: number;
    averageResponseTime: number;
    disputes: number;
    lastUpdated: number;
}
/**
 * Coordination event
 */
export interface CoordinationEvent {
    type: 'service_registered' | 'service_discovered' | 'negotiation_started' | 'negotiation_completed' | 'resource_allocated' | 'resource_released';
    timestamp: number;
    data: any;
}
/**
 * Sokosumi configuration
 */
export interface SokosumiConfig {
    discoveryEndpoint?: string;
    negotiationTimeout: number;
    maxConcurrentNegotiations: number;
    reputationThreshold: number;
}
//# sourceMappingURL=types.d.ts.map