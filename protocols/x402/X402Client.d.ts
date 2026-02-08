/**
 * x402 Client
 *
 * HTTP client that handles x402 payment protocol.
 * Detects 402 responses, makes payments, and submits proofs.
 */
import { PaymentProof, X402ClientConfig, ResourceRequest, ResourceResponse } from './types.js';
import { StellarClient } from '../../src/stellar/StellarClient.js';
import { ChannelManager } from '../x402-flash/ChannelManager.js';
/**
 * x402 Client implementation
 */
export declare class X402Client {
    private config;
    private stellarClient;
    private channelManager?;
    private paymentCache;
    private secretKey?;
    constructor(config: X402ClientConfig, stellarClient: StellarClient, channelManager?: ChannelManager);
    /**
     * Make HTTP request with automatic 402 handling
     */
    request(request: ResourceRequest): Promise<ResourceResponse>;
    /**
     * Evaluate whether to make payment
     */
    private evaluatePayment;
    /**
     * Make payment for resource
     */
    private makePayment;
    /**
     * Make on-chain payment
     */
    private makeOnChainPayment;
    /**
     * Make channel payment
     */
    private makeChannelPayment;
    /**
     * Retry request with payment proof
     */
    private retryWithPayment;
    /**
     * Make HTTP request
     */
    private makeHttpRequest;
    /**
     * Sign payment proof
     */
    private signProof;
    /**
     * Get cached payment proof
     */
    getCachedProof(requestId: string): PaymentProof | undefined;
    /**
     * Clear payment cache
     */
    clearCache(): void;
}
//# sourceMappingURL=X402Client.d.ts.map