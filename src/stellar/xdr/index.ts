/**
 * XDR Serialization Module
 *
 * Provides encoding and decoding utilities for Stellar XDR format.
 * XDR (External Data Representation) is the binary format used by
 * Stellar for network communication and transaction serialization.
 */

export * from './types.js';
export * from './encoder.js';
export * from './decoder.js';

// Re-export commonly used functions
export {
  encodeTransaction,
  encodeToXDR,
  validateXDR,
  getTransactionHash,
} from './encoder.js';

export {
  decodeTransactionEnvelope,
  decodeTransaction,
  decodeTransactionFromXDR,
  decodeFromXDR,
} from './decoder.js';
