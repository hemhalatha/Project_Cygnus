/**
 * Trading Manager
 *
 * Handles autonomous trading with escrow protection.
 */
/**
 * Trading Manager for autonomous trading
 */
export class TradingManager {
    character;
    coordinator;
    stellarClient;
    myDID;
    secretKey;
    activeEscrows = new Map();
    constructor(character, coordinator, stellarClient, myDID, secretKey) {
        this.character = character;
        this.coordinator = coordinator;
        this.stellarClient = stellarClient;
        this.myDID = myDID;
        this.secretKey = secretKey;
    }
    /**
     * Search for sellers
     */
    async searchSellers(item) {
        const query = {
            serviceType: 'trading',
            capabilities: ['selling', item],
            minReputation: 600,
        };
        const services = await this.coordinator.discoverServices(query);
        return services.map((s) => s.agentDID);
    }
    /**
     * Search for buyers
     */
    async searchBuyers(item) {
        const query = {
            serviceType: 'trading',
            capabilities: ['buying', item],
            minReputation: 600,
        };
        const services = await this.coordinator.discoverServices(query);
        return services.map((s) => s.agentDID);
    }
    /**
     * Initiate buy trade
     */
    async initiateBuy(sellerDID, tradeDetails) {
        try {
            // Initiate negotiation
            const session = await this.coordinator.initiateNegotiation([this.myDID, sellerDID], `Trade: ${tradeDetails.item}`, this.myDID);
            // Propose terms
            const proposedTerms = {
                proposer: this.myDID,
                price: tradeDetails.price,
                deliverables: [tradeDetails.item],
                metadata: {
                    type: 'trade',
                    role: 'buyer',
                    quantity: tradeDetails.quantity,
                    deliveryTerms: tradeDetails.deliveryTerms,
                    deliveryDeadline: tradeDetails.deliveryDeadline,
                },
            };
            await this.coordinator.proposeTerms(session.sessionId, this.myDID, proposedTerms);
            // Wait for seller acceptance (in production, event-driven)
            // For now, simulate acceptance and create escrow
            const escrowContract = await this.createEscrow(this.myDID, sellerDID, tradeDetails);
            return escrowContract;
        }
        catch (error) {
            console.error('Buy trade failed:', error);
            return null;
        }
    }
    /**
     * Initiate sell trade
     */
    async initiateSell(buyerDID, tradeDetails) {
        try {
            // Initiate negotiation
            const session = await this.coordinator.initiateNegotiation([this.myDID, buyerDID], `Trade: ${tradeDetails.item}`, this.myDID);
            // Propose terms
            const proposedTerms = {
                proposer: this.myDID,
                price: tradeDetails.price,
                deliverables: [tradeDetails.item],
                metadata: {
                    type: 'trade',
                    role: 'seller',
                    quantity: tradeDetails.quantity,
                    deliveryTerms: tradeDetails.deliveryTerms,
                    deliveryDeadline: tradeDetails.deliveryDeadline,
                },
            };
            await this.coordinator.proposeTerms(session.sessionId, this.myDID, proposedTerms);
            // Wait for buyer to create escrow
            // In production, this would be event-driven
            return null;
        }
        catch (error) {
            console.error('Sell trade failed:', error);
            return null;
        }
    }
    /**
     * Negotiate price
     */
    async negotiatePrice(session, counterPrice) {
        const currentProposal = session.currentProposal;
        if (!currentProposal) {
            throw new Error('No proposal to counter');
        }
        // Counter-propose with new price
        const counterTerms = {
            ...currentProposal,
            proposer: this.myDID,
            price: counterPrice,
        };
        await this.coordinator.counterPropose(session.sessionId, this.myDID, counterTerms);
    }
    /**
     * Create escrow contract
     */
    async createEscrow(buyer, seller, tradeDetails) {
        // Deploy escrow contract
        const contractId = await this.deployEscrowContract(buyer, seller, tradeDetails.price * tradeDetails.quantity);
        // Fund escrow (buyer locks payment)
        if (buyer === this.myDID) {
            await this.fundEscrow(contractId, tradeDetails.price * tradeDetails.quantity);
        }
        const escrow = {
            contractId,
            buyer,
            seller,
            amount: tradeDetails.price * tradeDetails.quantity,
            asset: 'XLM',
            tradeDetails,
            status: 'funded',
            createdAt: Date.now(),
        };
        this.activeEscrows.set(contractId, escrow);
        return escrow;
    }
    /**
     * Confirm delivery (buyer)
     */
    async confirmDelivery(contractId) {
        const escrow = this.activeEscrows.get(contractId);
        if (!escrow) {
            return {
                success: false,
                hash: '',
                error: 'Escrow not found',
            };
        }
        if (escrow.buyer !== this.myDID) {
            return {
                success: false,
                hash: '',
                error: 'Only buyer can confirm delivery',
            };
        }
        // In production, invoke Soroban escrow contract
        // For now, simulate with payment to seller
        const txResult = await this.stellarClient.sendPayment(this.secretKey, escrow.seller, escrow.amount, escrow.asset, `escrow-release:${contractId}`);
        if (txResult.success) {
            escrow.status = 'completed';
            this.activeEscrows.set(contractId, escrow);
            // Update reputation
            await this.coordinator.recordSuccess(escrow.seller, 1000);
        }
        return txResult;
    }
    /**
     * Dispute delivery (buyer)
     */
    async disputeDelivery(contractId, reason) {
        const escrow = this.activeEscrows.get(contractId);
        if (!escrow) {
            return {
                success: false,
                hash: '',
                error: 'Escrow not found',
            };
        }
        if (escrow.buyer !== this.myDID) {
            return {
                success: false,
                hash: '',
                error: 'Only buyer can dispute',
            };
        }
        // In production, invoke Soroban escrow contract dispute function
        const txResult = await this.stellarClient.sendPayment(this.secretKey, escrow.buyer, 0.0000001, 'XLM', `escrow-dispute:${contractId}:${reason.substring(0, 20)}`);
        if (txResult.success) {
            escrow.status = 'disputed';
            this.activeEscrows.set(contractId, escrow);
            // Record dispute
            await this.coordinator.recordDispute(escrow.seller);
        }
        return txResult;
    }
    /**
     * Request refund (buyer)
     */
    async requestRefund(contractId) {
        const escrow = this.activeEscrows.get(contractId);
        if (!escrow) {
            return {
                success: false,
                hash: '',
                error: 'Escrow not found',
            };
        }
        // Check if delivery deadline passed
        if (Date.now() < escrow.tradeDetails.deliveryDeadline) {
            return {
                success: false,
                hash: '',
                error: 'Delivery deadline not yet passed',
            };
        }
        // In production, invoke Soroban escrow contract refund function
        const txResult = await this.stellarClient.sendPayment(this.secretKey, escrow.buyer, escrow.amount, escrow.asset, `escrow-refund:${contractId}`);
        if (txResult.success) {
            escrow.status = 'refunded';
            this.activeEscrows.set(contractId, escrow);
            // Record failure for seller
            await this.coordinator.recordFailure(escrow.seller);
        }
        return txResult;
    }
    /**
     * Check for expired escrows
     */
    async checkExpiredEscrows() {
        const now = Date.now();
        const expired = [];
        for (const [contractId, escrow] of this.activeEscrows.entries()) {
            if (escrow.status === 'funded' &&
                now > escrow.tradeDetails.deliveryDeadline) {
                expired.push(contractId);
            }
        }
        return expired;
    }
    /**
     * Deploy escrow contract
     */
    async deployEscrowContract(buyer, seller, amount) {
        // In production, deploy Soroban escrow contract
        return `escrow-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }
    /**
     * Fund escrow
     */
    async fundEscrow(contractId, amount) {
        // In production, send funds to escrow contract
        return await this.stellarClient.sendPayment(this.secretKey, contractId, // In production, this would be contract address
        amount, 'XLM', `escrow-fund:${contractId}`);
    }
    /**
     * Get active escrows
     */
    getActiveEscrows() {
        return Array.from(this.activeEscrows.values()).filter((e) => e.status === 'funded' || e.status === 'delivered');
    }
    /**
     * Get escrow by ID
     */
    getEscrow(contractId) {
        return this.activeEscrows.get(contractId);
    }
}
//# sourceMappingURL=TradingManager.js.map