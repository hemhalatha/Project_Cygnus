/**
 * Error message formatting utilities
 * 
 * Provides functions to format various error types with user-friendly messages
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8
 */

export interface FormattedError {
  message: string;
  type: 'wallet' | 'transaction' | 'network' | 'contract' | 'validation' | 'timeout' | 'general';
  recoverable: boolean;
}

/**
 * Format wallet connection errors
 */
export function formatWalletError(error: Error | string): FormattedError {
  const errorMessage = typeof error === 'string' ? error : error.message;

  if (errorMessage.includes('not installed') || errorMessage.includes('not found')) {
    return {
      message: 'Wallet extension not found. Please install Freighter or Albedo wallet extension.',
      type: 'wallet',
      recoverable: false,
    };
  }

  if (errorMessage.includes('rejected') || errorMessage.includes('denied')) {
    return {
      message: 'Connection rejected by user. Please approve the connection request in your wallet.',
      type: 'wallet',
      recoverable: true,
    };
  }

  if (errorMessage.includes('locked')) {
    return {
      message: 'Please unlock your wallet and try again.',
      type: 'wallet',
      recoverable: true,
    };
  }

  if (errorMessage.includes('network') || errorMessage.includes('testnet')) {
    return {
      message: 'Please switch your wallet to Stellar testnet.',
      type: 'wallet',
      recoverable: true,
    };
  }

  return {
    message: `Wallet connection failed: ${errorMessage}`,
    type: 'wallet',
    recoverable: true,
  };
}

/**
 * Format transaction errors
 */
export function formatTransactionError(error: Error | string, context?: {
  requiredAmount?: string;
  availableBalance?: string;
  txHash?: string;
}): FormattedError {
  const errorMessage = typeof error === 'string' ? error : error.message;

  // Transaction rejected by user
  if (errorMessage.includes('rejected') || errorMessage.includes('denied')) {
    return {
      message: 'Transaction rejected by user.',
      type: 'transaction',
      recoverable: false,
    };
  }

  // Insufficient balance
  if (errorMessage.includes('Insufficient') || errorMessage.includes('insufficient')) {
    if (context?.requiredAmount && context?.availableBalance) {
      const required = formatXLM(context.requiredAmount);
      const available = formatXLM(context.availableBalance);
      return {
        message: `Insufficient balance. Required: ${required} XLM, Available: ${available} XLM`,
        type: 'transaction',
        recoverable: false,
      };
    }
    return {
      message: 'Insufficient balance to complete this transaction.',
      type: 'transaction',
      recoverable: false,
    };
  }

  // Network error
  if (errorMessage.includes('Network') || errorMessage.includes('network') || 
      errorMessage.includes('connection') || errorMessage.includes('timeout')) {
    return {
      message: 'Network error. Please check your connection and retry.',
      type: 'network',
      recoverable: true,
    };
  }

  // Transaction timeout
  if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
    const message = context?.txHash 
      ? `Transaction timeout. Hash: ${context.txHash} - Check status on Stellar Expert`
      : 'Transaction timeout. Please check the transaction status.';
    return {
      message,
      type: 'timeout',
      recoverable: true,
    };
  }

  // Invalid amount
  if (errorMessage.includes('Invalid amount') || errorMessage.includes('invalid amount')) {
    return {
      message: 'Invalid amount. Must be positive and non-zero.',
      type: 'validation',
      recoverable: false,
    };
  }

  // Limit exceeded
  if (errorMessage.includes('exceeds') || errorMessage.includes('limit')) {
    return {
      message: errorMessage,
      type: 'transaction',
      recoverable: false,
    };
  }

  return {
    message: `Transaction failed: ${errorMessage}`,
    type: 'transaction',
    recoverable: true,
  };
}

/**
 * Format smart contract errors
 */
