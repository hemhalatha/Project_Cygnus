/**
 * FlashChannel
 *
 * Payment channel implementation for sub-100ms micropayments.
 * Manages channel state, off-chain payments, and dispute resolution.
 */
import { ChannelId, ChannelState, SignedChannelState, ChannelBalance, ChannelOpenParams, ChannelClosureResult, ChannelConfig } from './types.js';
import { StellarClient } from '../../src/stellar/StellarClient.js';
import { TxResult } from '../../agents/runtime/types.js';
/**
 * FlashChannel SDK for payment channels
 */
export declare class FlashChannel {
    private config;
    private stellarClient;
    private channels;
    private myAddress;
    private secretKey;
    constructor(config: ChannelConfig, stellarClient: StellarClient, myAddress: string, secretKey: string);
    /**
     * Open a new payment channel
     */
    open(params: ChannelOpenParams): Promise<ChannelId>;
    /**
     * Make off-chain payment through channel
     */
    pay(channelId: ChannelId, amount: number): Promise<SignedChannelState>;
    /**
     * Receive payment from counterparty
     */
    receive(channelId: ChannelId, signedState: SignedChannelState): Promise<void>;
    /**
     * Close payment channel
     */
    close(channelId: ChannelId): Promise<ChannelClosureResult>;
    /**
     * Dispute channel with latest state
     */
    dispute(channelId: ChannelId, latestState: SignedChannelState): Promise<TxResult>;
    /**
     * Get channel balance
     */
    getBalance(channelId: ChannelId): Promise<ChannelBalance>;
    /**
     * Get channel state
     */
    getState(channelId: ChannelId): Promise<ChannelState>;
    /**
     * Get all active channels
     */
    getActiveChannels(): ChannelId[];
    /**
     * Generate channel ID
     */
    private generateChannelId;
    /**
     * Get my index in participants array
     */
    private getMyIndex;
    /**
     * Sign channel state
     */
    private signState;
    /**
     * Verify signatures on channel state
     */
    private verifySignatures;
    /**
     * Hash channel state
     */
    private hashState;
    /**
     * Sign data
     */
    private sign;
    /**
     * Create channel on-chain
     */
    private createChannelOnChain;
    /**
     * Settle channel on-chain
     */
    private settleChannelOnChain;
    /**
     * Submit dispute on-chain
     */
    private submitDisputeOnChain;
}
//# sourceMappingURL=FlashChannel.d.ts.map