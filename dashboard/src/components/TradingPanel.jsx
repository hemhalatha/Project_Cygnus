import { useState, useEffect } from 'react';
import { TransactionStatusDisplay } from './TransactionStatusDisplay';
import './TradingPanel.css';

/**
 * TradingPanel component for executing trading operations
 * 
 * Displays credit score and transaction limits, provides operation selection,
 * validates amounts against limits, and handles trading transactions.
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9
 */
export function TradingPanel({
  agentDid,
  transactionService,
  contractService,
  walletService,
}) {
  const [operationType, setOperationType] = useState('buy');
  const [amount, setAmount] = useState('');
  const [asset, setAsset] = useState('XLM');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [transactionStatus, setTransactionStatus] = useState(null);
  const [validationError, setValidationError] = useState(null);
  
  // Credit score and limits
  const [creditScore, setCreditScore] = useState(null);
  const [transactionLimits, setTransactionLimits] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState(null);

  // Load credit profile on mount
  useEffect(() => {
    loadCreditProfile();
  }, [agentDid]);

  // Validate amount on change
  useEffect(() => {
    if (!amount || !transactionLimits) {
      setValidationError(null);
      return;
    }

    validateAmount();
  }, [amount, operationType, transactionLimits]);

  const loadCreditProfile = async () => {
    setIsLoadingProfile(true);
    setProfileError(null);

    try {
      // Get credit score
      const score = await contractService.getCreditScore(agentDid);
      setCreditScore(score);

      // Get transaction limits
      const limits = await contractService.getTransactionLimits(agentDid);
      setTransactionLimits(limits);
    } catch (err) {
      console.error('Failed to load credit profile:', err);
      
      let errorMessage = 'Failed to load credit profile';
      
      if (err instanceof Error) {
        if (err.message.includes('not found')) {
          errorMessage = 'Credit profile not found. Please initialize profile first.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setProfileError(errorMessage);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const validateAmount = async () => {
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
      
      // Validate against credit limits
      const validation = await transactionService.validateAgainstLimits(
        agentDid,
        amountInStroops,
        operationType
      );

      if (!validation.valid) {
        setValidationError(validation.message || 'Transaction exceeds limit');
        return;
      }

      setValidationError(null);
    } catch (err) {
      console.error('Validation error:', err);
      setValidationError('Failed to validate amount');
    }
  };

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

  const handleOperationTypeChange = (e) => {
    setOperationType(e.target.value);
    setError(null);
    setValidationError(null);
  };

  const handleAssetChange = (e) => {
    setAsset(e.target.value);
  };

  const handleTrade = async () => {
    if (!amount || validationError || !transactionLimits) {
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

      // Set pending status
      setTransactionStatus({
        hash: 'pending',
        status: 'pending',
        timestamp: Date.now(),
      });

      // Execute trade
      const status = await transactionService.executeTrade({
        type: operationType,
        amount: amountInStroops,
        asset: operationType === 'swap' ? asset : undefined,
        agentDid,
      });
      
      setTransactionStatus(status);

      // If confirmed, poll for final status
      if (status.status === 'confirmed') {
        try {
          const finalStatus = await transactionService.pollTransactionStatus(status.hash);
          setTransactionStatus(finalStatus);

          if (finalStatus.status === 'confirmed') {
            // Clear amount input
            setAmount('');
            
            // Reload credit profile to get updated score
            await loadCreditProfile();
          }
        } catch (pollError) {
          console.warn('Failed to poll transaction status:', pollError);
        }
      }
    } catch (err) {
      console.error('Trade failed:', err);
      
      let errorMessage = 'Failed to execute trade';
      
      if (err instanceof Error) {
        if (err.message.includes('rejected')) {
          errorMessage = 'Transaction rejected by user';
        } else if (err.message.includes('Wallet not connected')) {
          errorMessage = 'Wallet not connected. Please connect your wallet first.';
        } else if (err.message.includes('exceeds')) {
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

  const isFormValid = amount && !validationError && !isSubmitting && transactionLimits;

  if (isLoadingProfile) {
    return (
      <div className="trading-panel">
        <h3>Trading Operations</h3>
        <div className="loading-message">Loading credit profile...</div>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="trading-panel">
        <h3>Trading Operations</h3>
        <div className="error-message">{profileError}</div>
        <button className="retry-button" onClick={loadCreditProfile}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="trading-panel">
      <h3>Trading Operations</h3>

      <div className="credit-section">
        <div className="credit-score-display">
          <span className="credit-label">Credit Score:</span>
          <span className="credit-value">{creditScore}</span>
          <span className="credit-max">/1000</span>
        </div>

        <div className="limits-section">
          <h4>Transaction Limits</h4>
          <div className="limits-grid">
            <div className="limit-item">
              <span className="limit-label">Max Buy:</span>
              <span className="limit-value">{formatBalance(transactionLimits.maxBuyAmount)} XLM</span>
            </div>
            <div className="limit-item">
              <span className="limit-label">Max Sell:</span>
              <span className="limit-value">{formatBalance(transactionLimits.maxSellAmount)} XLM</span>
            </div>
            <div className="limit-item">
              <span className="limit-label">Max Loan:</span>
              <span className="limit-value">{formatBalance(transactionLimits.maxLoanAmount)} XLM</span>
            </div>
            <div className="limit-item">
              <span className="limit-label">Max Borrow:</span>
              <span className="limit-value">{formatBalance(transactionLimits.maxBorrowAmount)} XLM</span>
            </div>
            <div className="limit-item">
              <span className="limit-label">Daily Limit:</span>
              <span className="limit-value">{formatBalance(transactionLimits.dailyTransactionLimit)} XLM</span>
            </div>
          </div>
        </div>
      </div>

      <div className="trading-form">
        <div className="form-group">
          <label htmlFor="operation-type">Operation Type</label>
          <select
            id="operation-type"
            value={operationType}
            onChange={handleOperationTypeChange}
            disabled={isSubmitting}
          >
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
            <option value="swap">Swap</option>
          </select>
        </div>

        {operationType === 'swap' && (
          <div className="form-group">
            <label htmlFor="asset">Asset</label>
            <select
              id="asset"
              value={asset}
              onChange={handleAssetChange}
              disabled={isSubmitting}
            >
              <option value="XLM">XLM</option>
              <option value="USDC">USDC</option>
              <option value="BTC">BTC</option>
            </select>
          </div>
        )}

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
          className="trade-button"
          onClick={handleTrade}
          disabled={!isFormValid}
        >
          {isSubmitting ? 'Processing...' : `Execute ${operationType.charAt(0).toUpperCase() + operationType.slice(1)}`}
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
