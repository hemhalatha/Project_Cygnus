/**
 * ChannelManager
 *
 * Manages multiple payment channels, tracks state, and handles lifecycle.
 */
import { ChannelId, ChannelState, SignedChannelState, ChannelOpenParams, ChannelConfig, ChannelEvent, ChannelManagerState } from './types.js';
import { StellarClient } from '../../src/stellar/StellarClient.js';
/**
 * Channel Manager for coordinating multiple channels
 */
export declare class ChannelManager {
    private config;
    private stellarClient;
    private myAddress;
    private secretKey;
    private flashChannel;
    private state;
    private eventListeners;
    constructor(config: ChannelConfig, stellarClient: StellarClient, myAddress: string, secretKey: string);
    /**
     * Open a new channel
     */
    openChannel(params: ChannelOpenParams): Promise<ChannelId>;
    /**
     * Make payment through channel
     */
    makePayment(channelId: ChannelId, amount: number): Promise<SignedChannelState>;
    /**
     * Receive payment from counterparty
     */
    receivePayment(channelId: ChannelId, signedState: SignedChannelState): Promise<void>;
    /**
     * Close channel
     */
    closeChannel(channelId: ChannelId): Promise<void>;
    /**
     * Dispute channel
     */
    disputeChannel(channelId: ChannelId, latestState: SignedChannelState): Promise<void>;
    /**
     * Get channel by ID
     */
    getChannel(channelId: ChannelId): ChannelState | undefined;
    /**
     * Find channel with counterparty
     */
    findChannelWithCounterparty(counterparty: string): ChannelId | undefined;
    /**
     * Get all active channels
     */
    getActiveChannels(): ChannelState[];
    /**
     * Get channel balance
     */
    getChannelBalance(channelId: ChannelId): Promise<import("./types.js").ChannelBalance>;
    /**
     * Get total balance across all channels
     */
    getTotalBalance(): number;
    /**
     * Clean up expired channels
     */
    cleanupExpiredChannels(): Promise<void>;
    /**
     * Add event listener
     */
    on(eventType: string, listener: (event: ChannelEvent) => void): void;
    /**
     * Remove event listener
     */
    off(eventType: string, listener: (event: ChannelEvent) => void): void;
    /**
     * Emit event
     */
    private emitEvent;
    /**
     * Get manager statistics
     */
    getStatistics(): {
        activeChannels: number;
        closingChannels: number;
        closedChannels: number;
        totalBalance: number;
    };
    /**
     * Export state for persistence
     */
    exportState(): ChannelManagerState;
    /**
     * Import state from persistence
     */
    importState(state: ChannelManagerState): void;
}
//# sourceMappingURL=ChannelManager.d.ts.map