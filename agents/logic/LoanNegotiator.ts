/**
 * Loan Negotiator
 * 
 * Handles autonomous loan negotiation and management.
 */

import {
  CharacterConfig,
  TxResult,
} from '../runtime/types.js';
import { DID } from '../../protocols/masumi/types.js';
import {
  SokosumiCoordinator,
  ServiceQuery,
  Terms,
  NegotiationSession,
  Agreement,
} from '../../protocols/sokosumi/index.js';
import { StellarClient } from '../../src/stellar/StellarClient.js';

/**
 * Loan terms
 */
export interface LoanTerms {
  principal: number;
  interestRate: number; // basis points
  duration: number; // seconds
  collateralAmount: number;
  collateralAsset: string;
  repaymentFrequency: 'daily' | 'weekly' | 'monthly';
}

/**
 * Loan contract
 */
export interface LoanContract {
  contractId: string;
  lender: DID;
  borrower: DID;
  terms: LoanTerms;
  status: 'active' | 'repaid' | 'defaulted';
  createdAt: number;
  nextPaymentDue?: number;
}

/**
 * Loan Negotiator for autonomous lending/borrowing
 */
export class LoanNegotiator {
  private character: CharacterConfig;
  private coordinator: SokosumiCoordinator;
  private stellarClient: StellarClient;
  private myDID: DID;
  private secretKey: string;
  private activeLoans: Map<string, LoanContract> = new Map();

  constructor(
    character: CharacterConfig,
    coordinator: SokosumiCoordinator,
    stellarClient: StellarClient,
    myDID: DID,
    secretKey: string
  ) {
    this.character = character;
    this.coordinator = coordinator;
    this.stellarClient = stellarClient;
    this.myDID = myDID;
    this.secretKey = secretKey;
  }

  /**
   * Search for lenders
   */
  async searchLenders(amount: number): Promise<DID[]> {
    const query: ServiceQuery = {
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
  async negotiateLoan(
    lenderDID: DID,
    desiredAmount: number,
    collateralAmount: number,
    collateralAsset: string = 'XLM'
  ): Promise<LoanContract | null> {
    try {
      // Initiate negotiation
      const session = await this.coordinator.initiateNegotiation(
        [this.myDID, lenderDID],
        'Loan Agreement',
        this.myDID
      );

      // Propose terms
      const proposedTerms: Terms = {
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

      await this.coordinator.proposeTerms(
        session.sessionId,
        this.myDID,
        proposedTerms
      );

      // Wait for lender response (in production, this would be event-driven)
      // For now, simulate acceptance
      const loanTerms: LoanTerms = {
        principal: desiredAmount,
        interestRate: this.character.lendingStrategy.interestRateModel.baseRate,
        duration: this.character.lendingStrategy.preferredDuration,
        collateralAmount,
        collateralAsset,
        repaymentFrequency: 'monthly',
      };

      // Deploy loan contract
      const contractId = await this.deployLoanContract(
        lenderDID,
        this.myDID,
        loanTerms
      );

      const contract: LoanContract = {
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
    } catch (error) {
      console.error('Loan negotiation failed:', error);
      return null;
    }
  }

  /**
   * Evaluate loan request as lender
   */
  async evaluateLoanRequest(
    borrowerDID: DID,
    session: NegotiationSession
  ): Promise<boolean> {
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
  async acceptLoanRequest(
    session: NegotiationSession,
    borrowerDID: DID
  ): Promise<LoanContract | null> {
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

      const loanTerms: LoanTerms = {
        principal: proposal.price || 0,
        interestRate,
        duration: proposal.duration || this.character.lendingStrategy.preferredDuration,
        collateralAmount: proposal.metadata.collateralAmount,
        collateralAsset: proposal.metadata.collateralAsset,
        repaymentFrequency: 'monthly',
      };

      // Accept negotiation
      await this.coordinator.acceptTerms(
        session.sessionId,
        this.myDID,
        'signature-placeholder'
      );

      // Deploy loan contract
      const contractId = await this.deployLoanContract(
        this.myDID,
        borrowerDID,
        loanTerms
      );

      const contract: LoanContract = {
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
    } catch (error) {
      console.error('Failed to accept loan request:', error);
      return null;
    }
  }

  /**
   * Make loan repayment
   */
  async makeRepayment(contractId: string, amount: number): Promise<TxResult> {
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
    const txResult = await this.stellarClient.sendPayment(
      this.secretKey,
      contract.lender,
      amount,
      'XLM',
      `loan-repayment:${contractId}`
    );

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
  async checkDuePayments(): Promise<string[]> {
    const now = Date.now();
    const dueContracts: string[] = [];

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
  private async deployLoanContract(
    lender: DID,
    borrower: DID,
    terms: LoanTerms
  ): Promise<string> {
    // In production, this would deploy a Soroban contract
    // For now, generate a contract ID
    return `loan-contract-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Get payment interval in milliseconds
   */
  private getPaymentInterval(frequency: 'daily' | 'weekly' | 'monthly'): number {
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
  getActiveLoans(): LoanContract[] {
    return Array.from(this.activeLoans.values()).filter(
      (c) => c.status === 'active'
    );
  }

  /**
   * Get loan by ID
   */
  getLoan(contractId: string): LoanContract | undefined {
    return this.activeLoans.get(contractId);
  }
}
