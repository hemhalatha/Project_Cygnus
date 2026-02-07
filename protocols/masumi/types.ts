/**
 * Masumi Identity and Trust Layer Types
 * 
 * W3C DID/VC standards implementation for agent identity.
 */

/**
 * Decentralized Identifier (DID)
 */
export type DID = string; // Format: did:method:identifier

/**
 * DID Document following W3C standards
 */
export interface DIDDocument {
  '@context': string[];
  id: DID;
  controller?: DID[];
  verificationMethod: VerificationMethod[];
  authentication: string[];
  assertionMethod?: string[];
  keyAgreement?: string[];
  capabilityInvocation?: string[];
  capabilityDelegation?: string[];
  service: ServiceEndpoint[];
  created?: string;
  updated?: string;
}

/**
 * Verification method for DID
 */
export interface VerificationMethod {
  id: string;
  type: string;
  controller: DID;
  publicKeyMultibase?: string;
  publicKeyJwk?: JsonWebKey;
}

/**
 * Service endpoint in DID document
 */
export interface ServiceEndpoint {
  id: string;
  type: string;
  serviceEndpoint: string;
  description?: string;
}

/**
 * Verifiable Credential following W3C standards
 */
export interface VerifiableCredential {
  '@context': string[];
  id: string;
  type: string[];
  issuer: DID;
  issuanceDate: string;
  expirationDate?: string;
  credentialSubject: CredentialSubject;
  proof: CryptographicProof;
}

/**
 * Credential subject (claims about the subject)
 */
export interface CredentialSubject {
  id: DID;
  [key: string]: any;
}

/**
 * Cryptographic proof for credentials
 */
export interface CryptographicProof {
  type: string;
  created: string;
  verificationMethod: string;
  proofPurpose: string;
  proofValue: string;
}

/**
 * Verifiable Presentation
 */
export interface VerifiablePresentation {
  '@context': string[];
  type: string[];
  holder: DID;
  verifiableCredential: VerifiableCredential[];
  proof: CryptographicProof;
}

/**
 * Verification result
 */
export interface VerificationResult {
  verified: boolean;
  issuerTrusted: boolean;
  notExpired: boolean;
  signatureValid: boolean;
  error?: string;
}

/**
 * Agent metadata for registry
 */
export interface AgentMetadata {
  name: string;
  description: string;
  capabilities: string[];
  endpoints: {
    x402?: string;
    sokosumi?: string;
    [key: string]: string | undefined;
  };
  reputation: {
    score: number;
    reviews: number;
    successRate: number;
  };
  createdAt: number;
  updatedAt: number;
}

/**
 * Agent registry entry
 */
export interface AgentRegistryEntry {
  did: DID;
  metadata: AgentMetadata;
  nftTokenId: string;
  contractAddress: string;
  owner: string;
}

/**
 * DID update operation
 */
export interface DIDUpdate {
  addVerificationMethod?: VerificationMethod[];
  removeVerificationMethod?: string[];
  addService?: ServiceEndpoint[];
  removeService?: string[];
  controller?: DID[];
}

/**
 * Credential issuance request
 */
export interface CredentialIssuanceRequest {
  subject: DID;
  claims: Record<string, any>;
  expirationDate?: string;
  credentialType?: string[];
}

/**
 * Presentation challenge
 */
export interface PresentationChallenge {
  challenge: string;
  domain?: string;
  expiresAt: number;
}

/**
 * Masumi configuration
 */
export interface MasumiConfig {
  didMethod: string; // e.g., "stellar", "key"
  registryContractId?: string;
  trustedIssuers: DID[];
  stellarNetwork: 'testnet' | 'mainnet';
}

/**
 * DID resolution result
 */
export interface DIDResolutionResult {
  didDocument: DIDDocument | null;
  didDocumentMetadata: {
    created?: string;
    updated?: string;
    deactivated?: boolean;
  };
  didResolutionMetadata: {
    contentType?: string;
    error?: string;
  };
}
