/**
 * Trading Manager
 *
 * Handles autonomous trading with escrow protection.
 */
import { CharacterConfig, TxResult } from '../runtime/types.js';
import { DID } from '../../protocols/masumi/types.js';
import { SokosumiCoordinator, NegotiationSession } from '../../protocols/sokosumi/index.js';
import { StellarClient } from '../../src/stellar/StellarClient.js';
/**
 * Trade details
 */
export interface TradeDetails {
    item: string;
    quantity: number;
    price: number;
    deliveryTerms: string;
    deliveryDeadline: number;
}
/**
 * Escrow contract
 */
export interface EscrowContract {
    contractId: string;
    buyer: DID;
    seller: DID;
    amount: number;
    asset: string;
    tradeDetails: TradeDetails;
    status: 'funded' | 'delivered' | 'completed' | 'disputed' | 'refunded';
    createdAt: number;
}
/**
 * Trading Manager for autonomous trading
 */
export declare class TradingManager {
    private character;
    private coordinator;
    private stellarClient;
    private myDID;
    private secretKey;
    private activeEscrows;
    constructor(character: CharacterConfig, coordinator: SokosumiCoordinator, stellarClient: StellarClient, myDID: DID, secretKey: string);
    /**
     * Search for sellers
     */
    searchSellers(item: string): Promise<DID[]>;
    /**
     * Search for buyers
     */
    searchBuyers(item: string): Promise<DID[]>;
    /**
     * Initiate buy trade
     */
    initiateBuy(sellerDID: DID, tradeDetails: TradeDetails): Promise<EscrowContract | null>;
    /**
     * Initiate sell trade
     */
    initiateSell(buyerDID: DID, tradeDetails: TradeDetails): Promise<EscrowContract | null>;
    /**
     * Negotiate price
     */
    negotiatePrice(session: NegotiationSession, counterPrice: number): Promise<void>;
    /**
     * Create escrow contract
     */
    private createEscrow;
    /**
     * Confirm delivery (buyer)
     */
    confirmDelivery(contractId: string): Promise<TxResult>;
    /**
     * Dispute delivery (buyer)
     */
    disputeDelivery(contractId: string, reason: string): Promise<TxResult>;
    /**
     * Request refund (buyer)
     */
    requestRefund(contractId: string): Promise<TxResult>;
    /**
     * Check for expired escrows
     */
    checkExpiredEscrows(): Promise<string[]>;
    /**
     * Deploy escrow contract
     */
    private deployEscrowContract;
    /**
     * Fund escrow
     */
    private fundEscrow;
    /**
     * Get active escrows
     */
    getActiveEscrows(): EscrowContract[];
    /**
     * Get escrow by ID
     */
    getEscrow(contractId: string): EscrowContract | undefined;
}
//# sourceMappingURL=TradingManager.d.ts.map