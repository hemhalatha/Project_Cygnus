import { WalletProvider, WalletConnection } from '../types';

// Freighter API types
interface FreighterAPI {
  isConnected: () => Promise<boolean>;
  getPublicKey: () => Promise<string>;
  signTransaction: (xdr: string, options?: { network?: string; networkPassphrase?: string }) => Promise<string>;
}

declare global {
  interface Window {
    freighter?: FreighterAPI;
  }
}

/**
 * FreighterAdapter implements wallet provider interface for Freighter wallet
 * 
 * Freighter is a Stellar wallet browser extension that provides secure
 * transaction signing and account management.
 */
export class FreighterAdapter implements WalletProvider {
  name: 'freighter' = 'freighter';

  /**
   * Check if Freighter wallet extension is installed
   */
  async isInstalled(): Promise<boolean> {
    return typeof window !== 'undefined' && typeof window.freighter !== 'undefined';
  }

  /**
   * Connect to Freighter wallet and request access
   * 
   * @throws Error if Freighter is not installed or connection fails
   */
  async connect(): Promise<WalletConnection> {
    if (!await this.isInstalled()) {
      throw new Error('Freighter wallet is not installed. Please install it from https://www.freighter.app/');
    }

    try {
      const publicKey = await window.freighter!.getPublicKey();
      
      if (!publicKey) {
        throw new Error('Failed to get public key from Freighter');
      }

      return {
        publicKey,
        provider: 'freighter',
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Freighter connection failed: ${error.message}`);
      }
      throw new Error('Freighter connection failed');
    }
  }

  /**
   * Disconnect from Freighter wallet
   * 
   * Note: Freighter doesn't have an explicit disconnect method,
   * so this is a no-op. The connection state is managed by the app.
   */
  async disconnect(): Promise<void> {
    // Freighter doesn't require explicit disconnection
    // Connection state is managed by the application
  }

  /**
   * Sign a transaction using Freighter wallet
   * 
   * @param xdr - Transaction XDR string to sign
   * @returns Signed transaction XDR
   * @throws Error if signing fails or user rejects
   */
  async signTransaction(xdr: string): Promise<string> {
    if (!await this.isInstalled()) {
      throw new Error('Freighter wallet is not installed');
    }

    try {
      const signedXdr = await window.freighter!.signTransaction(xdr, {
        networkPassphrase: 'Test SDF Network ; September 2015',
      });

      if (!signedXdr) {
        throw new Error('Transaction signing returned empty result');
      }

      return signedXdr;
    } catch (error) {
      if (error instanceof Error) {
        // Check for user rejection
        if (error.message.includes('User declined')) {
          throw new Error('Transaction rejected by user');
        }
        throw new Error(`Transaction signing failed: ${error.message}`);
      }
      throw new Error('Transaction signing failed');
    }
  }

  /**
   * Get the current public key from Freighter
   * 
   * @returns Public key string
   * @throws Error if Freighter is not installed or fails to get key
   */
  async getPublicKey(): Promise<string> {
    if (!await this.isInstalled()) {
      throw new Error('Freighter wallet is not installed');
    }

    try {
      const publicKey = await window.freighter!.getPublicKey();
      
      if (!publicKey) {
        throw new Error('Failed to get public key from Freighter');
      }

      return publicKey;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get public key: ${error.message}`);
      }
      throw new Error('Failed to get public key');
    }
  }
}
