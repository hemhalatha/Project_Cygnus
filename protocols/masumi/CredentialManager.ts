/**
 * Credential Manager
 * 
 * Manages Verifiable Credentials following W3C VC standards.
 */

import {
  DID,
  VerifiableCredential,
  VerifiablePresentation,
  VerificationResult,
  CredentialIssuanceRequest,
  PresentationChallenge,
  CryptographicProof,
  MasumiConfig,
} from './types.js';
import { DIDManager } from './DIDManager.js';

/**
 * Credential Manager for issuing and verifying credentials
 */
export class CredentialManager {
  private config: MasumiConfig;
  private didManager: DIDManager;
  private credentialCache: Map<string, VerifiableCredential> = new Map();

  constructor(config: MasumiConfig, didManager: DIDManager) {
    this.config = config;
    this.didManager = didManager;
  }

  /**
   * Issue a verifiable credential
   */
  async issueCredential(
    issuerDID: DID,
    request: CredentialIssuanceRequest,
    issuerSecretKey: string
  ): Promise<VerifiableCredential> {
    // Verify issuer DID exists
    const issuerResolution = await this.didManager.resolveDID(issuerDID);
    if (!issuerResolution.didDocument) {
      throw new Error(`Issuer DID not found: ${issuerDID}`);
    }

    // Verify subject DID exists
    const subjectResolution = await this.didManager.resolveDID(request.subject);
    if (!subjectResolution.didDocument) {
      throw new Error(`Subject DID not found: ${request.subject}`);
    }

    // Create credential ID
    const credentialId = this.generateCredentialId();

    // Create credential
    const credential: VerifiableCredential = {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://w3id.org/security/suites/ed25519-2020/v1',
      ],
      id: credentialId,
      type: ['VerifiableCredential', ...(request.credentialType || [])],
      issuer: issuerDID,
      issuanceDate: new Date().toISOString(),
      expirationDate: request.expirationDate,
      credentialSubject: {
        id: request.subject,
        ...request.claims,
      },
      proof: await this.createProof(
        {
          '@context': [
            'https://www.w3.org/2018/credentials/v1',
            'https://w3id.org/security/suites/ed25519-2020/v1',
          ],
          id: credentialId,
          type: ['VerifiableCredential', ...(request.credentialType || [])],
          issuer: issuerDID,
          issuanceDate: new Date().toISOString(),
          expirationDate: request.expirationDate,
          credentialSubject: {
            id: request.subject,
            ...request.claims,
          },
        } as any,
        issuerDID,
        issuerSecretKey
      ),
    };

    // Cache credential
    this.credentialCache.set(credentialId, credential);

