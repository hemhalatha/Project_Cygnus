/**
 * DID Manager
 *
 * Manages Decentralized Identifiers following W3C DID standards.
 */
import { DID, DIDDocument, DIDUpdate, DIDResolutionResult, VerificationMethod, ServiceEndpoint, MasumiConfig } from './types.js';
import { StellarClient } from '../../src/stellar/StellarClient.js';
/**
 * DID Manager for creating, resolving, and updating DIDs
 */
export declare class DIDManager {
    private config;
    private stellarClient;
    private didCache;
    constructor(config: MasumiConfig, stellarClient: StellarClient);
    /**
     * Create a new DID
     */
    createDID(publicKey: string): Promise<DIDDocument>;
    /**
     * Resolve a DID to its document
     */
    resolveDID(did: DID): Promise<DIDResolutionResult>;
    /**
     * Update a DID document
     */
    updateDID(did: DID, updates: DIDUpdate): Promise<DIDDocument>;
    /**
     * Add service endpoint to DID
     */
    addServiceEndpoint(did: DID, service: ServiceEndpoint): Promise<DIDDocument>;
    /**
     * Remove service endpoint from DID
     */
    removeServiceEndpoint(did: DID, serviceId: string): Promise<DIDDocument>;
    /**
     * Rotate key (add new, remove old)
     */
    rotateKey(did: DID, oldKeyId: string, newVerificationMethod: VerificationMethod): Promise<DIDDocument>;
    /**
     * Verify DID ownership
     */
    verifyDIDOwnership(did: DID, signature: string, challenge: string): Promise<boolean>;
    /**
     * Deactivate DID
     */
    deactivateDID(did: DID): Promise<void>;
    /**
     * Generate DID from public key
     */
    private generateDID;
    /**
     * Hash public key to create identifier
     */
    private hashPublicKey;
    /**
     * Store DID document
     */
    private storeDIDDocument;
    /**
     * Fetch DID document from registry
     */
    private fetchDIDDocument;
    /**
     * Clear cache
     */
    clearCache(): void;
    /**
     * Get cache statistics
     */
    getCacheStats(): {
        size: number;
        dids: DID[];
    };
}
//# sourceMappingURL=DIDManager.d.ts.map