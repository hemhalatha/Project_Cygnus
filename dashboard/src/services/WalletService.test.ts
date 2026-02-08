import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WalletService } from './WalletService';
import { WalletConnection } from '../types';

// Mock modules
const mockLoadAccount = vi.fn();
const mockFreighterAdapter = {
  name: 'freighter',
  isInstalled: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
  getPublicKey: vi.fn(),
  signTransaction: vi.fn(),
};

const mockAlbedoAdapter = {
  name: 'albedo',
  isInstalled: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
  getPublicKey: vi.fn(),
  signTransaction: vi.fn(),
};

const mockStorageService = {
  setWalletConnection: vi.fn(),
  getWalletConnection: vi.fn(),
  clearWalletConnection: vi.fn(),
  hasStoredConnection: vi.fn(),
};

vi.mock('@stellar/stellar-sdk', () => ({
  Horizon: {
    Server: vi.fn().mockImplementation(() => ({
      loadAccount: mockLoadAccount,
    })),
  },
}));

vi.mock('../adapters/FreighterAdapter', () => ({
  FreighterAdapter: vi.fn().mockImplementation(() => mockFreighterAdapter),
}));

vi.mock('../adapters/AlbedoAdapter', () => ({
  AlbedoAdapter: vi.fn().mockImplementation(() => mockAlbedoAdapter),
}));

vi.mock('./StorageService', () => ({
  StorageService: vi.fn().mockImplementation(() => mockStorageService),
}));

