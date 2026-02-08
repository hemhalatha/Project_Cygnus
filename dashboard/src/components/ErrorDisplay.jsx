import './ErrorDisplay.css';

/**
 * ErrorDisplay component for displaying error messages
 * 
 * Displays error messages with appropriate styling, error type icons,
 * retry button for recoverable errors, and dismiss button.
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8
 */
export function ErrorDisplay({
  error,
  errorType = 'general',
  onRetry,
  onDismiss,
}) {
  if (!error) {
    return null;
  }

  const getErrorIcon = () => {
    switch (errorType) {
      case 'wallet':
        return '🔌';
      case 'transaction':
        return '💸';
      case 'network':
        return '🌐';
      case 'contract':
        return '📜';
      case 'validation':
        return '⚠️';
      case 'timeout':
        return '⏱️';
      default:
        return '❌';
    }
  };

  const getErrorTitle = () => {
    switch (errorType) {
      case 'wallet':
        return 'Wallet Error';
      case 'transaction':
        return 'Transaction Error';
      case 'network':
        return 'Network Error';
      case 'contract':
        return 'Contract Error';
      case 'validation':
        return 'Validation Error';
      case 'timeout':
        return 'Timeout Error';
      default:
        return 'Error';
    }
  };

  const isRecoverable = () => {
    // Network errors and timeouts are typically recoverable
    return errorType === 'network' || errorType === 'timeout';
  };

  return (
    <div className={`error-display error-type-${errorType}`}>
      <div className="error-header">
        <span className="error-icon">{getErrorIcon()}</span>
        <span className="error-title">{getErrorTitle()}</span>
      </div>
      
      <div className="error-message">
        {error}
      </div>

      <div className="error-actions">
        {isRecoverable() && onRetry && (
          <button className="error-retry-button" onClick={onRetry}>
            Retry
          </button>
        )}
        {onDismiss && (
          <button className="error-dismiss-button" onClick={onDismiss}>
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}
