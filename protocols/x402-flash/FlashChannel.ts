/**
 * FlashChannel
 * 
 * Payment channel implementation for sub-100ms micropayments.
 * Manages channel state, off-chain payments, and dispute resolution.
 */

import {
  ChannelId,
  ChannelState,
  SignedChannelState,
  ChannelBalance,
  ChannelOpenParams,
  ChannelPayment,
  ChannelClosureResult,
  ChannelDispute,
  ChannelConfig,
} from './types.js';
import { StellarClient } from '../../src/stellar/StellarClient.js';
import { TxResult } from '../../agents/runtime/types.js';

/**
 * FlashChannel SDK for payment channels
 */
export class FlashChannel {
  private config: ChannelConfig;
  private stellarClient: StellarClient;
  private channels: Map<ChannelId, ChannelState> = new Map();
  private myAddress: string;
  private secretKey: string;

  constructor(
    config: ChannelConfig,
    stellarClient: StellarClient,
    myAddress: string,
    secretKey: string
  ) {
    this.config = config;
    this.stellarClient = stellarClient;
    this.myAddress = myAddress;
    this.secretKey = secretKey;
  }

  /**
   * Open a new payment channel
   */
  async open(params: ChannelOpenParams): Promise<ChannelId> {
    // Validate parameters
    if (params.initialDeposit < this.config.minChannelCapacity) {
      throw new Error(`Initial deposit below minimum: ${this.config.minChannelCapacity}`);
    }

    if (params.initialDeposit > this.config.maxChannelCapacity) {
      throw new Error(`Initial deposit exceeds maximum: ${this.config.maxChannelCapacity}`);
    }

    // Generate channel ID
    const channelId = this.generateChannelId(this.myAddress, params.counterparty);

    // Create initial channel state
    const initialState: ChannelState = {
      channelId,
      participants: [this.myAddress, params.counterparty],
      balances: [params.initialDeposit, 0],
      nonce: 0,
      timeout: Date.now() + (params.timeout * 1000),
      status: 'opening',
    };

    // Create on-chain opening transaction
    const txResult = await this.createChannelOnChain(initialState);

    if (!txResult.success) {
      throw new Error(`Failed to open channel: ${txResult.error}`);
    }

    // Update state to open
    initialState.status = 'open';
    this.channels.set(channelId, initialState);

    return channelId;
  }

  /**
   * Make off-chain payment through channel
   */
  async pay(channelId: ChannelId, amount: number): Promise<SignedChannelState> {
    const channel = this.channels.get(channelId);
    
    if (!channel) {
      throw new Error(`Channel not found: ${channelId}`);
    }

    if (channel.status !== 'open') {
      throw new Error(`Channel not open: ${channel.status}`);
    }

    // Check balance
    const myIndex = this.getMyIndex(channel);
    if (channel.balances[myIndex] < amount) {
      throw new Error(`Insufficient balance: ${channel.balances[myIndex]} < ${amount}`);
    }

    // Create new state
    const newBalances: [number, number] = [...channel.balances] as [number, number];
    const theirIndex = myIndex === 0 ? 1 : 0;
    newBalances[myIndex] -= amount;
    newBalances[theirIndex] += amount;

    const newState: ChannelState = {
      ...channel,
      balances: newBalances,
      nonce: channel.nonce + 1,
    };

    // Sign new state
    const signedState = await this.signState(newState);

    // Update local state (will be finalized when counterparty signs)
    this.channels.set(channelId, newState);

    return signedState;
  }

  /**
   * Receive payment from counterparty
   */
  async receive(channelId: ChannelId, signedState: SignedChannelState): Promise<void> {
    const channel = this.channels.get(channelId);
    
    if (!channel) {
      throw new Error(`Channel not found: ${channelId}`);
    }

    // Verify signatures
    const valid = await this.verifySignatures(signedState);
    if (!valid) {
      throw new Error('Invalid signatures on channel state');
    }

    // Verify nonce is incrementing
    if (signedState.nonce <= channel.nonce) {
      throw new Error(`Invalid nonce: ${signedState.nonce} <= ${channel.nonce}`);
    }

    // Verify balances are conserved
    const totalOld = channel.balances[0] + channel.balances[1];
    const totalNew = signedState.balances[0] + signedState.balances[1];
    if (totalOld !== totalNew) {
      throw new Error('Balance conservation violated');
    }

    // Update state
    this.channels.set(channelId, signedState);
  }

  /**
   * Close payment channel
   */
  async close(channelId: ChannelId): Promise<ChannelClosureResult> {
    const channel = this.channels.get(channelId);
    
    if (!channel) {
      throw new Error(`Channel not found: ${channelId}`);
    }

    if (channel.status === 'closed') {
      throw new Error('Channel already closed');
    }

    // Update status
    channel.status = 'closing';
    this.channels.set(channelId, channel);

    // Sign final state
    const finalState = await this.signState(channel);

    // Settle on-chain
    const txResult = await this.settleChannelOnChain(finalState);

    if (!txResult.success) {
      throw new Error(`Failed to close channel: ${txResult.error}`);
    }

    // Update status
    channel.status = 'closed';
    this.channels.set(channelId, channel);

    return {
      success: true,
      finalState,
      settlementTxHash: txResult.hash,
    };
  }