describe('WalletService', () => {
  let walletService: WalletService;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Setup default mock implementations
    mockFreighterAdapter.isInstalled.mockResolvedValue(true);
    mockAlbedoAdapter.isInstalled.mockResolvedValue(true);
    mockStorageService.hasStoredConnection.mockReturnValue(false);
    
    // Create wallet service
    walletService = new WalletService();
  });

  describe('detectWallets', () => {
    it('should detect both Freighter and Albedo when installed', async () => {
      mockFreighterAdapter.isInstalled.mockResolvedValue(true);
      mockAlbedoAdapter.isInstalled.mockResolvedValue(true);

      const wallets = await walletService.detectWallets();

      expect(wallets).toHaveLength(2);
      expect(wallets.map(w => w.name)).toContain('freighter');
      expect(wallets.map(w => w.name)).toContain('albedo');
    });

    it('should detect only Freighter when Albedo is not installed', async () => {
      mockFreighterAdapter.isInstalled.mockResolvedValue(true);
      mockAlbedoAdapter.isInstalled.mockResolvedValue(false);

      const wallets = await walletService.detectWallets();

      expect(wallets).toHaveLength(1);
      expect(wallets[0].name).toBe('freighter');
    });

    it('should detect only Albedo when Freighter is not installed', async () => {
      mockFreighterAdapter.isInstalled.mockResolvedValue(false);
      mockAlbedoAdapter.isInstalled.mockResolvedValue(true);

      const wallets = await walletService.detectWallets();

      expect(wallets).toHaveLength(1);
      expect(wallets[0].name).toBe('albedo');
    });

    it('should return empty array when no wallets are installed', async () => {
      mockFreighterAdapter.isInstalled.mockResolvedValue(false);
      mockAlbedoAdapter.isInstalled.mockResolvedValue(false);

      const wallets = await walletService.detectWallets();

      expect(wallets).toHaveLength(0);
    });

    it('should handle detection errors gracefully', async () => {
      mockFreighterAdapter.isInstalled.mockRejectedValue(new Error('Detection failed'));
      mockAlbedoAdapter.isInstalled.mockResolvedValue(true);

      const wallets = await walletService.detectWallets();

      expect(wallets).toHaveLength(1);
      expect(wallets[0].name).toBe('albedo');
    });
  });

  describe('connect', () => {
    const mockConnection: WalletConnection = {
      publicKey: 'GTEST123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      provider: 'freighter',
    };

    beforeEach(() => {
      mockLoadAccount.mockResolvedValue({
        balances: [
          {
            asset_type: 'native',
            balance: '100.5000000',
          },
        ],
      });
    });

    it('should connect to Freighter successfully', async () => {
      mockFreighterAdapter.connect.mockResolvedValue(mockConnection);

      const connection = await walletService.connect('freighter');

      expect(connection).toEqual(mockConnection);
      expect(mockFreighterAdapter.isInstalled).toHaveBeenCalled();
      expect(mockFreighterAdapter.connect).toHaveBeenCalled();
      expect(mockStorageService.setWalletConnection).toHaveBeenCalledWith(mockConnection);
    });

    it('should connect to Albedo successfully', async () => {
      const albedoConnection: WalletConnection = {
        publicKey: 'GALBEDO123456789',
        provider: 'albedo',
      };
      mockAlbedoAdapter.connect.mockResolvedValue(albedoConnection);

      const connection = await walletService.connect('albedo');

      expect(connection).toEqual(albedoConnection);
      expect(mockAlbedoAdapter.isInstalled).toHaveBeenCalled();
      expect(mockAlbedoAdapter.connect).toHaveBeenCalled();
    });

    it('should fetch and store balance after connection', async () => {
      mockFreighterAdapter.connect.mockResolvedValue(mockConnection);

      await walletService.connect('freighter');

      const state = walletService.getState();
      expect(state.balance).toBe('1005000000');
      expect(mockLoadAccount).toHaveBeenCalledWith(mockConnection.publicKey);
    });

    it('should update state to connected', async () => {
      mockFreighterAdapter.connect.mockResolvedValue(mockConnection);

      await walletService.connect('freighter');

      const state = walletService.getState();
      expect(state.isConnected).toBe(true);
      expect(state.connection).toEqual(mockConnection);
      expect(state.error).toBeNull();
    });

    it('should throw error for unknown provider', async () => {
      await expect(walletService.connect('unknown' as any)).rejects.toThrow(
        'Wallet provider unknown not found'
      );
    });

    it('should throw error when provider is not installed', async () => {
      mockFreighterAdapter.isInstalled.mockResolvedValue(false);

      await expect(walletService.connect('freighter')).rejects.toThrow(
        'freighter wallet is not installed'
      );
    });

    it('should handle connection failure', async () => {
      mockFreighterAdapter.connect.mockRejectedValue(new Error('User rejected'));

      await expect(walletService.connect('freighter')).rejects.toThrow('User rejected');

      const state = walletService.getState();
      expect(state.isConnected).toBe(false);
      expect(state.connection).toBeNull();
      expect(state.error).toBe('User rejected');
    });

    it('should handle balance fetch failure', async () => {
      mockFreighterAdapter.connect.mockResolvedValue(mockConnection);
      mockLoadAccount.mockRejectedValue(new Error('Network error'));

      await expect(walletService.connect('freighter')).rejects.toThrow();
    });
  });

  describe('disconnect', () => {
    beforeEach(async () => {
      const mockConnection: WalletConnection = {
        publicKey: 'GTEST123456789',
        provider: 'freighter',
      };
      
      mockFreighterAdapter.connect.mockResolvedValue(mockConnection);
      mockLoadAccount.mockResolvedValue({
        balances: [{ asset_type: 'native', balance: '100.0000000' }],
      });

      await walletService.connect('freighter');
    });

    it('should disconnect wallet successfully', async () => {
      await walletService.disconnect();

      expect(mockFreighterAdapter.disconnect).toHaveBeenCalled();
      expect(mockStorageService.clearWalletConnection).toHaveBeenCalled();
    });

    it('should clear wallet state', async () => {
      await walletService.disconnect();

      const state = walletService.getState();
      expect(state.isConnected).toBe(false);
      expect(state.connection).toBeNull();
      expect(state.balance).toBe('0');
      expect(state.error).toBeNull();
    });

    it('should handle disconnect errors gracefully', async () => {
      mockFreighterAdapter.disconnect.mockRejectedValue(new Error('Disconnect failed'));

      await expect(walletService.disconnect()).resolves.not.toThrow();

      const state = walletService.getState();
      expect(state.isConnected).toBe(false);
    });

    it('should work when no wallet is connected', async () => {
      await walletService.disconnect();
      await expect(walletService.disconnect()).resolves.not.toThrow();
    });
  });

  describe('getState', () => {
    it('should return initial disconnected state', () => {
      const state = walletService.getState();

      expect(state).toEqual({
        isConnected: false,
        connection: null,
        balance: '0',
        error: null,
      });
    });

    it('should return connected state after connection', async () => {
      const mockConnection: WalletConnection = {
        publicKey: 'GTEST123456789',
        provider: 'freighter',
      };
      
      mockFreighterAdapter.connect.mockResolvedValue(mockConnection);
      mockLoadAccount.mockResolvedValue({
        balances: [{ asset_type: 'native', balance: '50.0000000' }],
      });

      await walletService.connect('freighter');
      const state = walletService.getState();

      expect(state.isConnected).toBe(true);
      expect(state.connection).toEqual(mockConnection);
      expect(state.balance).toBe('500000000');
    });

    it('should return a copy of state (not reference)', () => {
      const state1 = walletService.getState();
      const state2 = walletService.getState();

      expect(state1).not.toBe(state2);
      expect(state1).toEqual(state2);
    });
  });

  describe('fetchBalance', () => {
    it('should fetch XLM balance successfully', async () => {
      mockLoadAccount.mockResolvedValue({
        balances: [
          {
            asset_type: 'native',
            balance: '123.4567890',
          },
        ],
      });

      const balance = await walletService.fetchBalance('GTEST123456789');

      expect(balance).toBe('1234567890');
      expect(mockLoadAccount).toHaveBeenCalledWith('GTEST123456789');
    });

    it('should return 0 for account with no balance', async () => {
      mockLoadAccount.mockResolvedValue({
        balances: [],
      });

      const balance = await walletService.fetchBalance('GTEST123456789');

      expect(balance).toBe('0');
    });

    it('should return 0 for non-existent account (404)', async () => {
      const error = new Error('Request failed with status code 404');
      mockLoadAccount.mockRejectedValue(error);

      const balance = await walletService.fetchBalance('GTEST123456789');

      expect(balance).toBe('0');
    });

    it('should handle fractional XLM amounts correctly', async () => {
      mockLoadAccount.mockResolvedValue({
        balances: [
          {
            asset_type: 'native',
            balance: '0.0000001',
          },
        ],
      });

      const balance = await walletService.fetchBalance('GTEST123456789');

      expect(balance).toBe('1');
    });

    it('should handle large XLM amounts', async () => {
      mockLoadAccount.mockResolvedValue({
        balances: [
          {
            asset_type: 'native',
            balance: '1000000.0000000',
          },
        ],
      });

      const balance = await walletService.fetchBalance('GTEST123456789');

      expect(balance).toBe('10000000000000');
    });
  });

  describe('restoreConnection', () => {
    const storedConnection: WalletConnection = {
      publicKey: 'GTEST123456789',
      provider: 'freighter',
    };

    it('should restore connection successfully', async () => {
      mockStorageService.hasStoredConnection.mockReturnValue(true);
      mockStorageService.getWalletConnection.mockReturnValue(storedConnection);
      mockFreighterAdapter.getPublicKey.mockResolvedValue('GTEST123456789');
      mockLoadAccount.mockResolvedValue({
        balances: [{ asset_type: 'native', balance: '75.0000000' }],
      });

      const connection = await walletService.restoreConnection();

      expect(connection).toEqual(storedConnection);
      expect(mockFreighterAdapter.isInstalled).toHaveBeenCalled();
      expect(mockFreighterAdapter.getPublicKey).toHaveBeenCalled();
      
      const state = walletService.getState();
      expect(state.isConnected).toBe(true);
      expect(state.connection).toEqual(storedConnection);
      expect(state.balance).toBe('750000000');
    });

    it('should return null when no stored connection exists', async () => {
      mockStorageService.hasStoredConnection.mockReturnValue(false);

      const connection = await walletService.restoreConnection();

      expect(connection).toBeNull();
    });

    it('should return null when stored connection is null', async () => {
      mockStorageService.hasStoredConnection.mockReturnValue(true);
      mockStorageService.getWalletConnection.mockReturnValue(null);

      const connection = await walletService.restoreConnection();

      expect(connection).toBeNull();
    });

    it('should clear storage when provider is no longer installed', async () => {
      mockStorageService.hasStoredConnection.mockReturnValue(true);
      mockStorageService.getWalletConnection.mockReturnValue(storedConnection);
      mockFreighterAdapter.isInstalled.mockResolvedValue(false);

      const connection = await walletService.restoreConnection();

      expect(connection).toBeNull();
      expect(mockStorageService.clearWalletConnection).toHaveBeenCalled();
    });

    it('should clear storage when wallet address changed', async () => {
      mockStorageService.hasStoredConnection.mockReturnValue(true);
      mockStorageService.getWalletConnection.mockReturnValue(storedConnection);
      mockFreighterAdapter.getPublicKey.mockResolvedValue('GDIFFERENT123456789');

      const connection = await walletService.restoreConnection();

      expect(connection).toBeNull();
      expect(mockStorageService.clearWalletConnection).toHaveBeenCalled();
    });

    it('should clear storage when verification fails', async () => {
      mockStorageService.hasStoredConnection.mockReturnValue(true);
      mockStorageService.getWalletConnection.mockReturnValue(storedConnection);
      mockFreighterAdapter.getPublicKey.mockRejectedValue(new Error('Verification failed'));

      const connection = await walletService.restoreConnection();

      expect(connection).toBeNull();
      expect(mockStorageService.clearWalletConnection).toHaveBeenCalled();
    });

    it('should handle balance fetch failure during restore', async () => {
      mockStorageService.hasStoredConnection.mockReturnValue(true);
      mockStorageService.getWalletConnection.mockReturnValue(storedConnection);
      mockFreighterAdapter.getPublicKey.mockResolvedValue('GTEST123456789');
      mockLoadAccount.mockRejectedValue(new Error('Network error'));

      const connection = await walletService.restoreConnection();

      expect(connection).toBeNull();
      expect(mockStorageService.clearWalletConnection).toHaveBeenCalled();
    });
  });

  describe('getCurrentProvider', () => {
    it('should return null when not connected', () => {
      const provider = walletService.getCurrentProvider();
      expect(provider).toBeNull();
    });

    it('should return current provider when connected', async () => {
      const mockConnection: WalletConnection = {
        publicKey: 'GTEST123456789',
        provider: 'freighter',
      };
      
      mockFreighterAdapter.connect.mockResolvedValue(mockConnection);
      mockLoadAccount.mockResolvedValue({
        balances: [{ asset_type: 'native', balance: '100.0000000' }],
      });

      await walletService.connect('freighter');
      const provider = walletService.getCurrentProvider();

      expect(provider).toBe(mockFreighterAdapter);
      expect(provider?.name).toBe('freighter');
    });

    it('should return Albedo provider when connected to Albedo', async () => {
      const mockConnection: WalletConnection = {
        publicKey: 'GALBEDO123456789',
        provider: 'albedo',
      };
      
      mockAlbedoAdapter.connect.mockResolvedValue(mockConnection);
      mockLoadAccount.mockResolvedValue({
        balances: [{ asset_type: 'native', balance: '50.0000000' }],
      });

      await walletService.connect('albedo');
      const provider = walletService.getCurrentProvider();

      expect(provider).toBe(mockAlbedoAdapter);
      expect(provider?.name).toBe('albedo');
    });
  });

  describe('refreshBalance', () => {
    beforeEach(async () => {
      const mockConnection: WalletConnection = {
        publicKey: 'GTEST123456789',
        provider: 'freighter',
      };
      
      mockFreighterAdapter.connect.mockResolvedValue(mockConnection);
      mockLoadAccount.mockResolvedValue({
        balances: [{ asset_type: 'native', balance: '100.0000000' }],
      });

      await walletService.connect('freighter');
    });

    it('should refresh balance successfully', async () => {
      mockLoadAccount.mockResolvedValue({
        balances: [{ asset_type: 'native', balance: '200.0000000' }],
      });

      const balance = await walletService.refreshBalance();

      expect(balance).toBe('2000000000');
      
      const state = walletService.getState();
      expect(state.balance).toBe('2000000000');
    });

    it('should throw error when not connected', async () => {
      await walletService.disconnect();

      await expect(walletService.refreshBalance()).rejects.toThrow('No wallet connected');
    });

    it('should update state with new balance', async () => {
      const initialState = walletService.getState();
      expect(initialState.balance).toBe('1000000000');

      mockLoadAccount.mockResolvedValue({
        balances: [{ asset_type: 'native', balance: '150.5000000' }],
      });

      await walletService.refreshBalance();

      const updatedState = walletService.getState();
      expect(updatedState.balance).toBe('1505000000');
    });
  });

  describe('integration scenarios', () => {
    it('should handle full connect-disconnect-reconnect flow', async () => {
      const mockConnection: WalletConnection = {
        publicKey: 'GTEST123456789',
        provider: 'freighter',
      };

      mockFreighterAdapter.connect.mockResolvedValue(mockConnection);
      mockLoadAccount.mockResolvedValue({
        balances: [{ asset_type: 'native', balance: '100.0000000' }],
      });

      await walletService.connect('freighter');
      expect(walletService.getState().isConnected).toBe(true);

      await walletService.disconnect();
      expect(walletService.getState().isConnected).toBe(false);

      await walletService.connect('freighter');
      expect(walletService.getState().isConnected).toBe(true);
    });

    it('should handle switching between wallet providers', async () => {
      const freighterConnection: WalletConnection = {
        publicKey: 'GFREIGHTER123',
        provider: 'freighter',
      };
      
      const albedoConnection: WalletConnection = {
        publicKey: 'GALBEDO123',
        provider: 'albedo',
      };

      mockLoadAccount.mockResolvedValue({
        balances: [{ asset_type: 'native', balance: '100.0000000' }],
      });

      mockFreighterAdapter.connect.mockResolvedValue(freighterConnection);
      await walletService.connect('freighter');
      expect(walletService.getState().connection?.provider).toBe('freighter');

      await walletService.disconnect();

      mockAlbedoAdapter.connect.mockResolvedValue(albedoConnection);
      await walletService.connect('albedo');
      expect(walletService.getState().connection?.provider).toBe('albedo');
    });
  });
});
