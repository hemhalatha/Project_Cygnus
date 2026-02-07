/**
 * x402 Server
 * 
 * HTTP server that implements the x402 payment protocol.
 * Returns 402 "Payment Required" for paid resources and verifies payments.
 */

import {
  PaymentDetails,
  Response402,
  PaymentProof,
  PaymentResponse,
  X402ServerConfig,
  VerificationResult,
} from './types.js';
import { StellarClient } from '../../src/stellar/StellarClient.js';

/**
 * x402 Server implementation
 */
export class X402Server {
  private config: X402ServerConfig;
  private stellarClient: StellarClient;
  private pendingPayments: Map<string, PaymentDetails> = new Map();
  private verifiedPayments: Set<string> = new Set();

  constructor(
    config: X402ServerConfig,
    stellarClient: StellarClient
  ) {
    this.config = config;
    this.stellarClient = stellarClient;
  }

  /**
   * Generate 402 response requiring payment
   */
  requirePayment(
    amount: number,
    recipient: string,
    asset: string = 'XLM',
    memo?: string
  ): Response402 {
    const requestId = this.generateRequestId();
    
    const paymentDetails: PaymentDetails = {
      amount: amount.toString(),
      asset,
      recipient,
      memo,
      acceptsChannels: this.config.acceptChannels,
      facilitatorUrl: this.config.facilitatorUrl,
      expiresAt: Date.now() + this.config.paymentTimeout,
    };

    // Store pending payment
    this.pendingPayments.set(requestId, paymentDetails);

    // Clean up expired payments
    this.cleanupExpiredPayments();

    return {
      statusCode: 402,
      message: 'Payment Required',
      paymentDetails,
      requestId,
    };
  }

  /**
   * Verify payment proof
   */
  async verifyPayment(
    requestId: string,
    proof: PaymentProof
  ): Promise<PaymentResponse> {
    // Get pending payment details
    const paymentDetails = this.pendingPayments.get(requestId);
    if (!paymentDetails) {
      return {
        verified: false,
        message: 'Payment request not found or expired',
      };
    }

    // Check if already verified
    if (this.verifiedPayments.has(requestId)) {
      return {
        verified: false,
        message: 'Payment already verified',
      };
    }

    // Verify based on proof type
    let verificationResult: VerificationResult;
    
    if (proof.type === 'on-chain') {
      verificationResult = await this.verifyOnChainPayment(
        proof,
        paymentDetails
      );
    } else if (proof.type === 'channel') {
      verificationResult = await this.verifyChannelPayment(
        proof,
        paymentDetails
      );
    } else {
      return {
        verified: false,
        message: 'Invalid payment proof type',
      };
    }

    if (verificationResult.verified) {
      // Mark as verified
      this.verifiedPayments.add(requestId);
      this.pendingPayments.delete(requestId);

      return {
        verified: true,
        transactionHash: proof.transactionHash,
        settlementProof: proof.signature,
        message: 'Payment verified successfully',
      };
    } else {
      return {
        verified: false,
        message: verificationResult.error || 'Payment verification failed',
      };
    }
  }

  /**
   * Check if payment is verified
   */
  isPaymentVerified(requestId: string): boolean {
    return this.verifiedPayments.has(requestId);
  }

  /**
   * Express middleware for payment requirement
   */
  middleware(amount: number, asset: string = 'XLM') {
    return async (req: any, res: any, next: any) => {
      // Check for payment proof in headers
      const paymentProof = req.headers['x-payment-proof'];
      const requestId = req.headers['x-request-id'];

      if (!paymentProof || !requestId) {
        // No payment proof, require payment
        const recipient = await this.stellarClient.getNetworkInfo();
        const response402 = this.requirePayment(
          amount,
          recipient.network, // In production, use actual recipient address
          asset
        );

        res.status(402).json(response402);
        return;
      }

      // Verify payment
      try {
        const proof: PaymentProof = JSON.parse(paymentProof);
        const verification = await this.verifyPayment(requestId, proof);

        if (verification.verified) {
          // Payment verified, proceed
          next();
        } else {
          res.status(402).json({
            statusCode: 402,
            message: verification.message,
          });
        }
      } catch (error) {
        res.status(400).json({
          statusCode: 400,
          message: 'Invalid payment proof format',
        });
      }
    };
  }

  /**
   * Get pending payment details
   */
  getPendingPayment(requestId: string): PaymentDetails | undefined {
    return this.pendingPayments.get(requestId);
  }

  /**
   * Clear verified payment
   */
  clearVerifiedPayment(requestId: string): void {
    this.verifiedPayments.delete(requestId);
  }

  // Private methods

  /**
   * Verify on-chain payment
   */
  private async verifyOnChainPayment(
    proof: PaymentProof,
    paymentDetails: PaymentDetails
  ): Promise<VerificationResult> {
    if (!proof.transactionHash) {
      return {
        verified: false,
        amount: 0,
        sender: '',
        timestamp: 0,
        error: 'Transaction hash required for on-chain payment',
      };
    }

    try {
      // Get transaction from Stellar
      const txResult = await this.stellarClient.getTransactionStatus(
        proof.transactionHash
      );

      if (!txResult.success) {
        return {
          verified: false,
          amount: 0,
          sender: '',
          timestamp: 0,
          error: 'Transaction not found or failed',
        };
      }

      // Verify amount and recipient
      // This is simplified - in production would parse transaction operations
      const expectedAmount = parseFloat(paymentDetails.amount);
      
      return {
        verified: true,
        amount: expectedAmount,
        sender: 'verified', // Would extract from transaction
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        verified: false,
        amount: 0,
        sender: '',
        timestamp: 0,
        error: `Verification error: ${error}`,
      };
    }
  }

  /**
   * Verify channel payment
   */
  private async verifyChannelPayment(
    proof: PaymentProof,
    paymentDetails: PaymentDetails
  ): Promise<VerificationResult> {
    if (!this.config.acceptChannels) {
      return {
        verified: false,
        amount: 0,
        sender: '',
        timestamp: 0,
        error: 'Channel payments not accepted',
      };
    }

    if (!proof.channelState) {
      return {
        verified: false,
        amount: 0,
        sender: '',
        timestamp: 0,
        error: 'Channel state required for channel payment',
      };
    }

    // Verify channel state signatures
    // This is simplified - in production would verify cryptographic signatures
    const channelState = proof.channelState;
    
    if (!channelState.signatures || channelState.signatures.length !== 2) {
      return {
        verified: false,
        amount: 0,
        sender: '',
        timestamp: 0,
        error: 'Invalid channel state signatures',
      };
    }

    // Verify amount
    const expectedAmount = parseFloat(paymentDetails.amount);
    const totalBalance = channelState.balances[0] + channelState.balances[1];
    
    if (totalBalance < expectedAmount) {
      return {
        verified: false,
        amount: 0,
        sender: '',
        timestamp: 0,
        error: 'Insufficient channel balance',
      };
    }

    return {
      verified: true,
      amount: expectedAmount,
      sender: channelState.participants[0],
      timestamp: Date.now(),
    };
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clean up expired payments
   */
  private cleanupExpiredPayments(): void {
    const now = Date.now();
    
    for (const [requestId, details] of this.pendingPayments.entries()) {
      if (details.expiresAt && details.expiresAt < now) {
        this.pendingPayments.delete(requestId);
      }
    }
  }
}
