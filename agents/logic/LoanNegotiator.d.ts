/**
 * Loan Negotiator
 *
 * Handles autonomous loan negotiation and management.
 */
import { CharacterConfig, TxResult } from '../runtime/types.js';
import { DID } from '../../protocols/masumi/types.js';
import { SokosumiCoordinator, NegotiationSession } from '../../protocols/sokosumi/index.js';
import { StellarClient } from '../../src/stellar/StellarClient.js';
/**
 * Loan terms
 */
export interface LoanTerms {
    principal: number;
    interestRate: number;
    duration: number;
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
export declare class LoanNegotiator {
    private character;
    private coordinator;
    private stellarClient;
    private myDID;
    private secretKey;
    private activeLoans;
    constructor(character: CharacterConfig, coordinator: SokosumiCoordinator, stellarClient: StellarClient, myDID: DID, secretKey: string);
    /**
     * Search for lenders
     */
    searchLenders(amount: number): Promise<DID[]>;
    /**
     * Negotiate loan as borrower
     */
    negotiateLoan(lenderDID: DID, desiredAmount: number, collateralAmount: number, collateralAsset?: string): Promise<LoanContract | null>;
    /**
     * Evaluate loan request as lender
     */
    evaluateLoanRequest(borrowerDID: DID, session: NegotiationSession): Promise<boolean>;
    /**
     * Accept loan request as lender
     */
    acceptLoanRequest(session: NegotiationSession, borrowerDID: DID): Promise<LoanContract | null>;
    /**
     * Make loan repayment
     */
    makeRepayment(contractId: string, amount: number): Promise<TxResult>;
    /**
     * Check for due payments
     */
    checkDuePayments(): Promise<string[]>;
    /**
     * Deploy loan contract
     */
    private deployLoanContract;
    /**
     * Get payment interval in milliseconds
     */
    private getPaymentInterval;
    /**
     * Get active loans
     */
    getActiveLoans(): LoanContract[];
    /**
     * Get loan by ID
     */
    getLoan(contractId: string): LoanContract | undefined;
}
//# sourceMappingURL=LoanNegotiator.d.ts.map