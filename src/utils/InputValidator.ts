/**
 * Input Validation Utilities
 *
 * Provides validation functions for payment proofs, credentials,
 * DIDs, and transaction data.
 */

import { PaymentProof } from '../protocols/x402/types';
import { VerifiableCredential, DIDDocument } from '../protocols/masumi/types';

export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public value?: any
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class InputValidator {
  /**
   * Validate payment proof
   */
  static validatePaymentProof(proof: PaymentProof): void {
    if (!proof) {
      throw new ValidationError('Payment proof is required');
    }

    if (!proof.type || !['on-chain', 'channel'].includes(proof.type)) {
      throw new ValidationError('Invalid payment proof type', 'type', proof.type);
    }

    if (!proof.timestamp || proof.timestamp <= 0) {
      throw new ValidationError('Invalid timestamp', 'timestamp', proof.timestamp);
    }

    // Validate timestamp is not too old (24 hours)
    const maxAge = 24 * 60 * 60 * 1000;
    if (Date.now() - proof.timestamp > maxAge) {
      throw new ValidationError('Payment proof is too old', 'timestamp');
    }

    if (proof.type === 'on-chain') {
      if (!proof.transactionHash) {
        throw new ValidationError(
          'Transaction hash required for on-chain proof',
          'transactionHash'
        );
      }

      if (!this.isValidTransactionHash(proof.transactionHash)) {
        throw new ValidationError(
          'Invalid transaction hash format',
          'transactionHash',
          proof.transactionHash
        );
      }
    }

    if (proof.type === 'channel') {
      if (!proof.channelState) {
        throw new ValidationError('Channel state required for channel proof', 'channelState');
      }

      this.validateChannelState(proof.channelState);
    }
  }

  /**
   * Validate channel state
   */
  static validateChannelState(state: any): void {
    if (!state.channelId) {
      throw new ValidationError('Channel ID is required', 'channelId');
    }

    if (!state.participants || state.participants.length !== 2) {
      throw new ValidationError('Channel must have exactly 2 participants', 'participants');
    }

    if (!state.balances || state.balances.length !== 2) {
      throw new ValidationError('Channel must have exactly 2 balances', 'balances');
    }

    if (state.balances.some((b: number) => b < 0)) {
      throw new ValidationError('Channel balances cannot be negative', 'balances');
    }

    if (typeof state.nonce !== 'number' || state.nonce < 0) {
      throw new ValidationError('Invalid nonce', 'nonce', state.nonce);
    }

    if (!state.signatures || state.signatures.length !== 2) {
      throw new ValidationError('Channel state must have 2 signatures', 'signatures');
    }
  }

  /**
   * Validate DID
   */
  static validateDID(did: string): void {
    if (!did) {
      throw new ValidationError('DID is required');
    }

    // W3C DID format: did:method:identifier
    const didRegex = /^did:[a-z0-9]+:[a-zA-Z0-9._-]+$/;
    if (!didRegex.test(did)) {
      throw new ValidationError('Invalid DID format', 'did', did);
    }
  }

  /**
   * Validate DID Document
   */
  static validateDIDDocument(doc: DIDDocument): void {
    if (!doc.id) {
      throw new ValidationError('DID document must have an id', 'id');
    }

    this.validateDID(doc.id);

    if (!doc.publicKey || doc.publicKey.length === 0) {
      throw new ValidationError('DID document must have at least one public key', 'publicKey');
    }

    if (!doc.authentication || doc.authentication.length === 0) {
      throw new ValidationError('DID document must have authentication methods', 'authentication');
    }
  }

  /**
   * Validate Verifiable Credential
   */
  static validateCredential(vc: VerifiableCredential): void {
    if (!vc['@context'] || vc['@context'].length === 0) {
      throw new ValidationError('Credential must have @context', '@context');
    }

    if (!vc.type || vc.type.length === 0) {
      throw new ValidationError('Credential must have type', 'type');
    }

    if (!vc.issuer) {
      throw new ValidationError('Credential must have issuer', 'issuer');
    }

    this.validateDID(vc.issuer);

    if (!vc.issuanceDate) {
      throw new ValidationError('Credential must have issuance date', 'issuanceDate');
    }

    if (!this.isValidDate(vc.issuanceDate)) {
      throw new ValidationError('Invalid issuance date', 'issuanceDate', vc.issuanceDate);
    }

    if (vc.expirationDate && !this.isValidDate(vc.expirationDate)) {
      throw new ValidationError('Invalid expiration date', 'expirationDate', vc.expirationDate);
    }

    if (!vc.credentialSubject) {
      throw new ValidationError('Credential must have subject', 'credentialSubject');
    }

    if (!vc.proof) {
      throw new ValidationError('Credential must have proof', 'proof');
    }
  }

  /**
   * Validate transaction data
   */
  static validateTransaction(tx: any): void {
    if (!tx) {
      throw new ValidationError('Transaction is required');
    }

    if (!tx.source) {
      throw new ValidationError('Transaction must have source', 'source');
    }

    if (!this.isValidStellarAddress(tx.source)) {
      throw new ValidationError('Invalid source address', 'source', tx.source);
    }

    if (!tx.fee || tx.fee <= 0) {
      throw new ValidationError('Invalid fee', 'fee', tx.fee);
    }

    if (!tx.sequence || tx.sequence <= 0) {
      throw new ValidationError('Invalid sequence', 'sequence', tx.sequence);
    }

    if (!tx.operations || tx.operations.length === 0) {
      throw new ValidationError('Transaction must have at least one operation', 'operations');
    }
  }

  /**
   * Validate amount
   */
  static validateAmount(amount: number, fieldName: string = 'amount'): void {
    if (typeof amount !== 'number') {
      throw new ValidationError(`${fieldName} must be a number`, fieldName, amount);
    }

    if (amount <= 0) {
      throw new ValidationError(`${fieldName} must be positive`, fieldName, amount);
    }

    if (!Number.isFinite(amount)) {
      throw new ValidationError(`${fieldName} must be finite`, fieldName, amount);
    }
  }

  /**
   * Validate address
   */
  static validateAddress(address: string, fieldName: string = 'address'): void {
    if (!address) {
      throw new ValidationError(`${fieldName} is required`, fieldName);
    }

    if (!this.isValidStellarAddress(address)) {
      throw new ValidationError(`Invalid ${fieldName} format`, fieldName, address);
    }
  }

  /**
   * Validate credit score
   */
  static validateCreditScore(score: number): void {
    if (typeof score !== 'number') {
      throw new ValidationError('Credit score must be a number', 'score', score);
    }

    if (score < 0 || score > 1000) {
      throw new ValidationError('Credit score must be between 0 and 1000', 'score', score);
    }
  }

  /**
   * Validate loan terms
   */
  static validateLoanTerms(terms: any): void {
    this.validateAmount(terms.principal, 'principal');

    if (typeof terms.interestRate !== 'number' || terms.interestRate < 0) {
      throw new ValidationError('Invalid interest rate', 'interestRate', terms.interestRate);
    }

    if (typeof terms.duration !== 'number' || terms.duration <= 0) {
      throw new ValidationError('Invalid duration', 'duration', terms.duration);
    }

    this.validateAmount(terms.collateralAmount, 'collateralAmount');
    this.validateAddress(terms.collateralAsset, 'collateralAsset');
  }

  /**
   * Validate escrow parameters
   */
  static validateEscrowParams(params: any): void {
    this.validateAddress(params.buyer, 'buyer');
    this.validateAddress(params.seller, 'seller');
    this.validateAmount(params.amount, 'amount');
    this.validateAddress(params.asset, 'asset');

    if (typeof params.deadline !== 'number' || params.deadline <= Date.now()) {
      throw new ValidationError('Deadline must be in the future', 'deadline', params.deadline);
    }
  }

  /**
   * Check if valid Stellar address
   */
  private static isValidStellarAddress(address: string): boolean {
    // Stellar addresses are 56 characters, start with G
    return /^G[A-Z2-7]{55}$/.test(address);
  }

  /**
   * Check if valid transaction hash
   */
  private static isValidTransactionHash(hash: string): boolean {
    // Stellar transaction hashes are 64 character hex strings
    return /^[a-f0-9]{64}$/i.test(hash);
  }

  /**
   * Check if valid ISO date string
   */
  private static isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  /**
   * Sanitize string input
   */
  static sanitizeString(input: string, maxLength: number = 1000): string {
    if (typeof input !== 'string') {
      throw new ValidationError('Input must be a string');
    }

    // Remove null bytes
    let sanitized = input.replace(/\0/g, '');

    // Trim whitespace
    sanitized = sanitized.trim();

    // Limit length
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    return sanitized;
  }

  /**
   * Validate object has required fields
   */
  static validateRequiredFields(obj: any, requiredFields: string[]): void {
    for (const field of requiredFields) {
      if (!(field in obj) || obj[field] === undefined || obj[field] === null) {
        throw new ValidationError(`Required field missing: ${field}`, field);
      }
    }
  }
}
