/**
 * Agent Registry
 * 
 * NFT-based registry for agent metadata and discovery.
 */

import {
  DID,
  AgentMetadata,
  AgentRegistryEntry,
  MasumiConfig,
} from './types.js';
import { StellarClient } from '../../src/stellar/StellarClient.js';
import { TxResult } from '../../agents/runtime/types.js';

/**
 * Agent Registry for registering and discovering agents
 */
export class AgentRegistry {
  private config: MasumiConfig;
  private stellarClient: StellarClient;
  private registry: Map<DID, AgentRegistryEntry> = new Map();
  private nftCounter: number = 0;

  constructor(config: MasumiConfig, stellarClient: StellarClient) {
    this.config = config;
    this.stellarClient = stellarClient;
  }

  /**
   * Register an agent in the registry
   */
  async registerAgent(
    did: DID,
    metadata: AgentMetadata,
    ownerPublicKey: string,
    ownerSecretKey: string
  ): Promise<AgentRegistryEntry> {
    // Check if already registered
    if (this.registry.has(did)) {
      throw new Error(`Agent already registered: ${did}`);
    }

    // Generate NFT token ID
    const nftTokenId = this.generateNFTTokenId();

    // Create registry entry
    const entry: AgentRegistryEntry = {
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
  async lookupAgent(did: DID): Promise<AgentRegistryEntry | null> {
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
  async updateAgent(
    did: DID,
    metadata: Partial<AgentMetadata>,
    ownerSecretKey: string
  ): Promise<AgentRegistryEntry> {
    const entry = this.registry.get(did);
    if (!entry) {
      throw new Error(`Agent not found: ${did}`);
    }

    // Update metadata
    const updatedMetadata: AgentMetadata = {
      ...entry.metadata,
      ...metadata,
      updatedAt: Date.now(),
    };

    const updatedEntry: AgentRegistryEntry = {
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
  async deregisterAgent(did: DID, ownerSecretKey: string): Promise<void> {
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
  async searchByCapability(capability: string): Promise<AgentRegistryEntry[]> {
    const results: AgentRegistryEntry[] = [];

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
  async searchByName(name: string): Promise<AgentRegistryEntry[]> {
    const results: AgentRegistryEntry[] = [];
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
  async getTopAgents(minScore: number, limit: number = 10): Promise<AgentRegistryEntry[]> {
    const agents = Array.from(this.registry.values())
      .filter((entry) => entry.metadata.reputation.score >= minScore)
      .sort((a, b) => b.metadata.reputation.score - a.metadata.reputation.score)
      .slice(0, limit);

    return agents;
  }

  /**
   * Update agent reputation
   */
  async updateReputation(
    did: DID,
    score: number,
    successRate: number
  ): Promise<void> {
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
  getAllAgents(): AgentRegistryEntry[] {
    return Array.from(this.registry.values());
  }

  /**
   * Get registry statistics
   */
  getStatistics() {
    const agents = Array.from(this.registry.values());
    
    return {
      totalAgents: agents.length,
      averageReputation:
        agents.reduce((sum, a) => sum + a.metadata.reputation.score, 0) /
        agents.length || 0,
      capabilitiesCount: new Set(
        agents.flatMap((a) => a.metadata.capabilities)
      ).size,
    };
  }

  // Private methods

  /**
   * Generate NFT token ID
   */
  private generateNFTTokenId(): string {
    this.nftCounter++;
    return `agent-nft-${this.nftCounter}-${Date.now()}`;
  }

  /**
   * Mint registry NFT on-chain
   */
  private async mintRegistryNFT(
    entry: AgentRegistryEntry,
    secretKey: string
  ): Promise<TxResult> {
    // In production, this would invoke a Soroban NFT contract
    // For now, simulate with a transaction
    const metadata = JSON.stringify(entry.metadata);
    
    try {
      const txResult = await this.stellarClient.sendPayment(
        secretKey,
        entry.owner,
        0.0000001, // Minimal amount
        'XLM',
        `register-agent:${entry.did}:${metadata.substring(0, 28)}`
      );

      return txResult;
    } catch (error) {
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
  private async updateOnChain(
    entry: AgentRegistryEntry,
    secretKey: string
  ): Promise<TxResult> {
    // In production, this would invoke a Soroban contract
    const metadata = JSON.stringify(entry.metadata);
    
    try {
      const txResult = await this.stellarClient.sendPayment(
        secretKey,
        entry.owner,
        0.0000001,
        'XLM',
        `update-agent:${entry.did}:${metadata.substring(0, 28)}`
      );

      return txResult;
    } catch (error) {
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
  private async burnRegistryNFT(
    entry: AgentRegistryEntry,
    secretKey: string
  ): Promise<TxResult> {
    // In production, this would invoke a Soroban contract
    try {
      const txResult = await this.stellarClient.sendPayment(
        secretKey,
        entry.owner,
        0.0000001,
        'XLM',
        `deregister-agent:${entry.did}`
      );

      return txResult;
    } catch (error) {
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
  private async fetchFromChain(did: DID): Promise<AgentRegistryEntry | null> {
    // In production, query Soroban contract
    // For now, return null
    return null;
  }

  /**
   * Clear registry cache
   */
  clearCache(): void {
    this.registry.clear();
  }
}
