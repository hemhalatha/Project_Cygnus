/**
 * Agent Registry
 *
 * NFT-based registry for agent metadata and discovery.
 */
import { DID, AgentMetadata, AgentRegistryEntry, MasumiConfig } from './types.js';
import { StellarClient } from '../../src/stellar/StellarClient.js';
/**
 * Agent Registry for registering and discovering agents
 */
export declare class AgentRegistry {
    private config;
    private stellarClient;
    private registry;
    private nftCounter;
    constructor(config: MasumiConfig, stellarClient: StellarClient);
    /**
     * Register an agent in the registry
     */
    registerAgent(did: DID, metadata: AgentMetadata, ownerPublicKey: string, ownerSecretKey: string): Promise<AgentRegistryEntry>;
    /**
     * Lookup agent by DID
     */
    lookupAgent(did: DID): Promise<AgentRegistryEntry | null>;
    /**
     * Update agent metadata
     */
    updateAgent(did: DID, metadata: Partial<AgentMetadata>, ownerSecretKey: string): Promise<AgentRegistryEntry>;
    /**
     * Deregister agent
     */
    deregisterAgent(did: DID, ownerSecretKey: string): Promise<void>;
    /**
     * Search agents by capability
     */
    searchByCapability(capability: string): Promise<AgentRegistryEntry[]>;
    /**
     * Search agents by name
     */
    searchByName(name: string): Promise<AgentRegistryEntry[]>;
    /**
     * Get agents by reputation score
     */
    getTopAgents(minScore: number, limit?: number): Promise<AgentRegistryEntry[]>;
    /**
     * Update agent reputation
     */
    updateReputation(did: DID, score: number, successRate: number): Promise<void>;
    /**
     * Get all registered agents
     */
    getAllAgents(): AgentRegistryEntry[];
    /**
     * Get registry statistics
     */
    getStatistics(): {
        totalAgents: number;
        averageReputation: number;
        capabilitiesCount: number;
    };
    /**
     * Generate NFT token ID
     */
    private generateNFTTokenId;
    /**
     * Mint registry NFT on-chain
     */
    private mintRegistryNFT;
    /**
     * Update registry on-chain
     */
    private updateOnChain;
    /**
     * Burn registry NFT
     */
    private burnRegistryNFT;
    /**
     * Fetch entry from on-chain registry
     */
    private fetchFromChain;
    /**
     * Clear registry cache
     */
    clearCache(): void;
}
//# sourceMappingURL=AgentRegistry.d.ts.map