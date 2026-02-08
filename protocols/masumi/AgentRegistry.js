/**
 * Agent Registry
 *
 * NFT-based registry for agent metadata and discovery.
 */
/**
 * Agent Registry for registering and discovering agents
 */
export class AgentRegistry {
    config;
    stellarClient;
    registry = new Map();
    nftCounter = 0;
    constructor(config, stellarClient) {
        this.config = config;
        this.stellarClient = stellarClient;
    }
    /**
     * Register an agent in the registry
     */
    async registerAgent(did, metadata, ownerPublicKey, ownerSecretKey) {
        // Check if already registered
        if (this.registry.has(did)) {
            throw new Error(`Agent already registered: ${did}`);
        }
        // Generate NFT token ID
        const nftTokenId = this.generateNFTTokenId();
        // Create registry entry
        const entry = {
            did,
            metadata,
            nftTokenId,
            contractAddress: this.config.registryContractId || 'default-registry',
            owner: ownerPublicKey,
        };
        // Mint NFT on-chain (in production)
        const txResult = await this.mintRegistryNFT(entry, ownerSecretKey);
        if (!txResult.success) {
            throw new Error(`Failed to register agent: ${txResult.error}`);
        }
        // Store in registry
        this.registry.set(did, entry);
        return entry;
    }
    /**
     * Lookup agent by DID
     */
    async lookupAgent(did) {
        // Check local registry
        const entry = this.registry.get(did);
        if (entry) {
            return entry;
        }
        // Fetch from on-chain registry
        const onChainEntry = await this.fetchFromChain(did);
        if (onChainEntry) {
            this.registry.set(did, onChainEntry);
            return onChainEntry;
        }
        return null;
    }
    /**
     * Update agent metadata
     */
    async updateAgent(did, metadata, ownerSecretKey) {
        const entry = this.registry.get(did);
        if (!entry) {
            throw new Error(`Agent not found: ${did}`);
        }
        // Update metadata
        const updatedMetadata = {
            ...entry.metadata,
            ...metadata,
            updatedAt: Date.now(),
        };
        const updatedEntry = {
            ...entry,
            metadata: updatedMetadata,
        };
        // Update on-chain
        const txResult = await this.updateOnChain(updatedEntry, ownerSecretKey);
        if (!txResult.success) {
            throw new Error(`Failed to update agent: ${txResult.error}`);
        }
        // Update registry
        this.registry.set(did, updatedEntry);
        return updatedEntry;
    }
    /**
     * Deregister agent
     */
    async deregisterAgent(did, ownerSecretKey) {
        const entry = this.registry.get(did);
        if (!entry) {
            throw new Error(`Agent not found: ${did}`);
        }
        // Burn NFT on-chain
        const txResult = await this.burnRegistryNFT(entry, ownerSecretKey);
        if (!txResult.success) {
            throw new Error(`Failed to deregister agent: ${txResult.error}`);
        }
        // Remove from registry
        this.registry.delete(did);
    }
    /**
     * Search agents by capability
     */
    async searchByCapability(capability) {
        const results = [];
        for (const entry of this.registry.values()) {
            if (entry.metadata.capabilities.includes(capability)) {
                results.push(entry);
            }
        }
        return results;
    }
    /**
     * Search agents by name
     */
    async searchByName(name) {
        const results = [];
        const searchTerm = name.toLowerCase();
        for (const entry of this.registry.values()) {
            if (entry.metadata.name.toLowerCase().includes(searchTerm)) {
                results.push(entry);
            }
        }
        return results;
    }
    /**
     * Get agents by reputation score
     */
    async getTopAgents(minScore, limit = 10) {
        const agents = Array.from(this.registry.values())
            .filter((entry) => entry.metadata.reputation.score >= minScore)
            .sort((a, b) => b.metadata.reputation.score - a.metadata.reputation.score)
            .slice(0, limit);
        return agents;
    }
    /**
     * Update agent reputation
     */
    async updateReputation(did, score, successRate) {
        const entry = this.registry.get(did);
        if (!entry) {
            throw new Error(`Agent not found: ${did}`);
        }
        entry.metadata.reputation.score = score;
        entry.metadata.reputation.successRate = successRate;
        entry.metadata.reputation.reviews += 1;
        entry.metadata.updatedAt = Date.now();
        this.registry.set(did, entry);
    }
    /**
     * Get all registered agents
     */
    getAllAgents() {
        return Array.from(this.registry.values());
    }
    /**
     * Get registry statistics
     */
    getStatistics() {
        const agents = Array.from(this.registry.values());
        return {
            totalAgents: agents.length,
            averageReputation: agents.reduce((sum, a) => sum + a.metadata.reputation.score, 0) /
                agents.length || 0,
            capabilitiesCount: new Set(agents.flatMap((a) => a.metadata.capabilities)).size,
        };
    }
    // Private methods
    /**
     * Generate NFT token ID
     */
    generateNFTTokenId() {
        this.nftCounter++;
        return `agent-nft-${this.nftCounter}-${Date.now()}`;
    }
    /**
     * Mint registry NFT on-chain
     */
    async mintRegistryNFT(entry, secretKey) {
        // In production, this would invoke a Soroban NFT contract
        // For now, simulate with a transaction
        const metadata = JSON.stringify(entry.metadata);
        try {
            const txResult = await this.stellarClient.sendPayment(secretKey, entry.owner, 0.0000001, // Minimal amount
            'XLM', `register-agent:${entry.did}:${metadata.substring(0, 28)}`);
            return txResult;
        }
        catch (error) {
            return {
                success: false,
                hash: '',
                error: `Failed to mint NFT: ${error}`,
            };
        }
    }
    /**
     * Update registry on-chain
     */
    async updateOnChain(entry, secretKey) {
        // In production, this would invoke a Soroban contract
        const metadata = JSON.stringify(entry.metadata);
        try {
            const txResult = await this.stellarClient.sendPayment(secretKey, entry.owner, 0.0000001, 'XLM', `update-agent:${entry.did}:${metadata.substring(0, 28)}`);
            return txResult;
        }
        catch (error) {
            return {
                success: false,
                hash: '',
                error: `Failed to update on-chain: ${error}`,
            };
        }
    }
    /**
     * Burn registry NFT
     */
    async burnRegistryNFT(entry, secretKey) {
        // In production, this would invoke a Soroban contract
        try {
            const txResult = await this.stellarClient.sendPayment(secretKey, entry.owner, 0.0000001, 'XLM', `deregister-agent:${entry.did}`);
            return txResult;
        }
        catch (error) {
            return {
                success: false,
                hash: '',
                error: `Failed to burn NFT: ${error}`,
            };
        }
    }
    /**
     * Fetch entry from on-chain registry
     */
    async fetchFromChain(did) {
        // In production, query Soroban contract
        // For now, return null
        return null;
    }
    /**
     * Clear registry cache
     */
    clearCache() {
        this.registry.clear();
    }
}
//# sourceMappingURL=AgentRegistry.js.map