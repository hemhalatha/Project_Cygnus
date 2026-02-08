/**
 * DID Manager
 *
 * Manages Decentralized Identifiers following W3C DID standards.
 */
/**
 * DID Manager for creating, resolving, and updating DIDs
 */
export class DIDManager {
    config;
    stellarClient;
    didCache = new Map();
    constructor(config, stellarClient) {
        this.config = config;
        this.stellarClient = stellarClient;
    }
    /**
     * Create a new DID
     */
    async createDID(publicKey) {
        // Generate DID using configured method
        const did = this.generateDID(publicKey);
        // Create DID document
        const didDocument = {
            '@context': [
                'https://www.w3.org/ns/did/v1',
                'https://w3id.org/security/suites/ed25519-2020/v1',
            ],
            id: did,
            verificationMethod: [
                {
                    id: `${did}#key-1`,
                    type: 'Ed25519VerificationKey2020',
                    controller: did,
                    publicKeyMultibase: publicKey,
                },
            ],
            authentication: [`${did}#key-1`],
            assertionMethod: [`${did}#key-1`],
            service: [],
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
        };
        // Store in cache
        this.didCache.set(did, didDocument);
        // In production, this would be stored on-chain or in a DID registry
        await this.storeDIDDocument(didDocument);
        return didDocument;
    }
    /**
     * Resolve a DID to its document
     */
    async resolveDID(did) {
        // Check cache first
        const cached = this.didCache.get(did);
        if (cached) {
            return {
                didDocument: cached,
                didDocumentMetadata: {
                    created: cached.created,
                    updated: cached.updated,
                },
                didResolutionMetadata: {
                    contentType: 'application/did+json',
                },
            };
        }
        // Fetch from registry
        try {
            const didDocument = await this.fetchDIDDocument(did);
            if (didDocument) {
                this.didCache.set(did, didDocument);
                return {
                    didDocument,
                    didDocumentMetadata: {
                        created: didDocument.created,
                        updated: didDocument.updated,
                    },
                    didResolutionMetadata: {
                        contentType: 'application/did+json',
                    },
                };
            }
            return {
                didDocument: null,
                didDocumentMetadata: {},
                didResolutionMetadata: {
                    error: 'notFound',
                },
            };
        }
        catch (error) {
            return {
                didDocument: null,
                didDocumentMetadata: {},
                didResolutionMetadata: {
                    error: `Resolution failed: ${error}`,
                },
            };
        }
    }
    /**
     * Update a DID document
     */
    async updateDID(did, updates) {
        // Resolve current document
        const resolution = await this.resolveDID(did);
        if (!resolution.didDocument) {
            throw new Error(`DID not found: ${did}`);
        }
        const currentDoc = resolution.didDocument;
        const updatedDoc = { ...currentDoc };
        // Apply updates
        if (updates.addVerificationMethod) {
            updatedDoc.verificationMethod = [
                ...updatedDoc.verificationMethod,
                ...updates.addVerificationMethod,
            ];
        }
        if (updates.removeVerificationMethod) {
            updatedDoc.verificationMethod = updatedDoc.verificationMethod.filter((vm) => !updates.removeVerificationMethod.includes(vm.id));
        }
        if (updates.addService) {
            updatedDoc.service = [...updatedDoc.service, ...updates.addService];
        }
        if (updates.removeService) {
            updatedDoc.service = updatedDoc.service.filter((s) => !updates.removeService.includes(s.id));
        }
        if (updates.controller) {
            updatedDoc.controller = updates.controller;
        }
        // Update timestamp
        updatedDoc.updated = new Date().toISOString();
        // Store updated document
        await this.storeDIDDocument(updatedDoc);
        // Update cache
        this.didCache.set(did, updatedDoc);
        return updatedDoc;
    }
    /**
     * Add service endpoint to DID
     */
    async addServiceEndpoint(did, service) {
        return await this.updateDID(did, {
            addService: [service],
        });
    }
    /**
     * Remove service endpoint from DID
     */
    async removeServiceEndpoint(did, serviceId) {
        return await this.updateDID(did, {
            removeService: [serviceId],
        });
    }
    /**
     * Rotate key (add new, remove old)
     */
    async rotateKey(did, oldKeyId, newVerificationMethod) {
        return await this.updateDID(did, {
            addVerificationMethod: [newVerificationMethod],
            removeVerificationMethod: [oldKeyId],
        });
    }
    /**
     * Verify DID ownership
     */
    async verifyDIDOwnership(did, signature, challenge) {
        const resolution = await this.resolveDID(did);
        if (!resolution.didDocument) {
            return false;
        }
        // In production, verify signature using verification method
        // For now, simple validation
        return signature.length > 0 && challenge.length > 0;
    }
    /**
     * Deactivate DID
     */
    async deactivateDID(did) {
        const resolution = await this.resolveDID(did);
        if (!resolution.didDocument) {
            throw new Error(`DID not found: ${did}`);
        }
        // Mark as deactivated in registry
        // In production, this would update the on-chain registry
        this.didCache.delete(did);
    }
    // Private methods
    /**
     * Generate DID from public key
     */
    generateDID(publicKey) {
        const method = this.config.didMethod;
        const identifier = this.hashPublicKey(publicKey);
        return `did:${method}:${identifier}`;
    }
    /**
     * Hash public key to create identifier
     */
    hashPublicKey(publicKey) {
        // In production, use proper cryptographic hash
        // For now, use simple encoding
        return Buffer.from(publicKey).toString('base64').substring(0, 32);
    }
    /**
     * Store DID document
     */
    async storeDIDDocument(didDocument) {
        // In production, store on-chain or in distributed registry
        // For now, just cache
        this.didCache.set(didDocument.id, didDocument);
    }
    /**
     * Fetch DID document from registry
     */
    async fetchDIDDocument(did) {
        // In production, fetch from on-chain registry or distributed storage
        // For now, return from cache
        return this.didCache.get(did) || null;
    }
    /**
     * Clear cache
     */
    clearCache() {
        this.didCache.clear();
    }
    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.didCache.size,
            dids: Array.from(this.didCache.keys()),
        };
    }
}
//# sourceMappingURL=DIDManager.js.map