  /**
   * Dispute channel with latest state
   */
  async dispute(
    channelId: ChannelId,
    latestState: SignedChannelState
  ): Promise<TxResult> {
    const channel = this.channels.get(channelId);
    
    if (!channel) {
      throw new Error(`Channel not found: ${channelId}`);
    }

    // Verify signatures
    const valid = await this.verifySignatures(latestState);
    if (!valid) {
      throw new Error('Invalid signatures on disputed state');
    }

    // Submit dispute on-chain
    const txResult = await this.submitDisputeOnChain(latestState);

    if (txResult.success) {
      channel.status = 'disputed';
      this.channels.set(channelId, channel);
    }

    return txResult;
  }

  /**
   * Get channel balance
   */
  async getBalance(channelId: ChannelId): Promise<ChannelBalance> {
    const channel = this.channels.get(channelId);
    
    if (!channel) {
      throw new Error(`Channel not found: ${channelId}`);
    }

    const myIndex = this.getMyIndex(channel);
    const theirIndex = myIndex === 0 ? 1 : 0;

    return {
      myBalance: channel.balances[myIndex],
      theirBalance: channel.balances[theirIndex],
      totalCapacity: channel.balances[0] + channel.balances[1],
    };
  }

  /**
   * Get channel state
   */
  async getState(channelId: ChannelId): Promise<ChannelState> {
    const channel = this.channels.get(channelId);
    
    if (!channel) {
      throw new Error(`Channel not found: ${channelId}`);
    }

    return { ...channel };
  }

  /**
   * Get all active channels
   */
  getActiveChannels(): ChannelId[] {
    return Array.from(this.channels.entries())
      .filter(([_, channel]) => channel.status === 'open')
      .map(([id, _]) => id);
  }

  // Private methods

  /**
   * Generate channel ID
   */
  private generateChannelId(address1: string, address2: string): ChannelId {
    const sorted = [address1, address2].sort();
    const timestamp = Date.now();
    return `channel-${sorted[0]}-${sorted[1]}-${timestamp}`;
  }

  /**
   * Get my index in participants array
   */
  private getMyIndex(channel: ChannelState): number {
    return channel.participants[0] === this.myAddress ? 0 : 1;
  }

  /**
   * Sign channel state
   */
  private async signState(state: ChannelState): Promise<SignedChannelState> {
    // In production, this would use proper cryptographic signing
    const stateHash = this.hashState(state);
    const mySignature = await this.sign(stateHash);
    
    const myIndex = this.getMyIndex(state);
    const signatures: [string, string] = ['', ''];
    signatures[myIndex] = mySignature;

    return {
      ...state,
      signatures,
    };
  }

  /**
   * Verify signatures on channel state
   */
  private async verifySignatures(signedState: SignedChannelState): Promise<boolean> {
    // In production, this would verify cryptographic signatures
    // For now, just check that signatures exist
    return (
      signedState.signatures[0].length > 0 &&
      signedState.signatures[1].length > 0
    );
  }

  /**
   * Hash channel state
   */
  private hashState(state: ChannelState): string {
    const data = JSON.stringify({
      channelId: state.channelId,
      balances: state.balances,
      nonce: state.nonce,
    });
    
    // In production, use proper cryptographic hash
    return `hash-${data}`;
  }

  /**
   * Sign data
   */
  private async sign(data: string): Promise<string> {
    // In production, use proper cryptographic signing
    return `sig-${this.myAddress}-${data}`;
  }

  /**
   * Create channel on-chain
   */
  private async createChannelOnChain(state: ChannelState): Promise<TxResult> {
    // In production, this would invoke a Soroban contract
    // For now, simulate with a payment transaction
    const txResult = await this.stellarClient.sendPayment(
      this.secretKey,
      state.participants[1],
      state.balances[0],
      'XLM',
      `channel-open:${state.channelId}`
    );

    return txResult;
  }

  /**
   * Settle channel on-chain
   */
  private async settleChannelOnChain(
    finalState: SignedChannelState
  ): Promise<TxResult> {
    // In production, this would invoke a Soroban contract
    // For now, simulate with payment transactions
    const myIndex = this.getMyIndex(finalState);
    const theirIndex = myIndex === 0 ? 1 : 0;

    // Send final balances
    const txResult = await this.stellarClient.sendPayment(
      this.secretKey,
      finalState.participants[theirIndex],
      finalState.balances[theirIndex],
      'XLM',
      `channel-close:${finalState.channelId}`
    );

    return txResult;
  }

  /**
   * Submit dispute on-chain
   */
  private async submitDisputeOnChain(
    disputedState: SignedChannelState
  ): Promise<TxResult> {
    // In production, this would invoke a Soroban contract
    // For now, simulate with a transaction
    const txResult = await this.stellarClient.sendPayment(
      this.secretKey,
      disputedState.participants[0],
      0.0000001, // Minimal amount
      'XLM',
      `channel-dispute:${disputedState.channelId}`
    );

    return txResult;
  }
}
