import { useState, useEffect } from 'react';
import { TransactionStatusDisplay } from './TransactionStatusDisplay';
import './AgentFundingPanel.css';

/**
 * AgentFundingPanel component for funding agents with XLM
 * 
 * Displays agent and user balances, provides input for funding amount,
 * validates amounts, and handles funding transactions.
 * 
 * Requirements: 2.1, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10
 */
export function AgentFundingPanel({
  agentId,
  agentAddress,
  agentBalance,
  userBalance,
  transactionService,
  walletService,
  onBalanceUpdate,
}) {
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [transactionStatus, setTransactionStatus] = useState(null);
  const [validationError, setValidationError] = useState(null);

  // Validate amount on change
  useEffect(() => {
    if (!amount) {
      setValidationError(null);
      return;
    }

    try {
      const amountNum = parseFloat(amount);
      
      // Check if valid number
      if (isNaN(amountNum)) {
        setValidationError('Invalid amount');
        return;
      }

      // Check positive and non-zero
      if (amountNum <= 0) {
        setValidationError('Amount must be positive and non-zero');
        return;
      }

      // Convert to stroops for validation
      const amountInStroops = Math.floor(amountNum * 10_000_000).toString();
      
      // Validate against user balance
      if (!transactionService.validateAmount(amountInStroops, userBalance)) {
        const userBalanceXlm = formatBalance(userBalance);
        setValidationError(`Insufficient balance. Available: ${userBalanceXlm} XLM`);
        return;
      }

      setValidationError(null);
    } catch (err) {
      setValidationError('Invalid amount');
    }
  }, [amount, userBalance, transactionService]);

  const formatBalance = (stroops) => {
    if (!stroops) return '0.00';
    const xlm = Number(stroops) / 10_000_000;
    return xlm.toFixed(2);
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    
    // Allow empty string, numbers, and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      setError(null);
    }
  };

  const handleFund = async () => {
    if (!amount || validationError) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setTransactionStatus(null);

    try {
      const walletState = walletService.getState();
      
      if (!walletState.isConnected || !walletState.connection) {
        throw new Error('Wallet not connected');
      }

      // Convert XLM to stroops
      const amountInStroops = Math.floor(parseFloat(amount) * 10_000_000).toString();

      // Create payment transaction
      const transaction = await transactionService.createPayment({
        source: walletState.connection.publicKey,
        destination: agentAddress,
        amount: amountInStroops,
        memo: `Fund agent ${agentId}`,
      });

      // Set pending status
      setTransactionStatus({
        hash: 'pending',
        status: 'pending',
        timestamp: Date.now(),
      });

      // Sign transaction
      const signedTransaction = await transactionService.signTransaction(transaction);

      // Submit transaction
      const status = await transactionService.submitTransaction(signedTransaction);
      
      setTransactionStatus(status);

      // If confirmed, poll for final status and update balance
      if (status.status === 'confirmed') {
        try {
          // Poll for confirmation
          const finalStatus = await transactionService.pollTransactionStatus(status.hash);
          setTransactionStatus(finalStatus);

          if (finalStatus.status === 'confirmed') {
            // Refresh balances
            await walletService.refreshBalance();
            
            // Notify parent component
            if (onBalanceUpdate) {
              onBalanceUpdate();
            }

            // Clear amount input
            setAmount('');
          }
        } catch (pollError) {
          console.warn('Failed to poll transaction status:', pollError);
          // Keep the initial confirmed status
        }
      }
    } catch (err) {
      console.error('Funding failed:', err);
      
      let errorMessage = 'Failed to fund agent';
      
      if (err instanceof Error) {
        if (err.message.includes('rejected')) {
          errorMessage = 'Transaction rejected by user';
        } else if (err.message.includes('Wallet not connected')) {
          errorMessage = 'Wallet not connected. Please connect your wallet first.';
        } else if (err.message.includes('Insufficient')) {
          errorMessage = err.message;
        } else if (err.message.includes('Network')) {
          errorMessage = 'Network error. Please check your connection and retry.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      
      // Set failed status if we have a transaction
      if (transactionStatus?.hash && transactionStatus.hash !== 'pending') {
        setTransactionStatus({
          ...transactionStatus,
          status: 'failed',
          error: errorMessage,
        });
      } else {
        setTransactionStatus(null);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseStatus = () => {
    setTransactionStatus(null);
  };

  const isFormValid = amount && !validationError && !isSubmitting;

  return (
    <div className="agent-funding-panel">
      <h3>Fund Agent</h3>

      <div className="balance-section">
        <div className="balance-item">
          <span className="balance-label">Agent Balance:</span>
          <span className="balance-value">{formatBalance(agentBalance)} XLM</span>
        </div>
        <div className="balance-item">
          <span className="balance-label">Your Balance:</span>
          <span className="balance-value">{formatBalance(userBalance)} XLM</span>
        </div>
      </div>

      <div className="funding-form">
        <div className="form-group">
          <label htmlFor="amount">Amount (XLM)</label>
          <input
            id="amount"
            type="text"
            value={amount}
            onChange={handleAmountChange}
            placeholder="0.00"
            disabled={isSubmitting}
            className={validationError ? 'input-error' : ''}
          />
          {validationError && (
            <div className="validation-error">{validationError}</div>
          )}
        </div>

        <button
          className="fund-button"
          onClick={handleFund}
          disabled={!isFormValid}
        >
          {isSubmitting ? 'Processing...' : 'Fund Agent'}
        </button>
      </div>

      {error && !transactionStatus && (
        <div className="error-message">
          {error}
        </div>
      )}

      {transactionStatus && (
        <TransactionStatusDisplay
          status={transactionStatus}
          onClose={handleCloseStatus}
        />
      )}
    </div>
  );
}
