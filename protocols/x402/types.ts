/**
 * x402 Payment Protocol Types
 * 
 * HTTP 402 "Payment Required" protocol for machine-to-machine payments.
 */

/**
 * Payment details included in 402 response
 */
export interface PaymentDetails {
  amount: string;
  asset: string;
  recipient: string;
  memo?: string;
  acceptsChannels: boolean;
  facilitatorUrl?: string;
  expiresAt?: number;
}

/**
 * HTTP 402 response
 */
export interface Response402 {
  statusCode: 402;
  message: string;
  paymentDetails: PaymentDetails;
  requestId: string;
}

/**
 * Payment proof types
 */
export type PaymentProofType = 'on-chain' | 'channel';

/**
 * Payment proof submitted by client
 */
export interface PaymentProof {
  type: PaymentProofType;
  transactionHash?: string;
  channelState?: SignedChannelState;
  timestamp: number;
  signature: string;
}

/**
 * Signed channel state for off-chain payments
 */
export interface SignedChannelState {
  channelId: string;
  participants: [string, string];
  balances: [number, number];
  nonce: number;
  signatures: [string, string];
}

/**
 * Payment response after verification
 */
export interface PaymentResponse {
  verified: boolean;
  transactionHash?: string;
  settlementProof?: string;
  message: string;
}

/**
 * x402 server configuration
 */
export interface X402ServerConfig {
  facilitatorUrl?: string;
  acceptChannels: boolean;
  paymentTimeout: number; // milliseconds
  verificationRetries: number;
}

/**
 * x402 client configuration
 */
export interface X402ClientConfig {
  stellarNetwork: 'testnet' | 'mainnet';
  secretKey?: string;
  preferChannels: boolean;
  paymentTimeout: number;
}

/**
 * Resource request
 */
export interface ResourceRequest {
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: any;
}

/**
 * Resource response
 */
export interface ResourceResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: any;
}

/**
 * Payment verification result
 */
export interface VerificationResult {
  verified: boolean;
  amount: number;
  sender: string;
  timestamp: number;
  error?: string;
}
