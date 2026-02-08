/**
 * X402 Protocol Type Definitions
 * 
 * Types for the X402 payment proof protocol supporting both
 * on-chain and off-chain (channel) payment verification.
 */

/**
 * Payment proof for X402 protocol
 */
export interface PaymentProof {
  type: 'on-chain' | 'channel';
  timestamp: number;
  transactionHash?: string;
  channelState?: ChannelState;
}

/**
 * State channel information for off-chain payments
 */
export interface ChannelState {
  channelId: string;
  participants: string[];
  balances: number[];
  nonce: number;
  signatures: string[];
}

/**
 * X402 payment request
 */
export interface PaymentRequest {
  amount: number;
  asset: string;
  recipient: string;
  memo?: string;
  expiresAt?: number;
}

/**
 * X402 payment response
 */
export interface PaymentResponse {
  success: boolean;
  proof?: PaymentProof;
  error?: string;
}
