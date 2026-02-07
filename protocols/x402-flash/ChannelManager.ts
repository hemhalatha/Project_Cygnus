/**
 * ChannelManager
 * 
 * Manages multiple payment channels, tracks state, and handles lifecycle.
 */

import {
  ChannelId,
  ChannelState,
  SignedChannelState,
  ChannelOpenParams,
  ChannelConfig,
  ChannelEvent,
  ChannelManagerState,
} from './types.js';
import { FlashChannel } from './FlashChannel.js';
import { StellarClient } from '../../src/stellar/StellarClient.js';

/**
 * Channel Manager for coordinating multiple channels
 */
export class ChannelManager {
  private config: ChannelConfig;
  private stellarClient: StellarClient;
  private myAddress: string;
  private secretKey: string;
  private flashChannel: FlashChannel;
  private state: ChannelManagerState;
  private eventListeners: Map<string, ((event: ChannelEvent) => void)[]> = new Map();

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
    this.flashChannel = new FlashChannel(config, stellarClient, myAddress, secretKey);
    
    this.state = {
      activeChannels: new Map(),
      closingChannels: new Map(),
      closedChannels: new Map(),
    };
  }

  /**
   * Open a new channel
   */
  async openChannel(params: ChannelOpenParams): Promise<ChannelId> {
    // Check if channel already exists with counterparty
    const existingChannel = this.findChannelWithCounterparty(params.counterparty);
    if (existingChannel) {
      throw new Error(`Channel already exists with ${params.counterparty}`);
    }

    // Open channel
    const channelId = await this.flashChannel.open(params);
    
    // Get channel state
    const state = await this.flashChannel.getState(channelId);
    this.state.activeChannels.set(channelId, state);

    // Emit event
    this.emitEvent({
      type: 'opened',
      channelId,
      timestamp: Date.now(),
      data: { params, state },
    });

    return channelId;
  }

  /**
   * Make payment through channel
   */
  async makePayment(
    channelId: ChannelId,
    amount: number
  ): Promise<SignedChannelState> {
    const channel = this.state.activeChannels.get(channelId);
    if (!channel) {
      throw new Error(`Channel not found or not active: ${channelId}`);
    }

    // Make payment
    const signedState = await this.flashChannel.pay(channelId, amount);

    // Update state
    const newState = await this.flashChannel.getState(channelId);
    this.state.activeChannels.set(channelId, newState);

    // Emit event
    this.emitEvent({
      type: 'payment',
      channelId,
      timestamp: Date.now(),
      data: { amount, signedState },
    });

    return signedState;
  }

  /**
   * Receive payment from counterparty
   */
  async receivePayment(
    channelId: ChannelId,
    signedState: SignedChannelState
  ): Promise<void> {
    const channel = this.state.activeChannels.get(channelId);
    if (!channel) {
      throw new Error(`Channel not found or not active: ${channelId}`);
    }

    // Receive payment
    await this.flashChannel.receive(channelId, signedState);

    // Update state
    const newState = await this.flashChannel.getState(channelId);
    this.state.activeChannels.set(channelId, newState);

    // Emit event
    this.emitEvent({
      type: 'payment',
      channelId,
      timestamp: Date.now(),
      data: { signedState },
    });
  }

  /**
   * Close channel
   */
  async closeChannel(channelId: ChannelId): Promise<void> {
    const channel = this.state.activeChannels.get(channelId);
    if (!channel) {
      throw new Error(`Channel not found or not active: ${channelId}`);
    }

    // Move to closing
    this.state.activeChannels.delete(channelId);
    this.state.closingChannels.set(channelId, channel);

    // Close channel
    const result = await this.flashChannel.close(channelId);

    // Move to closed
    this.state.closingChannels.delete(channelId);
    this.state.closedChannels.set(channelId, result.finalState);

    // Emit event
    this.emitEvent({
      type: 'closed',
      channelId,
      timestamp: Date.now(),
      data: { result },
    });
  }

  /**
   * Dispute channel
   */
  async disputeChannel(
    channelId: ChannelId,
    latestState: SignedChannelState
  ): Promise<void> {
    const channel = this.state.activeChannels.get(channelId);
    if (!channel) {
      throw new Error(`Channel not found or not active: ${channelId}`);
    }

    // Submit dispute
    const txResult = await this.flashChannel.dispute(channelId, latestState);

    if (!txResult.success) {
      throw new Error(`Dispute failed: ${txResult.error}`);
    }

    // Update state
    const newState = await this.flashChannel.getState(channelId);
    this.state.activeChannels.set(channelId, newState);

    // Emit event
    this.emitEvent({
      type: 'disputed',
      channelId,
      timestamp: Date.now(),
      data: { latestState, txResult },
    });
  }

  /**
   * Get channel by ID
   */
  getChannel(channelId: ChannelId): ChannelState | undefined {
    return (
      this.state.activeChannels.get(channelId) ||
      this.state.closingChannels.get(channelId) ||
      this.state.closedChannels.get(channelId)
    );
  }

  /**
   * Find channel with counterparty
   */
  findChannelWithCounterparty(counterparty: string): ChannelId | undefined {
    for (const [channelId, channel] of this.state.activeChannels.entries()) {
      if (channel.participants.includes(counterparty)) {
        return channelId;
      }
    }
    return undefined;
  }

  /**
   * Get all active channels
   */
  getActiveChannels(): ChannelState[] {
    return Array.from(this.state.activeChannels.values());
  }

  /**
   * Get channel balance
   */
  async getChannelBalance(channelId: ChannelId) {
    return await this.flashChannel.getBalance(channelId);
  }

  /**
   * Get total balance across all channels
   */
  getTotalBalance(): number {
    let total = 0;
    
    for (const channel of this.state.activeChannels.values()) {
      const myIndex = channel.participants[0] === this.myAddress ? 0 : 1;
      total += channel.balances[myIndex];
    }

    return total;
  }

  /**
   * Clean up expired channels
   */
  async cleanupExpiredChannels(): Promise<void> {
    const now = Date.now();
    const expiredChannels: ChannelId[] = [];

    for (const [channelId, channel] of this.state.activeChannels.entries()) {
      if (channel.timeout < now) {
        expiredChannels.push(channelId);
      }
    }

    // Close expired channels
    for (const channelId of expiredChannels) {
      try {
        await this.closeChannel(channelId);
      } catch (error) {
        console.error(`Failed to close expired channel ${channelId}:`, error);
      }
    }
  }

  /**
   * Add event listener
   */
  on(eventType: string, listener: (event: ChannelEvent) => void): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(listener);
  }

  /**
   * Remove event listener
   */
  off(eventType: string, listener: (event: ChannelEvent) => void): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit event
   */
  private emitEvent(event: ChannelEvent): void {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(event);
        } catch (error) {
          console.error(`Error in event listener for ${event.type}:`, error);
        }
      }
    }

    // Also emit to wildcard listeners
    const wildcardListeners = this.eventListeners.get('*');
    if (wildcardListeners) {
      for (const listener of wildcardListeners) {
        try {
          listener(event);
        } catch (error) {
          console.error(`Error in wildcard event listener:`, error);
        }
      }
    }
  }

  /**
   * Get manager statistics
   */
  getStatistics() {
    return {
      activeChannels: this.state.activeChannels.size,
      closingChannels: this.state.closingChannels.size,
      closedChannels: this.state.closedChannels.size,
      totalBalance: this.getTotalBalance(),
    };
  }

  /**
   * Export state for persistence
   */
  exportState(): ChannelManagerState {
    return {
      activeChannels: new Map(this.state.activeChannels),
      closingChannels: new Map(this.state.closingChannels),
      closedChannels: new Map(this.state.closedChannels),
    };
  }

  /**
   * Import state from persistence
   */
  importState(state: ChannelManagerState): void {
    this.state = {
      activeChannels: new Map(state.activeChannels),
      closingChannels: new Map(state.closingChannels),
      closedChannels: new Map(state.closedChannels),
    };
  }
}
