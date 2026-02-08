import { useState, useEffect } from 'react';
import { TransactionStatusDisplay } from './TransactionStatusDisplay';
import './LoanManagementPanel.css';

/**
 * LoanManagementPanel component for managing loans
 * 
 * Displays active loans, provides loan creation form, shows repayment schedule,
 * and enables repayment and liquidation actions.
 * 
 * Requirements: 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10
 */
export function LoanManagementPanel({
  userAddress,
  contractService,
  walletService,
}) {
  const [activeLoans, setActiveLoans] = useState([]);
  const [isLoadingLoans, setIsLoadingLoans] = useState(true);
  const [loansError, setLoansError] = useState(null);
  
  const [isCreatingLoan, setIsCreatingLoan] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loanTerms, setLoanTerms] = useState({
    borrower: '',
    principal: '',
    interestRate: '',
    duration: '',
    collateralAmount: '',
    collateralAsset: 'XLM',
    installments: '',
  });
  const [createError, setCreateError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  
  const [transactionStatus, setTransactionStatus] = useState(null);
  const [selectedLoan, setSelectedLoan] = useState(null);

  // Load loans on mount
  useEffect(() => {
    if (userAddress) {
      loadLoans();
    }
  }, [userAddress]);

  const loadLoans = async () => {
    setIsLoadingLoans(true);
    setLoansError(null);

    try {
      const loans = await contractService.getUserLoans(userAddress);
      setActiveLoans(loans);
    } catch (err) {
      console.error('Failed to load loans:', err);
      
      let errorMessage = 'Failed to load loans';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setLoansError(errorMessage);
    } finally {
      setIsLoadingLoans(false);
    }
  };

  const formatBalance = (stroops) => {
    if (!stroops) return '0.00';
    const xlm = Number(stroops) / 10_000_000;
    return xlm.toFixed(2);
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString();
  };

  const formatInterestRate = (basisPoints) => {
    return (basisPoints / 100).toFixed(2) + '%';
  };

  const validateLoanTerms = () => {
    const errors = {};

    // Validate principal
    const principal = parseFloat(loanTerms.principal);
    if (!loanTerms.principal || isNaN(principal) || principal <= 0) {
      errors.principal = 'Principal must be positive';
    }

    // Validate interest rate (0-10000 basis points = 0-100%)
    const interestRate = parseInt(loanTerms.interestRate);
    if (!loanTerms.interestRate || isNaN(interestRate) || interestRate < 0 || interestRate > 10000) {
      errors.interestRate = 'Interest rate must be between 0 and 10000 basis points (0-100%)';
    }

    // Validate duration
    const duration = parseInt(loanTerms.duration);
    if (!loanTerms.duration || isNaN(duration) || duration <= 0) {
      errors.duration = 'Duration must be positive';
    }

    // Validate collateral amount
    const collateralAmount = parseFloat(loanTerms.collateralAmount);
    if (!loanTerms.collateralAmount || isNaN(collateralAmount) || collateralAmount <= 0) {
      errors.collateralAmount = 'Collateral amount must be positive';
    }

    // Validate installments
    const installments = parseInt(loanTerms.installments);
    if (!loanTerms.installments || isNaN(installments) || installments <= 0) {
      errors.installments = 'Installments must be positive';
    }

    // Validate borrower address
    if (!loanTerms.borrower || loanTerms.borrower.length !== 56) {
      errors.borrower = 'Invalid Stellar address';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleTermChange = (field, value) => {
    setLoanTerms({
      ...loanTerms,
      [field]: value,
    });
    setCreateError(null);
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      const newErrors = { ...validationErrors };
      delete newErrors[field];
      setValidationErrors(newErrors);
    }
  };

  const handleCreateLoan = async () => {
    if (!validateLoanTerms()) {
      return;
    }

    setIsCreatingLoan(true);
    setCreateError(null);

    try {
      const walletState = walletService.getState();
      
      if (!walletState.isConnected || !walletState.connection) {
        throw new Error('Wallet not connected');
      }

      // Convert XLM to stroops
      const principalInStroops = Math.floor(parseFloat(loanTerms.principal) * 10_000_000).toString();
      const collateralInStroops = Math.floor(parseFloat(loanTerms.collateralAmount) * 10_000_000).toString();
      
      // Convert duration from days to seconds
      const durationInSeconds = parseInt(loanTerms.duration) * 24 * 60 * 60;

      const terms = {
        principal: principalInStroops,
        interestRate: parseInt(loanTerms.interestRate),
        duration: durationInSeconds,
        collateralAmount: collateralInStroops,
        collateralAsset: loanTerms.collateralAsset,
        installments: parseInt(loanTerms.installments),
      };

      // Create loan
      const loanId = await contractService.createLoan(
        walletState.connection.publicKey,
        loanTerms.borrower,
        terms
      );

      // Show success message
      setTransactionStatus({
        hash: `loan_${loanId}`,
        status: 'confirmed',
        timestamp: Date.now(),
      });

      // Reset form
      setLoanTerms({
        borrower: '',
        principal: '',
        interestRate: '',
        duration: '',
        collateralAmount: '',
        collateralAsset: 'XLM',
        installments: '',
      });
      setShowCreateForm(false);

      // Reload loans
      await loadLoans();
    } catch (err) {
      console.error('Failed to create loan:', err);
      
      let errorMessage = 'Failed to create loan';
      
      if (err instanceof Error) {
        if (err.message.includes('Insufficient collateral')) {
          errorMessage = err.message;
        } else if (err.message.includes('Wallet not connected')) {
          errorMessage = 'Wallet not connected. Please connect your wallet first.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setCreateError(errorMessage);
    } finally {
      setIsCreatingLoan(false);
    }
  };

  const handleMakeRepayment = async (loan) => {
    setSelectedLoan(loan);
    
    // Find next unpaid payment
    const nextPayment = loan.repaymentSchedule.find(p => !p.paid);
    
    if (!nextPayment) {
      setCreateError('No pending payments');
      return;
    }

    try {
      const walletState = walletService.getState();
      
      if (!walletState.isConnected || !walletState.connection) {
        throw new Error('Wallet not connected');
      }

      // Check if user is the borrower
      if (walletState.connection.publicKey !== loan.borrower) {
        throw new Error('Only the borrower can make repayments');
      }

      setTransactionStatus({
        hash: 'pending',
        status: 'pending',
        timestamp: Date.now(),
      });

      // Make repayment
      const txHash = await contractService.makeRepayment(
        loan.loanId,
        loan.borrower,
        nextPayment.amount
      );

      setTransactionStatus({
        hash: txHash,
        status: 'confirmed',
        timestamp: Date.now(),
      });

      // Reload loans
      await loadLoans();
    } catch (err) {
      console.error('Failed to make repayment:', err);
      
      let errorMessage = 'Failed to make repayment';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setTransactionStatus({
        hash: 'error',
        status: 'failed',
        error: errorMessage,
        timestamp: Date.now(),
      });
    }
  };

  const handleLiquidate = async (loan) => {
    setSelectedLoan(loan);

    try {
      const walletState = walletService.getState();
      
      if (!walletState.isConnected || !walletState.connection) {
        throw new Error('Wallet not connected');
      }

      // Check if user is the lender
      if (walletState.connection.publicKey !== loan.lender) {
        throw new Error('Only the lender can liquidate collateral');
      }

      setTransactionStatus({
        hash: 'pending',
        status: 'pending',
        timestamp: Date.now(),
      });

      // Liquidate collateral
      const txHash = await contractService.liquidateCollateral(
        loan.loanId,
        loan.lender
      );

      setTransactionStatus({
        hash: txHash,
        status: 'confirmed',
        timestamp: Date.now(),
      });

      // Reload loans
      await loadLoans();
    } catch (err) {
      console.error('Failed to liquidate:', err);
      
      let errorMessage = 'Failed to liquidate collateral';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setTransactionStatus({
        hash: 'error',
        status: 'failed',
        error: errorMessage,
        timestamp: Date.now(),
      });
    }
  };

  const handleCloseStatus = () => {
    setTransactionStatus(null);
    setSelectedLoan(null);
  };

  const isLoanOverdue = (loan) => {
    const now = Date.now() / 1000;
    const overduePayment = loan.repaymentSchedule.find(
      p => !p.paid && p.dueDate < now
    );
    return !!overduePayment;
  };

  const getNextPayment = (loan) => {
    return loan.repaymentSchedule.find(p => !p.paid);
  };

  if (isLoadingLoans) {
    return (
      <div className="loan-management-panel">
        <h3>Loan Management</h3>
        <div className="loading-message">Loading loans...</div>
      </div>
    );
  }

  return (
    <div className="loan-management-panel">
      <div className="panel-header">
        <h3>Loan Management</h3>
        <button
          className="create-loan-button"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? 'Cancel' : 'Create Loan'}
        </button>
      </div>

      {loansError && (
        <div className="error-message">
          {loansError}
          <button className="retry-button" onClick={loadLoans}>
            Retry
          </button>
        </div>
      )}

      {showCreateForm && (
        <div className="create-loan-form">
          <h4>Create New Loan</h4>
          
          <div className="form-group">
            <label htmlFor="borrower">Borrower Address</label>
            <input
              id="borrower"
              type="text"
              value={loanTerms.borrower}
              onChange={(e) => handleTermChange('borrower', e.target.value)}
              placeholder="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
              disabled={isCreatingLoan}
              className={validationErrors.borrower ? 'input-error' : ''}
            />
            {validationErrors.borrower && (
              <div className="validation-error">{validationErrors.borrower}</div>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="principal">Principal (XLM)</label>
              <input
                id="principal"
                type="text"
                value={loanTerms.principal}
                onChange={(e) => handleTermChange('principal', e.target.value)}
                placeholder="0.00"
                disabled={isCreatingLoan}
                className={validationErrors.principal ? 'input-error' : ''}
              />
              {validationErrors.principal && (
                <div className="validation-error">{validationErrors.principal}</div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="interestRate">Interest Rate (basis points)</label>
              <input
                id="interestRate"
                type="text"
                value={loanTerms.interestRate}
                onChange={(e) => handleTermChange('interestRate', e.target.value)}
                placeholder="0-10000"
                disabled={isCreatingLoan}
                className={validationErrors.interestRate ? 'input-error' : ''}
              />
              {validationErrors.interestRate && (
                <div className="validation-error">{validationErrors.interestRate}</div>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="duration">Duration (days)</label>
              <input
                id="duration"
                type="text"
                value={loanTerms.duration}
                onChange={(e) => handleTermChange('duration', e.target.value)}
                placeholder="30"
                disabled={isCreatingLoan}
                className={validationErrors.duration ? 'input-error' : ''}
              />
              {validationErrors.duration && (
                <div className="validation-error">{validationErrors.duration}</div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="installments">Installments</label>
              <input
                id="installments"
                type="text"
                value={loanTerms.installments}
                onChange={(e) => handleTermChange('installments', e.target.value)}
                placeholder="4"
                disabled={isCreatingLoan}
                className={validationErrors.installments ? 'input-error' : ''}
              />
              {validationErrors.installments && (
                <div className="validation-error">{validationErrors.installments}</div>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="collateralAmount">Collateral Amount (XLM)</label>
              <input
                id="collateralAmount"
                type="text"
                value={loanTerms.collateralAmount}
                onChange={(e) => handleTermChange('collateralAmount', e.target.value)}
                placeholder="0.00"
                disabled={isCreatingLoan}
                className={validationErrors.collateralAmount ? 'input-error' : ''}
              />
              {validationErrors.collateralAmount && (
                <div className="validation-error">{validationErrors.collateralAmount}</div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="collateralAsset">Collateral Asset</label>
              <select
                id="collateralAsset"
                value={loanTerms.collateralAsset}
                onChange={(e) => handleTermChange('collateralAsset', e.target.value)}
                disabled={isCreatingLoan}
              >
                <option value="XLM">XLM</option>
                <option value="USDC">USDC</option>
              </select>
            </div>
          </div>

          {createError && (
            <div className="error-message">{createError}</div>
          )}

          <button
            className="submit-loan-button"
            onClick={handleCreateLoan}
            disabled={isCreatingLoan || Object.keys(validationErrors).length > 0}
          >
            {isCreatingLoan ? 'Creating...' : 'Create Loan'}
          </button>
        </div>
      )}

      <div className="loans-section">
        <h4>Active Loans</h4>
        
        {activeLoans.length === 0 ? (
          <div className="no-loans-message">No active loans</div>
        ) : (
          <div className="loans-list">
            {activeLoans.map((loan, index) => {
              const nextPayment = getNextPayment(loan);
              const overdue = isLoanOverdue(loan);
              const isLender = loan.lender === userAddress;
              const isBorrower = loan.borrower === userAddress;

              return (
                <div key={index} className={`loan-card ${overdue ? 'overdue' : ''}`}>
                  <div className="loan-header">
                    <div className="loan-id">Loan #{index + 1}</div>
                    <div className={`loan-status status-${loan.status.toLowerCase()}`}>
                      {loan.status}
                      {overdue && loan.status === 'Active' && ' (Overdue)'}
                    </div>
                  </div>

                  <div className="loan-details">
                    <div className="detail-row">
                      <span className="detail-label">Role:</span>
                      <span className="detail-value">
                        {isLender ? 'Lender' : isBorrower ? 'Borrower' : 'Unknown'}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Principal:</span>
                      <span className="detail-value">{formatBalance(loan.principal)} XLM</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Interest Rate:</span>
                      <span className="detail-value">{formatInterestRate(loan.interestRate)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Collateral:</span>
                      <span className="detail-value">{formatBalance(loan.collateralAmount)} XLM</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Total Repaid:</span>
                      <span className="detail-value">{formatBalance(loan.totalRepaid)} XLM</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Created:</span>
                      <span className="detail-value">{formatDate(loan.createdAt)}</span>
                    </div>
                  </div>

                  {nextPayment && loan.status === 'Active' && (
                    <div className="next-payment">
                      <div className="payment-label">Next Payment:</div>
                      <div className="payment-details">
                        <span className="payment-amount">{formatBalance(nextPayment.amount)} XLM</span>
                        <span className="payment-due">Due: {formatDate(nextPayment.dueDate)}</span>
                      </div>
                    </div>
                  )}

                  {loan.status === 'Repaid' && (
                    <div className="loan-complete-message">
                      ✓ Loan fully repaid. Collateral released.
                    </div>
                  )}

                  <div className="loan-actions">
                    {isBorrower && loan.status === 'Active' && nextPayment && (
                      <button
                        className="repay-button"
                        onClick={() => handleMakeRepayment(loan)}
                      >
                        Make Payment
                      </button>
                    )}
                    {isLender && overdue && loan.status === 'Active' && (
                      <button
                        className="liquidate-button"
                        onClick={() => handleLiquidate(loan)}
                      >
                        Liquidate Collateral
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {transactionStatus && (
        <TransactionStatusDisplay
          status={transactionStatus}
          onClose={handleCloseStatus}
        />
      )}
    </div>
  );
}
