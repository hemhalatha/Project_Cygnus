/**
 * Unit Tests for XDR Serialization
 */

import { describe, it, expect } from 'vitest';
import * as StellarSdk from '@stellar/stellar-sdk';
import {
  encodeTransaction,
  decodeTransactionFromXDR,
  validateXDR,
  Transaction,
  MemoType,
  AssetType,
} from '../../src/stellar/xdr/index.js';

describe('XDR Serialization', () => {
  const testSourceAccount = 'GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H';
  const testDestination = 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';

  describe('Transaction Encoding', () => {
    it('should encode a simple payment transaction', () => {
      const tx: Transaction = {
        sourceAccount: testSourceAccount,
        fee: 100,
        seqNum: '1',
        memo: { type: MemoType.MEMO_NONE },
        operations: [
          {
            body: {
              type: 1, // PAYMENT
              data: {
                destination: testDestination,
                asset: { type: AssetType.ASSET_TYPE_NATIVE },
                amount: '10',
              },
            },
          },
        ],
      };

      const xdr = encodeTransaction(tx);
      expect(xdr).toBeDefined();
      expect(typeof xdr).toBe('string');
      expect(xdr.length).toBeGreaterThan(0);
    });

    it('should encode a transaction with text memo', () => {
      const tx: Transaction = {
        sourceAccount: testSourceAccount,
        fee: 100,
        seqNum: '1',
        memo: {
          type: MemoType.MEMO_TEXT,
          value: 'Test payment',
        },
        operations: [
          {
            body: {
              type: 1,
              data: {
                destination: testDestination,
                asset: { type: AssetType.ASSET_TYPE_NATIVE },
                amount: '10',
              },
            },
          },
        ],
      };

      const xdr = encodeTransaction(tx);
      expect(xdr).toBeDefined();
      expect(validateXDR(xdr)).toBe(false); // Will be false until we add signatures
    });

    it('should encode a transaction with time bounds', () => {
      const now = Math.floor(Date.now() / 1000);
      const tx: Transaction = {
        sourceAccount: testSourceAccount,
        fee: 100,
        seqNum: '1',
        timeBounds: {
          minTime: now.toString(),
          maxTime: (now + 300).toString(),
        },
        memo: { type: MemoType.MEMO_NONE },
        operations: [
          {
            body: {
              type: 1,
              data: {
                destination: testDestination,
                asset: { type: AssetType.ASSET_TYPE_NATIVE },
                amount: '10',
              },
            },
          },
        ],
      };

      const xdr = encodeTransaction(tx);
      expect(xdr).toBeDefined();
    });
  });

  describe('Transaction Decoding', () => {
    it('should decode an encoded transaction', () => {
      // Create a transaction using Stellar SDK
      const sourceKeypair = StellarSdk.Keypair.fromSecret(
        'SCZANGBA5YHTNYVVV4C3U252E2B6P6F5T3U6MM63WBSBZATAQI3EBTQ4'
      );
      
      const account = new StellarSdk.Account(sourceKeypair.publicKey(), '1');
      
      const transaction = new StellarSdk.TransactionBuilder(account, {
        fee: '100',
        networkPassphrase: StellarSdk.Networks.TESTNET,
      })
        .addOperation(
          StellarSdk.Operation.payment({
            destination: testDestination,
            asset: StellarSdk.Asset.native(),
            amount: '10',
          })
        )
        .setTimeout(30)
        .build();

      const xdr = transaction.toXDR('base64');
      const decoded = decodeTransactionFromXDR(xdr);

      expect(decoded).toBeDefined();
      expect(decoded.sourceAccount).toBe(sourceKeypair.publicKey());
      expect(decoded.fee).toBe(100);
      expect(decoded.operations).toHaveLength(1);
    });

    it('should decode transaction with memo', () => {
      const sourceKeypair = StellarSdk.Keypair.fromSecret(
        'SCZANGBA5YHTNYVVV4C3U252E2B6P6F5T3U6MM63WBSBZATAQI3EBTQ4'
      );
      
      const account = new StellarSdk.Account(sourceKeypair.publicKey(), '1');
      
      const transaction = new StellarSdk.TransactionBuilder(account, {
        fee: '100',
        networkPassphrase: StellarSdk.Networks.TESTNET,
      })
        .addMemo(StellarSdk.Memo.text('Test memo'))
        .addOperation(
          StellarSdk.Operation.payment({
            destination: testDestination,
            asset: StellarSdk.Asset.native(),
            amount: '10',
          })
        )
        .setTimeout(30)
        .build();

      const xdr = transaction.toXDR('base64');
      const decoded = decodeTransactionFromXDR(xdr);

      expect(decoded.memo.type).toBe(MemoType.MEMO_TEXT);
      expect(decoded.memo.value).toBe('Test memo');
    });
  });

  describe('XDR Validation', () => {
    it('should validate correct XDR', () => {
      const sourceKeypair = StellarSdk.Keypair.fromSecret(
        'SCZANGBA5YHTNYVVV4C3U252E2B6P6F5T3U6MM63WBSBZATAQI3EBTQ4'
      );
      
      const account = new StellarSdk.Account(sourceKeypair.publicKey(), '1');
      
      const transaction = new StellarSdk.TransactionBuilder(account, {
        fee: '100',
        networkPassphrase: StellarSdk.Networks.TESTNET,
      })
        .addOperation(
          StellarSdk.Operation.payment({
            destination: testDestination,
            asset: StellarSdk.Asset.native(),
            amount: '10',
          })
        )
        .setTimeout(30)
        .build();

      transaction.sign(sourceKeypair);
      const xdr = transaction.toEnvelope().toXDR('base64');

      expect(validateXDR(xdr)).toBe(true);
    });

    it('should reject invalid XDR', () => {
      expect(validateXDR('invalid-xdr-string')).toBe(false);
      expect(validateXDR('')).toBe(false);
      expect(validateXDR('AAAA')).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty operations array', () => {
      const tx: Transaction = {
        sourceAccount: testSourceAccount,
        fee: 100,
        seqNum: '1',
        memo: { type: MemoType.MEMO_NONE },
        operations: [],
      };

      expect(() => encodeTransaction(tx)).toThrow();
    });

    it('should handle large sequence numbers', () => {
      const tx: Transaction = {
        sourceAccount: testSourceAccount,
        fee: 100,
        seqNum: '9999999999999',
        memo: { type: MemoType.MEMO_NONE },
        operations: [
          {
            body: {
              type: 1,
              data: {
                destination: testDestination,
                asset: { type: AssetType.ASSET_TYPE_NATIVE },
                amount: '10',
              },
            },
          },
        ],
      };

      const xdr = encodeTransaction(tx);
      expect(xdr).toBeDefined();
    });

    it('should handle maximum fee value', () => {
      const tx: Transaction = {
        sourceAccount: testSourceAccount,
        fee: 4294967295, // Max uint32
        seqNum: '1',
        memo: { type: MemoType.MEMO_NONE },
        operations: [
          {
            body: {
              type: 1,
              data: {
                destination: testDestination,
                asset: { type: AssetType.ASSET_TYPE_NATIVE },
                amount: '10',
              },
            },
          },
        ],
      };

      const xdr = encodeTransaction(tx);
      expect(xdr).toBeDefined();
    });
  });
});
