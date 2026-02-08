import * as StellarSdk from '@stellar/stellar-sdk';
import { WalletProvider, WalletConnection, WalletState, WalletProviderType } from '../types';
import { FreighterAdapter } from '../adapters/FreighterAdapter';
import { AlbedoAdapter } from '../adapters/AlbedoAdapter';
import { StorageService } from './StorageService';
import { STELLAR_CONFIG } from '../config/stellar';

/**
 * WalletService manages wallet connections, disconnections, and state
 * 
 * Provides a unified interface for connecting to multiple wallet providers
 * (Freighter, Albedo), fetching balances, and persisting connection state.
 */
export class WalletService {
  private providers: Map<WalletProviderType, WalletProvider>;
  private storageService: StorageService;
  private state: WalletState;
  private server: StellarSdk.Horizon.Server;

  constructor() {
    this.providers = new Map();
    this.providers.set('freighter', new FreighterAdapter());
    this.providers.set('albedo', new AlbedoAdapter());
    
    this.storageService = new StorageService();
    
    this.state = {
      isConnected: false,
      connection: null,
      balance: '0',
      error: null,
    };

    this.server = new StellarSdk.Horizon.Server(STELLAR_CONFIG.horizonUrl);
  }

  /**
   * Detect available wallet providers
   * 
   * @returns Array of installed wallet providers
   */
  async detectWallets(): Promise<WalletProvider[]> {
    const available: WalletProvider[] = [];

    for (const [, provider] of this.providers) {
      try {
        if (await provider.isInstalled()) {
          available.push(provider);
        }
      } catch (error) {
        console.warn(`Failed to detect ${provider.name}:`, error);
      }
    }

    return available;
  }

  /**
   * Connect to a specific wallet provider
   * 
   * @param providerName - Name of the wallet provider to connect to
   * @returns Wallet connection details
   * @throws Error if provider not found or connection fails
   */
  async connect(providerName: WalletProviderType): Promise<WalletConnection> {
    const provider = this.providers.get(providerName);
    
    if (!provider) {
      throw new Error(`Wallet provider ${providerName} not found`);
    }

    try {
      // Check if provider is installed
      if (!await provider.isInstalled()) {
        throw new Error(`${providerName} wallet is not installed`);
      }

      // Connect to wallet
      const connection = await provider.connect();

      // Fetch balance
      const balance = await this.fetchBalance(connection.publicKey);

      // Update state
      this.state = {
        isConnected: true,
        connection,
        balance,
        error: null,
      };

      // Persist connection
      this.storageService.setWalletConnection(connection);

      return connection;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      this.state = {
        ...this.state,
        isConnected: false,
        connection: null,
        error: errorMessage,
      };
      throw error;
    }
  }

  /**
   * Disconnect current wallet
   */
  async disconnect(): Promise<void> {
    if (this.state.connection) {
      const provider = this.providers.get(this.state.connection.provider);
      if (provider) {
        try {
          await provider.disconnect();
        } catch (error) {
          console.warn('Disconnect error:', error);
        }
      }
    }

    // Clear state
    this.state = {
      isConnected: false,
      connection: null,
      balance: '0',
      error: null,
    };

    // Clear persisted connection
    this.storageService.clearWalletConnection();
  }

  /**
   * Get current wallet state
   * 
   * @returns Current wallet state
   */
  getState(): WalletState {
    return { ...this.state };
  }

  /**
   * Fetch XLM balance for a public key
   * 
   * @param publicKey - Stellar public key
   * @returns Balance in stroops as string
   */
  async fetchBalance(publicKey: string): Promise<string> {
    try {
      const account = await this.server.loadAccount(publicKey);
      
      // Find XLM balance (native asset)
      const xlmBalance = account.balances.find(
        (balance) => balance.asset_type === 'native'
      );

      if (!xlmBalance || !('balance' in xlmBalance)) {
        return '0';
      }

      // Convert to stroops (1 XLM = 10,000,000 stroops)
      const balanceInXlm = parseFloat(xlmBalance.balance);
      const balanceInStroops = Math.floor(balanceInXlm * 10_000_000);

      return balanceInStroops.toString();
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      
      // If account doesn't exist, return 0
      if (error instanceof Error && error.message.includes('404')) {
        return '0';
      }
      
      throw new Error('Failed to fetch balance');
    }
  }

  /**
   * Restore connection from local storage
   * 
   * Attempts to reconnect using stored wallet connection data
   * 
   * @returns Wallet connection if successful, null otherwise
   */
  async restoreConnection(): Promise<WalletConnection | null> {
    try {
      // Check if there's a stored connection
      if (!this.storageService.hasStoredConnection()) {
        return null;
      }

      const storedConnection = this.storageService.getWalletConnection();
      
      if (!storedConnection) {
        return null;
      }

      // Get the provider
      const provider = this.providers.get(storedConnection.provider);
      
      if (!provider) {
        console.warn('Stored provider not found:', storedConnection.provider);
        this.storageService.clearWalletConnection();
        return null;
      }

      // Check if provider is still installed
      if (!await provider.isInstalled()) {
        console.warn('Stored provider no longer installed:', storedConnection.provider);
        this.storageService.clearWalletConnection();
        return null;
      }

      // Verify the connection is still valid by fetching the public key
      try {
        const currentPublicKey = await provider.getPublicKey();
        
        // If the public key changed, clear the stored connection
        if (currentPublicKey !== storedConnection.publicKey) {
          console.warn('Wallet address changed');
          this.storageService.clearWalletConnection();
          return null;
        }
      } catch (error) {
        console.warn('Failed to verify stored connection:', error);
        this.storageService.clearWalletConnection();
        return null;
      }

      // Fetch balance
      const balance = await this.fetchBalance(storedConnection.publicKey);

      // Update state
      this.state = {
        isConnected: true,
        connection: storedConnection,
        balance,
        error: null,
      };

      return storedConnection;
    } catch (error) {
      console.error('Failed to restore connection:', error);
      this.storageService.clearWalletConnection();
      return null;
    }
  }

  /**
   * Get the wallet provider for the current connection
   * 
   * @returns Wallet provider if connected, null otherwise
   */
  getCurrentProvider(): WalletProvider | null {
    if (!this.state.connection) {
      return null;
    }
    return this.providers.get(this.state.connection.provider) || null;
  }

  /**
   * Refresh the current wallet balance
   * 
   * @throws Error if not connected or fetch fails
   */
  async refreshBalance(): Promise<string> {
    if (!this.state.connection) {
      throw new Error('No wallet connected');
    }

    const balance = await this.fetchBalance(this.state.connection.publicKey);
    this.state.balance = balance;
    
    return balance;
  }
}