    return credential;
  }

  /**
   * Verify a verifiable credential
   */
  async verifyCredential(
    credential: VerifiableCredential
  ): Promise<VerificationResult> {
    try {
      // Check if expired
      const notExpired = this.checkExpiration(credential);
      if (!notExpired) {
        return {
          verified: false,
          issuerTrusted: false,
          notExpired: false,
          signatureValid: false,
          error: 'Credential expired',
        };
      }

      // Check if issuer is trusted
      const issuerTrusted = this.checkIssuerTrust(credential.issuer);

      // Verify signature
      const signatureValid = await this.verifyProof(credential);

      const verified = notExpired && issuerTrusted && signatureValid;

      return {
        verified,
        issuerTrusted,
        notExpired,
        signatureValid,
      };
    } catch (error) {
      return {
        verified: false,
        issuerTrusted: false,
        notExpired: false,
        signatureValid: false,
        error: `Verification failed: ${error}`,
      };
    }
  }

  /**
   * Create a verifiable presentation
   */
  async createPresentation(
    holderDID: DID,
    credentials: VerifiableCredential[],
    challenge: PresentationChallenge,
    holderSecretKey: string
  ): Promise<VerifiablePresentation> {
    // Verify holder DID exists
    const holderResolution = await this.didManager.resolveDID(holderDID);
    if (!holderResolution.didDocument) {
      throw new Error(`Holder DID not found: ${holderDID}`);
    }

    // Check challenge expiration
    if (challenge.expiresAt < Date.now()) {
      throw new Error('Challenge expired');
    }

    // Create presentation
    const presentation: VerifiablePresentation = {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://w3id.org/security/suites/ed25519-2020/v1',
      ],
      type: ['VerifiablePresentation'],
      holder: holderDID,
      verifiableCredential: credentials,
      proof: await this.createProof(
        {
          '@context': [
            'https://www.w3.org/2018/credentials/v1',
            'https://w3id.org/security/suites/ed25519-2020/v1',
          ],
          type: ['VerifiablePresentation'],
          holder: holderDID,
          verifiableCredential: credentials,
          challenge: challenge.challenge,
        } as any,
        holderDID,
        holderSecretKey
      ),
    };

    return presentation;
  }

  /**
   * Verify a verifiable presentation
   */
  async verifyPresentation(
    presentation: VerifiablePresentation,
    challenge: PresentationChallenge
  ): Promise<VerificationResult> {
    try {
      // Verify presentation proof
      const presentationValid = await this.verifyProof(presentation as any);
      if (!presentationValid) {
        return {
          verified: false,
          issuerTrusted: false,
          notExpired: false,
          signatureValid: false,
          error: 'Invalid presentation signature',
        };
      }

      // Verify all credentials in presentation
      for (const credential of presentation.verifiableCredential) {
        const result = await this.verifyCredential(credential);
        if (!result.verified) {
          return {
            verified: false,
            issuerTrusted: result.issuerTrusted,
            notExpired: result.notExpired,
            signatureValid: result.signatureValid,
            error: `Credential verification failed: ${result.error}`,
          };
        }
      }

      return {
        verified: true,
        issuerTrusted: true,
        notExpired: true,
        signatureValid: true,
      };
    } catch (error) {
      return {
        verified: false,
        issuerTrusted: false,
        notExpired: false,
        signatureValid: false,
        error: `Presentation verification failed: ${error}`,
      };
    }
  }

  /**
   * Revoke a credential
   */
  async revokeCredential(credentialId: string): Promise<void> {
    // In production, add to revocation list on-chain
    this.credentialCache.delete(credentialId);
  }

  /**
   * Check if credential is revoked
   */
  async isRevoked(credentialId: string): Promise<boolean> {
    // In production, check revocation list on-chain
    return !this.credentialCache.has(credentialId);
  }

  // Private methods

  /**
   * Generate credential ID
   */
  private generateCredentialId(): string {
    return `urn:uuid:${this.generateUUID()}`;
  }

  /**
   * Generate UUID
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Create cryptographic proof
   */
  private async createProof(
    data: any,
    signerDID: DID,
    secretKey: string
  ): Promise<CryptographicProof> {
    // In production, use proper cryptographic signing
    const dataString = JSON.stringify(data);
    const proofValue = await this.sign(dataString, secretKey);

    return {
      type: 'Ed25519Signature2020',
      created: new Date().toISOString(),
      verificationMethod: `${signerDID}#key-1`,
      proofPurpose: 'assertionMethod',
      proofValue,
    };
  }

  /**
   * Verify cryptographic proof
   */
  private async verifyProof(data: any): Promise<boolean> {
    // In production, verify cryptographic signature
    // For now, check that proof exists and has required fields
    const proof = data.proof;
    return (
      proof &&
      proof.type &&
      proof.verificationMethod &&
      proof.proofValue &&
      proof.proofValue.length > 0
    );
  }

  /**
   * Sign data
   */
  private async sign(data: string, secretKey: string): Promise<string> {
    // In production, use proper cryptographic signing
    return `sig-${Buffer.from(data).toString('base64').substring(0, 64)}`;
  }

  /**
   * Check credential expiration
   */
  private checkExpiration(credential: VerifiableCredential): boolean {
    if (!credential.expirationDate) {
      return true; // No expiration
    }

    const expirationTime = new Date(credential.expirationDate).getTime();
    return Date.now() < expirationTime;
  }

  /**
   * Check if issuer is trusted
   */
  private checkIssuerTrust(issuerDID: DID): boolean {
    // Check if issuer is in trusted list
    if (this.config.trustedIssuers.length === 0) {
      return true; // Trust all if no list specified
    }

    return this.config.trustedIssuers.includes(issuerDID);
  }

  /**
   * Add trusted issuer
   */
  addTrustedIssuer(issuerDID: DID): void {
    if (!this.config.trustedIssuers.includes(issuerDID)) {
      this.config.trustedIssuers.push(issuerDID);
    }
  }

  /**
   * Remove trusted issuer
   */
  removeTrustedIssuer(issuerDID: DID): void {
    const index = this.config.trustedIssuers.indexOf(issuerDID);
    if (index > -1) {
      this.config.trustedIssuers.splice(index, 1);
    }
  }

  /**
   * Get credential from cache
   */
  getCredential(credentialId: string): VerifiableCredential | undefined {
    return this.credentialCache.get(credentialId);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.credentialCache.clear();
  }
}
