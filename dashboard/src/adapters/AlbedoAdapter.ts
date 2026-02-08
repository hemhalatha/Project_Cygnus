import { WalletProvider, WalletConnection } from '../types';

// Albedo API types
interface AlbedoAPI {
  publicKey: (options?: { require_existing?: boolean }) => Promise<{ pubkey: string }>;
  tx: (options: { xdr: string; network?: string; submit?: boolean }) => Promise<{ signed_envelope_xdr: string; tx_hash: string }>;
}

declare global {
  interface Window {
    albedo?: AlbedoAPI;
  }
}

/**
 * AlbedoAdapter implements wallet provider interface for Albedo wallet
 * 
 * Albedo is a Stellar wallet that works as a browser extension and web service,
 * providing secure transaction signing without requiring installation.
 */
export class AlbedoAdapter implements WalletProvider {
  name: 'albedo' = 'albedo';

  /**
   * Check if Albedo wallet is available
   * 
   * Albedo can work without installation (web-based), so we check if the API is accessible
   */
  async isInstalled(): Promise<boolean> {
    return typeof window !== 'undefined' && typeof window.albedo !== 'undefined';
  }

  /**
   * Connect to Albedo wallet and request public key
   * 
   * @throws Error if Albedo is not available or connection fails
   */
  async connect(): Promise<WalletConnection> {
    if (!await this.isInstalled()) {
      throw new Error('Albedo wallet is not available. Please install it from https://albedo.link/');
    }

    try {
      const result = await window.albedo!.publicKey();
      
      if (!result || !result.pubkey) {
        throw new Error('Failed to get public key from Albedo');
      }

      return {
        publicKey: result.pubkey,
        provider: 'albedo',
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Albedo connection failed: ${error.message}`);
      }
      throw new Error('Albedo connection failed');
    }
  }

  /**
   * Disconnect from Albedo wallet
   * 
   * Note: Albedo doesn't have an explicit disconnect method,
   * so this is a no-op. The connection state is managed by the app.
   */
  async disconnect(): Promise<void> {
    // Albedo doesn't require explicit disconnection
    // Connection state is managed by the application
  }

  /**
   * Sign a transaction using Albedo wallet
   * 
   * @param xdr - Transaction XDR string to sign
   * @returns Signed transaction XDR
   * @throws Error if signing fails or user rejects
   */
  async signTransaction(xdr: string): Promise<string> {
    if (!await this.isInstalled()) {
      throw new Error('Albedo wallet is not available');
    }

    try {
      const result = await window.albedo!.tx({
        xdr,
        network: 'testnet',
        submit: false, // Don't auto-submit, let the app handle submission
      });

      if (!result || !result.signed_envelope_xdr) {
        throw new Error('Transaction signing returned empty result');
      }

      return result.signed_envelope_xdr;
    } catch (error) {
      if (error instanceof Error) {
        // Check for user rejection
        if (error.message.includes('canceled') || error.message.includes('rejected')) {
          throw new Error('Transaction rejected by user');
        }
        throw new Error(`Transaction signing failed: ${error.message}`);
      }
      throw new Error('Transaction signing failed');
    }
  }

  /**
   * Get the current public key from Albedo
   * 
   * @returns Public key string
   * @throws Error if Albedo is not available or fails to get key
   */
  async getPublicKey(): Promise<string> {
    if (!await this.isInstalled()) {
      throw new Error('Albedo wallet is not available');
    }

    try {
      const result = await window.albedo!.publicKey();
      
      if (!result || !result.pubkey) {
        throw new Error('Failed to get public key from Albedo');
      }

      return result.pubkey;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get public key: ${error.message}`);
      }
      throw new Error('Failed to get public key');
    }
  }
}
