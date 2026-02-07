/**
 * x402 Client
 * 
 * HTTP client that handles x402 payment protocol.
 * Detects 402 responses, makes payments, and submits proofs.
 */

import {
  Response402,
  PaymentProof,
  PaymentResponse,
  X402ClientConfig,
  ResourceRequest,
  ResourceResponse,
} from './types.js';
import { StellarClient } from '../../src/stellar/StellarClient.js';
import { ChannelManager } from '../x402-flash/ChannelManager.js';

/**
 * x402 Client implementation
 */
export class X402Client {
  private config: X402ClientConfig;
  private stellarClient: StellarClient;
  private channelManager?: ChannelManager;
  private paymentCache: Map<string, PaymentProof> = new Map();
  private secretKey?: string;

  constructor(
    config: X402ClientConfig,
    stellarClient: StellarClient,
    channelManager?: ChannelManager
  ) {
    this.config = config;
    this.stellarClient = stellarClient;
    this.channelManager = channelManager;
    this.secretKey = config.secretKey;
  }

  /**
   * Make HTTP request with automatic 402 handling
   */
  async request(request: ResourceRequest): Promise<ResourceResponse> {
    // Make initial request
    const response = await this.makeHttpRequest(request);

    // Check if payment required
    if (response.statusCode === 402) {
      const response402 = response.body as Response402;
      
      // Evaluate payment decision
      const shouldPay = await this.evaluatePayment(response402);
      
      if (!shouldPay) {
        return {
          statusCode: 402,
          headers: response.headers,
          body: { error: 'Payment declined by client' },
        };
      }

      // Make payment
      const proof = await this.makePayment(response402);
      
      // Retry request with payment proof
      return await this.retryWithPayment(request, response402.requestId, proof);
    }

    return response;
  }

  /**
   * Evaluate whether to make payment
   */
  private async evaluatePayment(response402: Response402): Promise<boolean> {
    const { paymentDetails } = response402;
    const amount = parseFloat(paymentDetails.amount);

    // Check if payment is expired
    if (paymentDetails.expiresAt && paymentDetails.expiresAt < Date.now()) {
      return false;
    }

    // Check if we have a secret key
    if (!this.secretKey) {
      return false;
    }

    // Get public key from secret
    const StellarSdk = await import('@stellar/stellar-sdk');
    const keypair = StellarSdk.Keypair.fromSecret(this.secretKey);
    const publicKey = keypair.publicKey();

    // Check balance
    const balance = await this.stellarClient.getBalance(publicKey);
    if (balance < amount) {
      return false;
    }

    // Simple decision: pay if amount is reasonable
    // In production, this would use agent decision-making logic
    const maxPayment = 100; // XLM
    return amount <= maxPayment;
  }

  /**
   * Make payment for resource
   */
  private async makePayment(response402: Response402): Promise<PaymentProof> {
    const { paymentDetails } = response402;
    const amount = parseFloat(paymentDetails.amount);

    // Check if we should use payment channel
    if (this.config.preferChannels && paymentDetails.acceptsChannels) {
      return await this.makeChannelPayment(paymentDetails, response402.requestId);
    }

    // Make on-chain payment
    return await this.makeOnChainPayment(paymentDetails, response402.requestId);
  }

  /**
   * Make on-chain payment
   */
  private async makeOnChainPayment(
    paymentDetails: any,
    requestId: string
  ): Promise<PaymentProof> {
    if (!this.secretKey) {
      throw new Error('Secret key required for payment');
    }

    const amount = parseFloat(paymentDetails.amount);
    
    // Construct and send payment transaction
    const txResult = await this.stellarClient.sendPayment(
      this.secretKey,
      paymentDetails.recipient,
      amount,
      paymentDetails.asset || 'XLM',
      paymentDetails.memo
    );

    if (!txResult.success) {
      throw new Error(`Payment failed: ${txResult.error}`);
    }

    // Create payment proof
    const proof: PaymentProof = {
      type: 'on-chain',
      transactionHash: txResult.hash,
      timestamp: Date.now(),
      signature: await this.signProof(txResult.hash),
    };

    // Cache proof
    this.paymentCache.set(requestId, proof);

    return proof;
  }

  /**
   * Make channel payment
   */
  private async makeChannelPayment(
    paymentDetails: any,
    requestId: string
  ): Promise<PaymentProof> {
    if (!this.channelManager) {
      // Fall back to on-chain if no channel manager
      return await this.makeOnChainPayment(paymentDetails, requestId);
    }

    const amount = parseFloat(paymentDetails.amount);
    
    // Find or create channel with recipient
    let channelId = this.channelManager.findChannelWithCounterparty(
      paymentDetails.recipient
    );

    if (!channelId) {
      // Open new channel
      channelId = await this.channelManager.openChannel({
        counterparty: paymentDetails.recipient,
        initialDeposit: amount * 10, // Fund channel with 10x payment amount
        timeout: 3600, // 1 hour
      });
    }

    // Make payment through channel
    const signedState = await this.channelManager.makePayment(channelId, amount);

    // Create payment proof
    const proof: PaymentProof = {
      type: 'channel',
      channelState: signedState,
      timestamp: Date.now(),
      signature: await this.signProof(signedState.channelId),
    };

    // Cache proof
    this.paymentCache.set(requestId, proof);

    return proof;
  }

  /**
   * Retry request with payment proof
   */
  private async retryWithPayment(
    request: ResourceRequest,
    requestId: string,
    proof: PaymentProof
  ): Promise<ResourceResponse> {
    // Add payment proof to headers
    const headers = {
      ...request.headers,
      'x-payment-proof': JSON.stringify(proof),
      'x-request-id': requestId,
    };

    // Retry request
    const response = await this.makeHttpRequest({
      ...request,
      headers,
    });

    return response;
  }

  /**
   * Make HTTP request
   */
  private async makeHttpRequest(request: ResourceRequest): Promise<ResourceResponse> {
    try {
      const response = await fetch(request.url, {
        method: request.method,
        headers: request.headers,
        body: request.body ? JSON.stringify(request.body) : undefined,
      });

      const body = await response.json().catch(() => ({}));

      return {
        statusCode: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        body,
      };
    } catch (error) {
      throw new Error(`HTTP request failed: ${error}`);
    }
  }

  /**
   * Sign payment proof
   */
  private async signProof(data: string): Promise<string> {
    // In production, this would use proper cryptographic signing
    // For now, return a simple signature
    return `sig-${data}-${Date.now()}`;
  }

  /**
   * Get cached payment proof
   */
  getCachedProof(requestId: string): PaymentProof | undefined {
    return this.paymentCache.get(requestId);
  }

  /**
   * Clear payment cache
   */
  clearCache(): void {
    this.paymentCache.clear();
  }
}
