/**
 * Masumi Protocol Type Definitions
 * 
 * Types for the Masumi decentralized identity and verifiable credentials protocol.
 */

/**
 * Verifiable Credential following W3C standard
 */
export interface VerifiableCredential {
  '@context': string[];
  type: string[];
  issuer: string;
  issuanceDate: string;
  expirationDate?: string;
  credentialSubject: any;
  proof: CredentialProof;
}

/**
 * Cryptographic proof for verifiable credential
 */
export interface CredentialProof {
  type: string;
  created: string;
  verificationMethod: string;
  proofPurpose: string;
  proofValue: string;
}

/**
 * DID Document (Decentralized Identifier Document)
 */
export interface DIDDocument {
  id: string;
  publicKey: PublicKeyEntry[];
  authentication: (string | AuthenticationEntry)[];
  service?: ServiceEndpoint[];
}

/**
 * Public key entry in DID document
 */
export interface PublicKeyEntry {
  id: string;
  type: string;
  controller: string;
  publicKeyBase58?: string;
  publicKeyHex?: string;
}

/**
 * Authentication entry in DID document
 */
export interface AuthenticationEntry {
  type: string;
  publicKey: string;
}

/**
 * Service endpoint in DID document
 */
export interface ServiceEndpoint {
  id: string;
  type: string;
  serviceEndpoint: string;
}

/**
 * Verifiable presentation containing credentials
 */
export interface VerifiablePresentation {
  '@context': string[];
  type: string[];
  verifiableCredential: VerifiableCredential[];
  proof: CredentialProof;
}
