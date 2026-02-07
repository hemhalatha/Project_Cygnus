/**
 * XDR Decoder
 *
 * Decodes XDR binary format to Stellar transaction structures.
 */

import * as StellarSdk from '@stellar/stellar-sdk';
import {
  Transaction,
  TransactionEnvelope,
  Operation,
  OperationBody,
  Memo,
  MemoType,
  Asset,
  AssetType,
  DecoratedSignature,
  TimeBounds,
  PaymentOp,
} from './types.js';

/**
 * Decodes an XDR transaction envelope to our internal format
 */
export function decodeTransactionEnvelope(xdrString: string): TransactionEnvelope {
  try {
    const envelope = StellarSdk.xdr.TransactionEnvelope.fromXDR(xdrString, 'base64');

    // Extract transaction based on envelope type
    let tx: any;
    let signatures: any[] = [];

    switch (envelope.switch()) {
      case StellarSdk.xdr.EnvelopeType.envelopeTypeTx():
        tx = envelope.v1().tx();
        signatures = envelope.v1().signatures();
        break;

      case StellarSdk.xdr.EnvelopeType.envelopeTypeTxV0():
        tx = envelope.v0().tx();
        signatures = envelope.v0().signatures();
        break;

      default:
        throw new Error('Unsupported envelope type');
    }

    return {
      tx: decodeTransaction(tx),
      signatures: signatures.map(decodeSignature),
    };
  } catch (error) {
    throw new Error(`Failed to decode transaction envelope: ${error}`);
  }
}

/**
 * Decodes an XDR transaction to our internal format
 */
export function decodeTransaction(xdrTx: any): Transaction {
  try {
    const sourceAccount = StellarSdk.StrKey.encodeEd25519PublicKey(xdrTx.sourceAccount().ed25519());

    const fee = xdrTx.fee().toNumber();
    const seqNum = xdrTx.seqNum().toString();

    const timeBounds = xdrTx.timeBounds()
      ? {
          minTime: xdrTx.timeBounds().minTime().toString(),
          maxTime: xdrTx.timeBounds().maxTime().toString(),
        }
      : undefined;

    const memo = decodeMemo(xdrTx.memo());
    const operations = xdrTx.operations().map(decodeOperation);

    return {
      sourceAccount,
      fee,
      seqNum,
      timeBounds,
      memo,
      operations,
    };
  } catch (error) {
    throw new Error(`Failed to decode transaction: ${error}`);
  }
}

/**
 * Decodes a transaction from XDR string
 */
export function decodeTransactionFromXDR(xdrString: string): Transaction {
  try {
    const tx = StellarSdk.TransactionBuilder.fromXDR(xdrString, StellarSdk.Networks.TESTNET);

    return {
      sourceAccount: tx.source,
      fee: parseInt(tx.fee),
      seqNum: tx.sequence,
      timeBounds: tx.timeBounds
        ? {
            minTime: tx.timeBounds.minTime,
            maxTime: tx.timeBounds.maxTime,
          }
        : undefined,
      memo: {
        type: getMemoType(tx.memo),
        value: tx.memo.value,
      },
      operations: tx.operations.map((op: any) => ({
        sourceAccount: op.source,
        body: {
          type: getOperationType(op.type),
          data: op,
        },
      })),
    };
  } catch (error) {
    throw new Error(`Failed to decode transaction from XDR: ${error}`);
  }
}

/**
 * Decodes a memo from XDR format
 */
function decodeMemo(xdrMemo: any): Memo {
  const memoType = xdrMemo.switch();

  switch (memoType.name) {
    case 'memoNone':
      return { type: MemoType.MEMO_NONE };

    case 'memoText':
      return {
        type: MemoType.MEMO_TEXT,
        value: xdrMemo.text().toString('utf8'),
      };

    case 'memoId':
      return {
        type: MemoType.MEMO_ID,
        value: xdrMemo.id().toString(),
      };

    case 'memoHash':
      return {
        type: MemoType.MEMO_HASH,
        value: xdrMemo.hash(),
      };

    case 'memoReturn':
      return {
        type: MemoType.MEMO_RETURN,
        value: xdrMemo.retHash(),
      };

    default:
      return { type: MemoType.MEMO_NONE };
  }
}

/**
 * Decodes an operation from XDR format
 */
function decodeOperation(xdrOp: any): Operation {
  const sourceAccount = xdrOp.sourceAccount()
    ? StellarSdk.StrKey.encodeEd25519PublicKey(xdrOp.sourceAccount().ed25519())
    : undefined;

  const body = decodeOperationBody(xdrOp.body());

  return {
    sourceAccount,
    body,
  };
}

