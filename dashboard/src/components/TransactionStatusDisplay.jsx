import { getStellarExpertTxUrl } from '../config/stellar';
import './TransactionStatusDisplay.css';

/**
 * TransactionStatusDisplay component for showing transaction status
 * 
 * Displays transaction hash, status indicator, and link to Stellar Expert
 */
export function TransactionStatusDisplay({ status, onClose }) {
  if (!status) return null;

  const getStatusIcon = () => {
    switch (status.status) {
      case 'pending':
        return '[PENDING]';
      case 'confirmed':
        return '[SUCCESS]';
      case 'failed':
        return '[FAILED]';
      default:
        return '[UNKNOWN]';
    }
  };

  const getStatusText = () => {
    switch (status.status) {
      case 'pending':
        return 'Transaction Pending';
      case 'confirmed':
        return 'Transaction Confirmed';
      case 'failed':
        return 'Transaction Failed';
      default:
        return 'Unknown Status';
    }
  };

  const getStatusClass = () => {
    switch (status.status) {
      case 'pending':
        return 'status-pending';
      case 'confirmed':
        return 'status-confirmed';
      case 'failed':
        return 'status-failed';
      default:
        return '';
    }
  };

  const formatHash = (hash) => {
    if (!hash || hash === 'unknown') return 'N/A';
    return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
  };

  return (
    <div className={`transaction-status-display ${getStatusClass()}`}>
      <div className="status-header">
        <div className="status-icon">{getStatusIcon()}</div>
        <div className="status-text">{getStatusText()}</div>
        {onClose && (
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        )}
      </div>

      <div className="status-body">
        <div className="transaction-hash">
          <span className="label">Transaction Hash:</span>
          <span className="hash" title={status.hash}>
            {formatHash(status.hash)}
          </span>
        </div>

        {status.status === 'pending' && (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <span>Waiting for confirmation...</span>
          </div>
        )}

        {status.status === 'confirmed' && status.hash && status.hash !== 'unknown' && (
          <div className="stellar-expert-link">
            <a
              href={getStellarExpertTxUrl(status.hash)}
              target="_blank"
              rel="noopener noreferrer"
            >
              View on Stellar Expert →
            </a>
          </div>
        )}

        {status.status === 'failed' && status.error && (
          <div className="error-details">
            <span className="label">Error:</span>
            <span className="error-message">{status.error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
