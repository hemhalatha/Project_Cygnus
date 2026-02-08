/**
 * Loan Negotiator
 *
 * Handles autonomous loan negotiation and management.
 */
/**
 * Loan Negotiator for autonomous lending/borrowing
 */
export class LoanNegotiator {
    character;
    coordinator;
    stellarClient;
    myDID;
    secretKey;
    activeLoans = new Map();
    constructor(character, coordinator, stellarClient, myDID, secretKey) {
        this.character = character;
        this.coordinator = coordinator;
        this.stellarClient = stellarClient;
        this.myDID = myDID;
        this.secretKey = secretKey;
    }
    /**
     * Search for lenders
     */
    async searchLenders(amount) {
        const query = {
            serviceType: 'lending',
            capabilities: ['loan-provision'],
            minReputation: this.character.lendingStrategy.minCreditScore,
        };
        const services = await this.coordinator.discoverServices(query);
        // Filter by amount capacity
        return services
            .filter((s) => !s.pricing.amount || s.pricing.amount <= amount * 0.1) // Max 10% interest
            .map((s) => s.agentDID);
    }
    /**
     * Negotiate loan as borrower
     */
    async negotiateLoan(lenderDID, desiredAmount, collateralAmount, collateralAsset = 'XLM') {
        try {
            // Initiate negotiation
            const session = await this.coordinator.initiateNegotiation([this.myDID, lenderDID], 'Loan Agreement', this.myDID);
            // Propose terms
            const proposedTerms = {
                proposer: this.myDID,
                price: desiredAmount,
                duration: this.character.lendingStrategy.preferredDuration,
                metadata: {
                    type: 'loan',
                    collateralAmount,
                    collateralAsset,
                    requestedRate: this.character.lendingStrategy.interestRateModel.baseRate,
                },
            };
            await this.coordinator.proposeTerms(session.sessionId, this.myDID, proposedTerms);
            // Wait for lender response (in production, this would be event-driven)
            // For now, simulate acceptance
            const loanTerms = {
                principal: desiredAmount,
                interestRate: this.character.lendingStrategy.interestRateModel.baseRate,
                duration: this.character.lendingStrategy.preferredDuration,
                collateralAmount,
                collateralAsset,
                repaymentFrequency: 'monthly',
            };
            // Deploy loan contract
            const contractId = await this.deployLoanContract(lenderDID, this.myDID, loanTerms);
            const contract = {
                contractId,
                lender: lenderDID,
                borrower: this.myDID,
                terms: loanTerms,
                status: 'active',
                createdAt: Date.now(),
                nextPaymentDue: Date.now() + this.getPaymentInterval(loanTerms.repaymentFrequency),
            };
            this.activeLoans.set(contractId, contract);
            return contract;
        }
        catch (error) {
            console.error('Loan negotiation failed:', error);
            return null;
        }
    }
    /**
     * Evaluate loan request as lender
     */
    async evaluateLoanRequest(borrowerDID, session) {
        const proposal = session.currentProposal;
        if (!proposal || !proposal.metadata) {
            return false;
        }
        const requestedAmount = proposal.price || 0;
        const collateralAmount = proposal.metadata.collateralAmount || 0;
        const collateralAsset = proposal.metadata.collateralAsset || 'XLM';
        // Check borrower reputation
        const reputation = await this.coordinator.getReputation(borrowerDID);
        if (!reputation || reputation.overallScore < this.character.lendingStrategy.minCreditScore) {
            return false;
        }
        // Check loan-to-value ratio
        const ltv = collateralAmount > 0 ? requestedAmount / collateralAmount : 1;
        if (ltv > this.character.lendingStrategy.maxLoanToValue) {
            return false;
        }
        // Calculate interest rate
        const creditMultiplier = (1000 - reputation.overallScore) / 1000;
        const interestRate = this.character.lendingStrategy.interestRateModel.baseRate *
            (1 + creditMultiplier * this.character.lendingStrategy.interestRateModel.creditScoreMultiplier);
        // Accept if terms are favorable
        return interestRate >= this.character.lendingStrategy.interestRateModel.baseRate;
    }
    /**
     * Accept loan request as lender
     */
    async acceptLoanRequest(session, borrowerDID) {
        try {
            const proposal = session.currentProposal;
            if (!proposal || !proposal.metadata) {
                return null;
            }
            // Calculate final terms
            const reputation = await this.coordinator.getReputation(borrowerDID);
            const creditMultiplier = reputation
                ? (1000 - reputation.overallScore) / 1000
                : 0.5;
            const interestRate = this.character.lendingStrategy.interestRateModel.baseRate *
                (1 + creditMultiplier * this.character.lendingStrategy.interestRateModel.creditScoreMultiplier);
            const loanTerms = {
                principal: proposal.price || 0,
                interestRate,
                duration: proposal.duration || this.character.lendingStrategy.preferredDuration,
                collateralAmount: proposal.metadata.collateralAmount,
                collateralAsset: proposal.metadata.collateralAsset,
                repaymentFrequency: 'monthly',
            };
            // Accept negotiation
            await this.coordinator.acceptTerms(session.sessionId, this.myDID, 'signature-placeholder');
            // Deploy loan contract
            const contractId = await this.deployLoanContract(this.myDID, borrowerDID, loanTerms);
            const contract = {
                contractId,
                lender: this.myDID,
                borrower: borrowerDID,
                terms: loanTerms,
                status: 'active',
                createdAt: Date.now(),
                nextPaymentDue: Date.now() + this.getPaymentInterval(loanTerms.repaymentFrequency),
            };
            this.activeLoans.set(contractId, contract);
            return contract;
        }
        catch (error) {
            console.error('Failed to accept loan request:', error);
            return null;
        }
    }
    /**
     * Make loan repayment
     */
    async makeRepayment(contractId, amount) {
        const contract = this.activeLoans.get(contractId);
        if (!contract) {
            return {
                success: false,
                hash: '',
                error: 'Contract not found',
            };
        }
        // In production, this would invoke the Soroban loan contract
        // For now, simulate with a payment
        const txResult = await this.stellarClient.sendPayment(this.secretKey, contract.lender, amount, 'XLM', `loan-repayment:${contractId}`);
        if (txResult.success) {
            // Update next payment due
            contract.nextPaymentDue = Date.now() + this.getPaymentInterval(contract.terms.repaymentFrequency);
            this.activeLoans.set(contractId, contract);
        }
        return txResult;
    }
    /**
     * Check for due payments
     */
    async checkDuePayments() {
        const now = Date.now();
        const dueContracts = [];
        for (const [contractId, contract] of this.activeLoans.entries()) {
            if (contract.status === 'active' && contract.nextPaymentDue && contract.nextPaymentDue <= now) {
                dueContracts.push(contractId);
            }
        }
        return dueContracts;
    }
    /**
     * Deploy loan contract
     */
    async deployLoanContract(lender, borrower, terms) {
        // In production, this would deploy a Soroban contract
        // For now, generate a contract ID
        return `loan-contract-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }
    /**
     * Get payment interval in milliseconds
     */
    getPaymentInterval(frequency) {
        switch (frequency) {
            case 'daily':
                return 24 * 60 * 60 * 1000;
            case 'weekly':
                return 7 * 24 * 60 * 60 * 1000;
            case 'monthly':
                return 30 * 24 * 60 * 60 * 1000;
        }
    }
    /**
     * Get active loans
     */
    getActiveLoans() {
        return Array.from(this.activeLoans.values()).filter((c) => c.status === 'active');
    }
    /**
     * Get loan by ID
     */
    getLoan(contractId) {
        return this.activeLoans.get(contractId);
    }
}
//# sourceMappingURL=LoanNegotiator.js.map