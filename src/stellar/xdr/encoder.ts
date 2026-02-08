/**
 * XDR Encoder
 *
 * Encodes Stellar transaction structures to XDR binary format.
 * XDR (External Data Representation) is defined by RFC 4506.
 */

import * as StellarSdk from '@stellar/stellar-sdk';
import {
  Transaction,
  Operation,
  Memo,
  MemoType,
  Asset,
  AssetType,
} from './types.js';

/**
 * Encodes a transaction envelope to XDR format
 */
export function encodeTransaction(tx: Transaction): string {
  try {
    // Validate operations array is not empty
    if (!tx.operations || tx.operations.length === 0) {
      throw new Error('Transaction must have at least one operation');
    }

    const account = new StellarSdk.Account(tx.sourceAccount, tx.seqNum);

    const txBuilder = new StellarSdk.TransactionBuilder(account, {
      fee: tx.fee.toString(),
      networkPassphrase: StellarSdk.Networks.TESTNET,
    });

    // Set timeout - either from timeBounds or use a default
    if (tx.timeBounds) {
      const timeout = parseInt(tx.timeBounds.maxTime) - parseInt(tx.timeBounds.minTime);
      txBuilder.setTimeout(timeout);
    } else {
      // Default timeout of 30 seconds if not specified
      txBuilder.setTimeout(30);
    }

    const memo = encodeMemo(tx.memo);
    if (memo) {
      txBuilder.addMemo(memo);
    }

    for (const op of tx.operations) {
      const stellarOp = encodeOperation(op);
      txBuilder.addOperation(stellarOp);
    }

    const transaction = txBuilder.build();
    return transaction.toXDR();
  } catch (error) {
    throw new Error(`Failed to encode transaction: ${error}`);
  }
}

/**
 * Encodes a memo to Stellar SDK memo format
 */
function encodeMemo(memo: Memo): StellarSdk.Memo | null {
  switch (memo.type) {
    case MemoType.MEMO_NONE:
      return StellarSdk.Memo.none();
    case MemoType.MEMO_TEXT:
      return StellarSdk.Memo.text(memo.value as string);
    case MemoType.MEMO_ID:
      return StellarSdk.Memo.id(memo.value as string);
    case MemoType.MEMO_HASH:
      return StellarSdk.Memo.hash(memo.value as Buffer);
    case MemoType.MEMO_RETURN:
      return StellarSdk.Memo.return(memo.value as Buffer);
    default:
      return null;
  }
}

/**
 * Encodes an operation to Stellar SDK operation format
 */
function encodeOperation(op: Operation): StellarSdk.Operation {
  // For now, we'll support payment operations as a starting point
  // Additional operation types can be added as needed

  const opData = op.body.data;

  switch (op.body.type) {
    case 1: // PAYMENT
      return StellarSdk.Operation.payment({
        destination: opData.destination,
        asset: encodeAsset(opData.asset),
        amount: opData.amount,
        source: op.sourceAccount,
      });

    default:
      throw new Error(`Unsupported operation type: ${op.body.type}`);
  }
}

/**
 * Encodes an asset to Stellar SDK asset format
 */
function encodeAsset(asset: Asset): StellarSdk.Asset {
  switch (asset.type) {
    case AssetType.ASSET_TYPE_NATIVE:
      return StellarSdk.Asset.native();

    case AssetType.ASSET_TYPE_CREDIT_ALPHANUM4:
    case AssetType.ASSET_TYPE_CREDIT_ALPHANUM12:
      if (!asset.code || !asset.issuer) {
        throw new Error('Asset code and issuer required for credit assets');
      }
      return new StellarSdk.Asset(asset.code, asset.issuer);

    default:
      throw new Error(`Unsupported asset type: ${asset.type}`);
  }
}

/**
 * Encodes raw data to XDR format
 */
export function encodeToXDR(data: any, type: string): string {
  try {
    // This is a simplified implementation
    // In production, you'd need to handle all XDR types
    switch (type) {
      case 'TransactionEnvelope':
        return data.toXDR('base64');

      case 'Transaction':
        return data.toXDR('base64');

      default:
        throw new Error(`Unsupported XDR type: ${type}`);
    }
  } catch (error) {
    throw new Error(`Failed to encode to XDR: ${error}`);
  }
}

/**
 * Validates XDR encoding
 */
export function validateXDR(xdrString: string): boolean {
  try {
    // Attempt to parse the XDR string
    StellarSdk.xdr.TransactionEnvelope.fromXDR(xdrString, 'base64');
    return true;
  } catch {
    return false;
  }
}

/**
 * Gets the hash of an XDR-encoded transaction
 */
export function getTransactionHash(xdrString: string, networkPassphrase: string): Buffer {
  try {
    const tx = StellarSdk.TransactionBuilder.fromXDR(xdrString, networkPassphrase);
    return tx.hash();
  } catch (error) {
    throw new Error(`Failed to get transaction hash: ${error}`);
  }
}
