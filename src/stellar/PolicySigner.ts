/**
 * Policy Signer
 * 
 * Non-custodial key management with conditional transaction authorization.
 */

import * as StellarSdk from '@stellar/stellar-sdk';
import { Transaction, SignedTransaction } from '../../agents/runtime/types.js';

/**
 * Transaction policy
 */
export interface TransactionPolicy {
  maxAmount: number;
  allowedRecipients?: string[];
  requiresMultiSig?: boolean;
  timeRestrictions?: TimeWindow[];
  riskThreshold: number;
}

/**
 * Time window for restrictions
 */
export interface TimeWindow {
  start: number; // Hour of day (0-23)
  end: number;   // Hour of day (0-23)
  daysOfWeek?: number[]; // 0-6 (Sunday-Saturday)
}

/**
 * Authorization result
 */
export interface AuthorizationResult {
  authorized: boolean;
  reason: string;
  requiresAdditionalApproval: boolean;
}

/**
 * Policy ID
 */
export type PolicyId = string;

/**
 * Policy signer for conditional authorization
 */
export class PolicySigner {
  private policies: Map<PolicyId, TransactionPolicy> = new Map();
  private secretKey: string;
  private publicKey: string;

  constructor(secretKey: string) {
    this.secretKey = secretKey;
    const keypair = StellarSdk.Keypair.fromSecret(secretKey);
    this.publicKey = keypair.publicKey();
  }

  /**
   * Define a new policy
   */
  async definePolicy(policy: TransactionPolicy): Promise<PolicyId> {
    const policyId = this.generatePolicyId();
    this.policies.set(policyId, policy);
    return policyId;
  }

  /**
   * Evaluate transaction against policy
   */
  async evaluateTransaction(
    tx: Transaction,
    policyId: PolicyId
  ): Promise<AuthorizationResult> {
    const policy = this.policies.get(policyId);
    if (!policy) {
      return {
        authorized: false,
        reason: 'Policy not found',
        requiresAdditionalApproval: false,
      };
    }

    // Check amount limit
    const totalAmount = this.calculateTotalAmount(tx);
    if (totalAmount > policy.maxAmount) {
      return {
        authorized: false,
        reason: `Transaction amount (${totalAmount}) exceeds policy limit (${policy.maxAmount})`,
        requiresAdditionalApproval: true,
      };
    }

    // Check allowed recipients
    if (policy.allowedRecipients && policy.allowedRecipients.length > 0) {
      const recipients = this.extractRecipients(tx);
      const unauthorized = recipients.filter(
        r => !policy.allowedRecipients!.includes(r)
      );
      
      if (unauthorized.length > 0) {
        return {
          authorized: false,
          reason: `Unauthorized recipients: ${unauthorized.join(', ')}`,
          requiresAdditionalApproval: true,
        };
      }
    }

    // Check time restrictions
    if (policy.timeRestrictions && policy.timeRestrictions.length > 0) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentDay = now.getDay();

      const isAllowed = policy.timeRestrictions.some(window => {
        const hourAllowed = currentHour >= window.start && currentHour <= window.end;
        const dayAllowed = !window.daysOfWeek || window.daysOfWeek.includes(currentDay);
        return hourAllowed && dayAllowed;
      });

      if (!isAllowed) {
        return {
          authorized: false,
          reason: 'Transaction outside allowed time windows',
          requiresAdditionalApproval: true,
        };
      }
    }

    // Check multi-sig requirement
    if (policy.requiresMultiSig) {
      return {
        authorized: false,
        reason: 'Multi-signature required',
        requiresAdditionalApproval: true,
      };
    }

    return {
      authorized: true,
      reason: 'Transaction authorized by policy',
      requiresAdditionalApproval: false,
    };
  }

  /**
   * Sign transaction if authorized
   */
  async signIfAuthorized(
    tx: Transaction,
    policyId: PolicyId
  ): Promise<SignedTransaction | null> {
    const authorization = await this.evaluateTransaction(tx, policyId);
    
    if (!authorization.authorized) {
      console.log(`Transaction not authorized: ${authorization.reason}`);
      return null;
    }

    // Sign transaction
    const keypair = StellarSdk.Keypair.fromSecret(this.secretKey);
    
    // Convert to Stellar SDK format and sign
    // This is simplified - in production would use proper XDR encoding
    const signature = keypair.sign(Buffer.from(JSON.stringify(tx))).toString('base64');
    const hash = Buffer.from(JSON.stringify(tx)).toString('hex');

    return {
      transaction: tx,
      signature,
      hash,
    };
  }

  /**
   * Rotate key
   */
  async rotateKey(oldKey: string, newKey: string): Promise<void> {
    if (oldKey !== this.secretKey) {
      throw new Error('Old key does not match current key');
    }

    // Verify new key is valid
    try {
      StellarSdk.Keypair.fromSecret(newKey);
    } catch (error) {
      throw new Error('Invalid new key');
    }

    this.secretKey = newKey;
    const keypair = StellarSdk.Keypair.fromSecret(newKey);
    this.publicKey = keypair.publicKey();

    console.log('Key rotated successfully');
  }

  /**
   * Export public key
   */
  async exportPublicKey(): Promise<string> {
    return this.publicKey;
  }

  /**
   * Get policy
   */
  getPolicy(policyId: PolicyId): TransactionPolicy | undefined {
    return this.policies.get(policyId);
  }

  /**
   * Delete policy
   */
  deletePolicy(policyId: PolicyId): boolean {
    return this.policies.delete(policyId);
  }

  /**
   * List all policies
   */
  listPolicies(): Array<{ id: PolicyId; policy: TransactionPolicy }> {
    return Array.from(this.policies.entries()).map(([id, policy]) => ({
      id,
      policy,
    }));
  }

  // Private methods

  /**
   * Calculate total amount from transaction
   */
  private calculateTotalAmount(tx: Transaction): number {
    let total = 0;
    
    for (const op of tx.operations) {
      if (op.body.data.amount) {
        total += parseFloat(op.body.data.amount);
      }
    }

    return total;
  }

  /**
   * Extract recipients from transaction
   */
  private extractRecipients(tx: Transaction): string[] {
    const recipients: string[] = [];
    
    for (const op of tx.operations) {
      if (op.body.data.destination) {
        recipients.push(op.body.data.destination);
      }
    }

    return recipients;
  }

  /**
   * Generate policy ID
   */
  private generatePolicyId(): PolicyId {
    return `policy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