export function formatContractError(error: Error | string): FormattedError {
  const errorMessage = typeof error === 'string' ? error : error.message;

  // Contract not found
  if (errorMessage.includes('not found') || errorMessage.includes('Not found')) {
    if (errorMessage.includes('profile') || errorMessage.includes('Profile')) {
      return {
        message: 'Credit profile not found. Please initialize profile first.',
        type: 'contract',
        recoverable: false,
      };
    }
    if (errorMessage.includes('loan') || errorMessage.includes('Loan')) {
      return {
        message: 'Loan not found. Please verify loan ID.',
        type: 'contract',
        recoverable: false,
      };
    }
    return {
      message: 'Smart contract not found. Please verify deployment.',
      type: 'contract',
      recoverable: false,
    };
  }

  // Insufficient collateral
  if (errorMessage.includes('collateral') || errorMessage.includes('Collateral')) {
    return {
      message: errorMessage,
      type: 'contract',
      recoverable: false,
    };
  }

  // Invalid loan terms
  if (errorMessage.includes('Interest rate') || errorMessage.includes('interest rate')) {
    return {
      message: 'Interest rate must be between 0 and 10000 basis points (0-100%).',
      type: 'validation',
      recoverable: false,
    };
  }

  // Unauthorized action
  if (errorMessage.includes('authorized') || errorMessage.includes('Unauthorized')) {
    return {
      message: 'You are not authorized to perform this action.',
      type: 'contract',
      recoverable: false,
    };
  }

  // Loan not active
  if (errorMessage.includes('not active') || errorMessage.includes('status')) {
    return {
      message: errorMessage,
      type: 'contract',
      recoverable: false,
    };
  }

  // Payment not overdue
  if (errorMessage.includes('overdue') || errorMessage.includes('liquidate')) {
    return {
      message: 'Cannot liquidate. No payments are overdue.',
      type: 'contract',
      recoverable: false,
    };
  }

  return {
    message: `Contract error: ${errorMessage}`,
    type: 'contract',
    recoverable: false,
  };
}

/**
 * Format limit exceeded errors
 */
export function formatLimitError(
  type: 'buy' | 'sell' | 'swap' | 'loan' | 'borrow',
  attemptedAmount: string,
  maxAmount: string
): FormattedError {
  const attempted = formatXLM(attemptedAmount);
  const max = formatXLM(maxAmount);

  return {
    message: `Transaction exceeds ${type} limit. Max: ${max} XLM, Attempted: ${attempted} XLM`,
    type: 'transaction',
    recoverable: false,
  };
}

/**
 * Format collateral errors
 */
export function formatCollateralError(
  requiredAmount: string,
  availableAmount: string
): FormattedError {
  const required = formatXLM(requiredAmount);
  const available = formatXLM(availableAmount);

  return {
    message: `Insufficient collateral. Required: ${required} XLM, Available: ${available} XLM`,
    type: 'contract',
    recoverable: false,
  };
}

/**
 * Format generic error
 */
export function formatError(error: Error | string): FormattedError {
  const errorMessage = typeof error === 'string' ? error : error.message;

  // Try to detect error type
  if (errorMessage.includes('wallet') || errorMessage.includes('Wallet')) {
    return formatWalletError(error);
  }

  if (errorMessage.includes('contract') || errorMessage.includes('Contract')) {
    return formatContractError(error);
  }

  if (errorMessage.includes('transaction') || errorMessage.includes('Transaction')) {
    return formatTransactionError(error);
  }

  if (errorMessage.includes('network') || errorMessage.includes('Network')) {
    return {
      message: 'Network error. Please check your connection and retry.',
      type: 'network',
      recoverable: true,
    };
  }

  return {
    message: errorMessage,
    type: 'general',
    recoverable: false,
  };
}

/**
 * Helper function to format XLM amounts from stroops
 */
function formatXLM(stroops: string): string {
  try {
    const xlm = Number(stroops) / 10_000_000;
    return xlm.toFixed(2);
  } catch {
    return stroops;
  }
}