/**
 * Decodes an operation body from XDR format
 */
function decodeOperationBody(xdrBody: any): OperationBody {
  const opType = xdrBody.switch();

  switch (opType.name) {
    case 'payment':
      return {
        type: 1, // PAYMENT
        data: decodePaymentOp(xdrBody.paymentOp()),
      };

    // Add more operation types as needed
    default:
      return {
        type: -1,
        data: {},
      };
  }
}

/**
 * Decodes a payment operation
 */
function decodePaymentOp(xdrPayment: any): PaymentOp {
  const destination = StellarSdk.StrKey.encodeEd25519PublicKey(xdrPayment.destination().ed25519());

  const asset = decodeAsset(xdrPayment.asset());
  const amount = xdrPayment.amount().toString();

  return {
    destination,
    asset,
    amount,
  };
}

/**
 * Decodes an asset from XDR format
 */
function decodeAsset(xdrAsset: any): Asset {
  const assetType = xdrAsset.switch();

  switch (assetType.name) {
    case 'assetTypeNative':
      return {
        type: AssetType.ASSET_TYPE_NATIVE,
      };

    case 'assetTypeCreditAlphanum4':
      const alpha4 = xdrAsset.alphaNum4();
      return {
        type: AssetType.ASSET_TYPE_CREDIT_ALPHANUM4,
        code: alpha4.assetCode().toString('utf8').replace(/\0/g, ''),
        issuer: StellarSdk.StrKey.encodeEd25519PublicKey(alpha4.issuer().ed25519()),
      };

    case 'assetTypeCreditAlphanum12':
      const alpha12 = xdrAsset.alphaNum12();
      return {
        type: AssetType.ASSET_TYPE_CREDIT_ALPHANUM12,
        code: alpha12.assetCode().toString('utf8').replace(/\0/g, ''),
        issuer: StellarSdk.StrKey.encodeEd25519PublicKey(alpha12.issuer().ed25519()),
      };

    default:
      throw new Error(`Unsupported asset type: ${assetType.name}`);
  }
}

/**
 * Decodes a signature from XDR format
 */
function decodeSignature(xdrSig: any): DecoratedSignature {
  return {
    hint: xdrSig.hint(),
    signature: xdrSig.signature(),
  };
}

/**
 * Helper to get memo type from Stellar SDK memo
 */
function getMemoType(memo: StellarSdk.Memo): MemoType {
  if (memo.type === StellarSdk.MemoNone) return MemoType.MEMO_NONE;
  if (memo.type === StellarSdk.MemoText) return MemoType.MEMO_TEXT;
  if (memo.type === StellarSdk.MemoID) return MemoType.MEMO_ID;
  if (memo.type === StellarSdk.MemoHash) return MemoType.MEMO_HASH;
  if (memo.type === StellarSdk.MemoReturn) return MemoType.MEMO_RETURN;
  return MemoType.MEMO_NONE;
}

/**
 * Helper to get operation type number
 */
function getOperationType(opType: string): number {
  const typeMap: Record<string, number> = {
    createAccount: 0,
    payment: 1,
    pathPaymentStrictReceive: 2,
    manageSellOffer: 3,
    createPassiveSellOffer: 4,
    setOptions: 5,
    changeTrust: 6,
    allowTrust: 7,
    accountMerge: 8,
    inflation: 9,
    manageData: 10,
    bumpSequence: 11,
    manageBuyOffer: 12,
    pathPaymentStrictSend: 13,
    createClaimableBalance: 14,
    claimClaimableBalance: 15,
    beginSponsoringFutureReserves: 16,
    endSponsoringFutureReserves: 17,
    revokeSponsorship: 18,
    clawback: 19,
    clawbackClaimableBalance: 20,
    setTrustLineFlags: 21,
    liquidityPoolDeposit: 22,
    liquidityPoolWithdraw: 23,
    invokeHostFunction: 24,
    extendFootprintTtl: 25,
    restoreFootprint: 26,
  };

  return typeMap[opType] ?? -1;
}

/**
 * Decodes raw XDR data
 */
export function decodeFromXDR(xdrString: string, type: string): any {
  try {
    const xdr = StellarSdk.xdr;

    switch (type) {
      case 'TransactionEnvelope':
        return xdr.TransactionEnvelope.fromXDR(xdrString, 'base64');

      case 'Transaction':
        return xdr.Transaction.fromXDR(xdrString, 'base64');

      case 'TransactionResult':
        return xdr.TransactionResult.fromXDR(xdrString, 'base64');

      default:
        throw new Error(`Unsupported XDR type: ${type}`);
    }
  } catch (error) {
    throw new Error(`Failed to decode from XDR: ${error}`);
  }
}
