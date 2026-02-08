import { WalletConnection } from '../types';

/**
 * Storage keys for wallet data in browser local storage
 */
const STORAGE_KEYS = {
  WALLET_ADDRESS: 'wallet_address',
  WALLET_PROVIDER: 'wallet_provider',
  WALLET_CONNECTED: 'wallet_connected',
} as const;

/**
 * StorageService manages browser local storage for wallet state persistence
 * 
 * Handles storing, retrieving, and clearing wallet connection data to enable
 * persistent wallet connections across page refreshes.
 */
export class StorageService {
  /**
   * Store wallet connection data in local storage
   * 
   * @param connection - Wallet connection to persist
   */
  setWalletConnection(connection: WalletConnection): void {
    try {
      localStorage.setItem(STORAGE_KEYS.WALLET_ADDRESS, connection.publicKey);
      localStorage.setItem(STORAGE_KEYS.WALLET_PROVIDER, connection.provider);
      localStorage.setItem(STORAGE_KEYS.WALLET_CONNECTED, 'true');
    } catch (error) {
      console.error('Failed to store wallet connection:', error);
      throw new Error('Failed to persist wallet connection');
    }
  }

  /**
   * Retrieve wallet connection data from local storage
   * 
   * @returns Wallet connection if found, null otherwise
   */
  getWalletConnection(): WalletConnection | null {
    try {
      const address = localStorage.getItem(STORAGE_KEYS.WALLET_ADDRESS);
      const provider = localStorage.getItem(STORAGE_KEYS.WALLET_PROVIDER);
      const connected = localStorage.getItem(STORAGE_KEYS.WALLET_CONNECTED);

      if (!address || !provider || connected !== 'true') {
        return null;
      }

      if (provider !== 'freighter' && provider !== 'albedo') {
        console.warn('Invalid wallet provider in storage:', provider);
        return null;
      }

      return {
        publicKey: address,
        provider: provider as 'freighter' | 'albedo',
      };
    } catch (error) {
      console.error('Failed to retrieve wallet connection:', error);
      return null;
    }
  }

  /**
   * Clear wallet connection data from local storage
   */
  clearWalletConnection(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.WALLET_ADDRESS);
      localStorage.removeItem(STORAGE_KEYS.WALLET_PROVIDER);
      localStorage.removeItem(STORAGE_KEYS.WALLET_CONNECTED);
    } catch (error) {
      console.error('Failed to clear wallet connection:', error);
    }
  }

  /**
   * Check if wallet was previously connected
   * 
   * @returns True if stored connection exists, false otherwise
   */
  hasStoredConnection(): boolean {
    try {
      const connected = localStorage.getItem(STORAGE_KEYS.WALLET_CONNECTED);
      return connected === 'true';
    } catch (error) {
      console.error('Failed to check stored connection:', error);
      return false;
    }
  }
}
