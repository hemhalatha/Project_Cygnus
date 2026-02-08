import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { StorageService } from './StorageService';
import { WalletConnection } from '../types';

describe('StorageService', () => {
  let storageService: StorageService;
  let originalLocalStorage: Storage;

  beforeEach(() => {
    storageService = new StorageService();
    
    // Mock localStorage
    originalLocalStorage = global.localStorage;
    const store: Record<string, string> = {};
    
    global.localStorage = {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => { store[key] = value; },
      removeItem: (key: string) => { delete store[key]; },
      clear: () => { Object.keys(store).forEach(key => delete store[key]); },
      key: (index: number) => Object.keys(store)[index] || null,
      length: Object.keys(store).length,
    } as Storage;
  });

  afterEach(() => {
    global.localStorage = originalLocalStorage;
  });

  describe('setWalletConnection', () => {
    it('should store wallet connection data', () => {
      const connection: WalletConnection = {
        publicKey: 'GTEST123456789',
        provider: 'freighter',
      };

      storageService.setWalletConnection(connection);

      expect(localStorage.getItem('wallet_address')).toBe('GTEST123456789');
      expect(localStorage.getItem('wallet_provider')).toBe('freighter');
      expect(localStorage.getItem('wallet_connected')).toBe('true');
    });

    it('should store Albedo wallet connection', () => {
      const connection: WalletConnection = {
        publicKey: 'GALBEDO123456',
        provider: 'albedo',
      };

      storageService.setWalletConnection(connection);

      expect(localStorage.getItem('wallet_address')).toBe('GALBEDO123456');
      expect(localStorage.getItem('wallet_provider')).toBe('albedo');
      expect(localStorage.getItem('wallet_connected')).toBe('true');
    });
  });

  describe('getWalletConnection', () => {
    it('should retrieve stored wallet connection', () => {
      localStorage.setItem('wallet_address', 'GTEST123456789');
      localStorage.setItem('wallet_provider', 'freighter');
      localStorage.setItem('wallet_connected', 'true');

      const connection = storageService.getWalletConnection();

      expect(connection).toEqual({
        publicKey: 'GTEST123456789',
        provider: 'freighter',
      });
    });

    it('should return null when no connection is stored', () => {
      const connection = storageService.getWalletConnection();
      expect(connection).toBeNull();
    });

    it('should return null when wallet_connected is not true', () => {
      localStorage.setItem('wallet_address', 'GTEST123456789');
      localStorage.setItem('wallet_provider', 'freighter');
      localStorage.setItem('wallet_connected', 'false');

      const connection = storageService.getWalletConnection();
      expect(connection).toBeNull();
    });

    it('should return null when provider is invalid', () => {
      localStorage.setItem('wallet_address', 'GTEST123456789');
      localStorage.setItem('wallet_provider', 'invalid');
      localStorage.setItem('wallet_connected', 'true');

      const connection = storageService.getWalletConnection();
      expect(connection).toBeNull();
    });

    it('should return null when address is missing', () => {
      localStorage.setItem('wallet_provider', 'freighter');
      localStorage.setItem('wallet_connected', 'true');

      const connection = storageService.getWalletConnection();
      expect(connection).toBeNull();
    });
  });

  describe('clearWalletConnection', () => {
    it('should remove all wallet data from storage', () => {
      localStorage.setItem('wallet_address', 'GTEST123456789');
      localStorage.setItem('wallet_provider', 'freighter');
      localStorage.setItem('wallet_connected', 'true');

      storageService.clearWalletConnection();

      expect(localStorage.getItem('wallet_address')).toBeNull();
      expect(localStorage.getItem('wallet_provider')).toBeNull();
      expect(localStorage.getItem('wallet_connected')).toBeNull();
    });

    it('should not throw when clearing empty storage', () => {
      expect(() => storageService.clearWalletConnection()).not.toThrow();
    });
  });

  describe('hasStoredConnection', () => {
    it('should return true when wallet_connected is true', () => {
      localStorage.setItem('wallet_connected', 'true');
      expect(storageService.hasStoredConnection()).toBe(true);
    });

    it('should return false when wallet_connected is false', () => {
      localStorage.setItem('wallet_connected', 'false');
      expect(storageService.hasStoredConnection()).toBe(false);
    });

    it('should return false when wallet_connected is not set', () => {
      expect(storageService.hasStoredConnection()).toBe(false);
    });
  });

  describe('round trip', () => {
    it('should store and retrieve the same connection', () => {
      const connection: WalletConnection = {
        publicKey: 'GTEST123456789',
        provider: 'freighter',
      };

      storageService.setWalletConnection(connection);
      const retrieved = storageService.getWalletConnection();

      expect(retrieved).toEqual(connection);
    });
  });
});
