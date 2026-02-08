/**
 * Credential Manager
 *
 * Manages Verifiable Credentials following W3C VC standards.
 */
import { DID, VerifiableCredential, VerifiablePresentation, VerificationResult, CredentialIssuanceRequest, PresentationChallenge, MasumiConfig } from './types.js';
import { DIDManager } from './DIDManager.js';
/**
 * Credential Manager for issuing and verifying credentials
 */
export declare class CredentialManager {
    private config;
    private didManager;
    private credentialCache;
    constructor(config: MasumiConfig, didManager: DIDManager);
    /**
     * Issue a verifiable credential
     */
    issueCredential(issuerDID: DID, request: CredentialIssuanceRequest, issuerSecretKey: string): Promise<VerifiableCredential>;
    /**
     * Verify a verifiable credential
     */
    verifyCredential(credential: VerifiableCredential): Promise<VerificationResult>;
    /**
     * Create a verifiable presentation
     */
    createPresentation(holderDID: DID, credentials: VerifiableCredential[], challenge: PresentationChallenge, holderSecretKey: string): Promise<VerifiablePresentation>;
    /**
     * Verify a verifiable presentation
     */
    verifyPresentation(presentation: VerifiablePresentation, challenge: PresentationChallenge): Promise<VerificationResult>;
    /**
     * Revoke a credential
     */
    revokeCredential(credentialId: string): Promise<void>;
    /**
     * Check if credential is revoked
     */
    isRevoked(credentialId: string): Promise<boolean>;
    /**
     * Generate credential ID
     */
    private generateCredentialId;
    /**
     * Generate UUID
     */
    private generateUUID;
    /**
     * Create cryptographic proof
     */
    private createProof;
    /**
     * Verify cryptographic proof
     */
    private verifyProof;
    /**
     * Sign data
     */
    private sign;
    /**
     * Check credential expiration
     */
    private checkExpiration;
    /**
     * Check if issuer is trusted
     */
    private checkIssuerTrust;
    /**
     * Add trusted issuer
     */
    addTrustedIssuer(issuerDID: DID): void;
    /**
     * Remove trusted issuer
     */
    removeTrustedIssuer(issuerDID: DID): void;
    /**
     * Get credential from cache
     */
    getCredential(credentialId: string): VerifiableCredential | undefined;
    /**
     * Clear cache
     */
    clearCache(): void;
}
//# sourceMappingURL=CredentialManager.d.ts.map