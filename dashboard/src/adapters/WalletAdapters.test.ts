import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FreighterAdapter } from './FreighterAdapter';
import { AlbedoAdapter } from './AlbedoAdapter';

describe('FreighterAdapter', () => {
  let adapter: FreighterAdapter;
  let mockFreighter: any;

  beforeEach(() => {
    adapter = new FreighterAdapter();
    
    // Mock Freighter API
    mockFreighter = {
      isConnected: vi.fn(),
      getPublicKey: vi.fn(),
      signTransaction: vi.fn(),
    };
    
    (global as any).window = {
      freighter: mockFreighter,
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('isInstalled', () => {
    it('should return true when Freighter is installed', async () => {
      const installed = await adapter.isInstalled();
      expect(installed).toBe(true);
    });

    it('should return false when Freighter is not installed', async () => {
      delete (global as any).window.freighter;
      const installed = await adapter.isInstalled();
      expect(installed).toBe(false);
    });
  });

  describe('connect', () => {
    it('should connect and return wallet connection', async () => {
      mockFreighter.getPublicKey.mockResolvedValue('GTEST123456789');

      const connection = await adapter.connect();

      expect(connection).toEqual({
        publicKey: 'GTEST123456789',
        provider: 'freighter',
      });
      expect(mockFreighter.getPublicKey).toHaveBeenCalled();
    });

    it('should throw error when Freighter is not installed', async () => {
      delete (global as any).window.freighter;

      await expect(adapter.connect()).rejects.toThrow('Freighter wallet is not installed');
    });

    it('should throw error when getPublicKey fails', async () => {
      mockFreighter.getPublicKey.mockRejectedValue(new Error('User rejected'));

      await expect(adapter.connect()).rejects.toThrow('Freighter connection failed');
    });

    it('should throw error when getPublicKey returns empty', async () => {
      mockFreighter.getPublicKey.mockResolvedValue('');

      await expect(adapter.connect()).rejects.toThrow('Failed to get public key from Freighter');
    });
  });

  describe('signTransaction', () => {
    it('should sign transaction and return signed XDR', async () => {
      const xdr = 'AAAA...';
      const signedXdr = 'BBBB...';
      mockFreighter.signTransaction.mockResolvedValue(signedXdr);

      const result = await adapter.signTransaction(xdr);

      expect(result).toBe(signedXdr);
      expect(mockFreighter.signTransaction).toHaveBeenCalledWith(xdr, {
        networkPassphrase: 'Test SDF Network ; September 2015',
      });
    });

    it('should throw error when user declines', async () => {
      mockFreighter.signTransaction.mockRejectedValue(new Error('User declined'));

      await expect(adapter.signTransaction('AAAA...')).rejects.toThrow('Transaction rejected by user');
    });

    it('should throw error when Freighter is not installed', async () => {
      delete (global as any).window.freighter;

      await expect(adapter.signTransaction('AAAA...')).rejects.toThrow('Freighter wallet is not installed');
    });
  });

  describe('getPublicKey', () => {
    it('should return public key', async () => {
      mockFreighter.getPublicKey.mockResolvedValue('GTEST123456789');

      const publicKey = await adapter.getPublicKey();

      expect(publicKey).toBe('GTEST123456789');
    });

    it('should throw error when Freighter is not installed', async () => {
      delete (global as any).window.freighter;

      await expect(adapter.getPublicKey()).rejects.toThrow('Freighter wallet is not installed');
    });
  });
});

describe('AlbedoAdapter', () => {
  let adapter: AlbedoAdapter;
  let mockAlbedo: any;

  beforeEach(() => {
    adapter = new AlbedoAdapter();
    
    // Mock Albedo API
    mockAlbedo = {
      publicKey: vi.fn(),
      tx: vi.fn(),
    };
    
    (global as any).window = {
      albedo: mockAlbedo,
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('isInstalled', () => {
    it('should return true when Albedo is available', async () => {
      const installed = await adapter.isInstalled();
      expect(installed).toBe(true);
    });

    it('should return false when Albedo is not available', async () => {
      delete (global as any).window.albedo;
      const installed = await adapter.isInstalled();
      expect(installed).toBe(false);
    });
  });

  describe('connect', () => {
    it('should connect and return wallet connection', async () => {
      mockAlbedo.publicKey.mockResolvedValue({ pubkey: 'GALBEDO123456' });

      const connection = await adapter.connect();

      expect(connection).toEqual({
        publicKey: 'GALBEDO123456',
        provider: 'albedo',
      });
      expect(mockAlbedo.publicKey).toHaveBeenCalled();
    });

    it('should throw error when Albedo is not available', async () => {
      delete (global as any).window.albedo;

      await expect(adapter.connect()).rejects.toThrow('Albedo wallet is not available');
    });

    it('should throw error when publicKey fails', async () => {
      mockAlbedo.publicKey.mockRejectedValue(new Error('Connection failed'));

      await expect(adapter.connect()).rejects.toThrow('Albedo connection failed');
    });

    it('should throw error when publicKey returns empty', async () => {
      mockAlbedo.publicKey.mockResolvedValue({ pubkey: '' });

      await expect(adapter.connect()).rejects.toThrow('Failed to get public key from Albedo');
    });
  });

  describe('signTransaction', () => {
    it('should sign transaction and return signed XDR', async () => {
      const xdr = 'AAAA...';
      const signedXdr = 'BBBB...';
      mockAlbedo.tx.mockResolvedValue({
        signed_envelope_xdr: signedXdr,
        tx_hash: 'hash123',
      });

      const result = await adapter.signTransaction(xdr);

      expect(result).toBe(signedXdr);
      expect(mockAlbedo.tx).toHaveBeenCalledWith({
        xdr,
        network: 'testnet',
        submit: false,
      });
    });

    it('should throw error when user cancels', async () => {
      mockAlbedo.tx.mockRejectedValue(new Error('User canceled'));

      await expect(adapter.signTransaction('AAAA...')).rejects.toThrow('Transaction rejected by user');
    });

    it('should throw error when Albedo is not available', async () => {
      delete (global as any).window.albedo;

      await expect(adapter.signTransaction('AAAA...')).rejects.toThrow('Albedo wallet is not available');
    });
  });

  describe('getPublicKey', () => {
    it('should return public key', async () => {
      mockAlbedo.publicKey.mockResolvedValue({ pubkey: 'GALBEDO123456' });

      const publicKey = await adapter.getPublicKey();

      expect(publicKey).toBe('GALBEDO123456');
    });

    it('should throw error when Albedo is not available', async () => {
      delete (global as any).window.albedo;

      await expect(adapter.getPublicKey()).rejects.toThrow('Albedo wallet is not available');
    });
  });
});
