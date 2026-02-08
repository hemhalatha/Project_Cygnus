/**
 * x402-Flash Payment Channel Types
 *
 * Off-chain payment channel types for sub-100ms micropayments.
 */
/**
 * Channel identifier
 */
export type ChannelId = string;
/**
 * Channel state
 */
export interface ChannelState {
    channelId: ChannelId;
    participants: [string, string];
    balances: [number, number];
    nonce: number;
    timeout: number;
    status: ChannelStatus;
}
/**
 * Channel status
 */
export type ChannelStatus = 'opening' | 'open' | 'closing' | 'closed' | 'disputed';
/**
 * Signed channel state
 */
export interface SignedChannelState extends ChannelState {
    signatures: [string, string];
}
/**
 * Channel balance
 */
export interface ChannelBalance {
    myBalance: number;
    theirBalance: number;
    totalCapacity: number;
}
/**
 * Channel opening parameters
 */
export interface ChannelOpenParams {
    counterparty: string;
    initialDeposit: number;
    timeout: number;
}
/**
 * Channel payment
 */
export interface ChannelPayment {
    channelId: ChannelId;
    amount: number;
    newState: SignedChannelState;
}
/**
 * Channel closure result
 */
export interface ChannelClosureResult {
    success: boolean;
    finalState: SignedChannelState;
    settlementTxHash: string;
}
/**
 * Channel dispute
 */
export interface ChannelDispute {
    channelId: ChannelId;
    disputedState: SignedChannelState;
    claimedState: SignedChannelState;
    reason: string;
}
/**
 * Channel configuration
 */
export interface ChannelConfig {
    stellarNetwork: 'testnet' | 'mainnet';
    defaultTimeout: number;
    maxChannelCapacity: number;
    minChannelCapacity: number;
}
/**
 * Channel event
 */
export interface ChannelEvent {
    type: 'opened' | 'payment' | 'closed' | 'disputed';
    channelId: ChannelId;
    timestamp: number;
    data: any;
}
/**
 * Channel manager state
 */
export interface ChannelManagerState {
    activeChannels: Map<ChannelId, ChannelState>;
    closingChannels: Map<ChannelId, ChannelState>;
    closedChannels: Map<ChannelId, ChannelState>;
}
//# sourceMappingURL=types.d.ts.map