import { useState, useEffect } from 'react';
import './WalletConnector.css';

export function WalletConnector({ walletService, onConnect, onDisconnect }) {
  const [availableWallets, setAvailableWallets] = useState([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [walletState, setWalletState] = useState(null);

  useEffect(() => {
    detectWallets();
    restoreConnection();
  }, []);

  const detectWallets = async () => {
    try {
      const wallets = await walletService.detectWallets();
      setAvailableWallets(wallets);
      // No error state set when wallets.length === 0
      // The Install_Prompt UI will handle the "no wallets" case
    } catch (err) {
      console.error('Failed to detect wallets:', err);
      setError('Failed to detect wallet providers');
    }
  };

  const restoreConnection = async () => {
    try {
      const connection = await walletService.restoreConnection();
      if (connection) {
        const state = walletService.getState();
        setWalletState(state);
        if (onConnect) {
          onConnect(connection);
        }
      }
    } catch (err) {
      console.error('Failed to restore connection:', err);
    }
  };

  const handleConnect = async (providerName) => {
    setIsConnecting(true);
    setError(null);

    try {
      const connection = await walletService.connect(providerName);
      const state = walletService.getState();
      setWalletState(state);
      
      if (onConnect) {
        onConnect(connection);
      }
    } catch (err) {
      console.error('Connection failed:', err);
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await walletService.disconnect();
      setWalletState(null);
      
      if (onDisconnect) {
        onDisconnect();
      }
    } catch (err) {
      console.error('Disconnect failed:', err);
      setError(err.message || 'Failed to disconnect wallet');
    }
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  if (isConnecting) {
    return (
      <div className="wallet-connector">
        <div className="wallet-loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (walletState?.isConnected) {
    return (
      <div className="wallet-connector">
        <div className="wallet-connected">
          <div className="wallet-connected-header">
            <div className="wallet-connected-icon">✓</div>
            <div className="wallet-connected-info">
              <div className="wallet-connected-label">Connected</div>
              <div className="wallet-connected-provider">
                {walletState.connection.provider === 'freighter' ? 'Freighter' : 'Albedo'}
              </div>
            </div>
          </div>

          <div className="wallet-details">
            <div className="wallet-detail-row">
              <span className="wallet-detail-label">Address</span>
              <span className="wallet-detail-value">
                {formatAddress(walletState.connection.publicKey)}
              </span>
            </div>
            
            <div className="wallet-address-full">
              {walletState.connection.publicKey}
            </div>
          </div>

          {walletState.balance && (
            <div className="wallet-balance">
              <div className="wallet-balance-label">Balance</div>
              <div className="wallet-balance-value">
                {parseFloat(walletState.balance).toFixed(2)}
                <span className="wallet-balance-currency">XLM</span>
              </div>
            </div>
          )}

          <div className="wallet-actions">
            <button className="btn-secondary" onClick={handleDisconnect}>
              Disconnect
            </button>
          </div>
        </div>

        {error && (
          <div className="wallet-error">
            <div className="wallet-error-message">
              <span>⚠</span>
              <span>{error}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="wallet-connector">
      <div className="wallet-connector-header">
        <h2 className="wallet-connector-title">Connect Wallet</h2>
        <p className="wallet-connector-subtitle">
          Choose a wallet provider to connect to Stellar network
        </p>
      </div>

      <div className="wallet-options">
        {availableWallets.map((wallet) => (
          <div
            key={wallet.name}
            className="wallet-option"
            onClick={() => handleConnect(wallet.name)}
          >
            <div className="wallet-option-icon">
              {wallet.name === 'freighter' ? '🚀' : '⭐'}
            </div>
            <div className="wallet-option-content">
              <div className="wallet-option-name">
                {wallet.name === 'freighter' ? 'Freighter' : 'Albedo'}
              </div>
              <div className="wallet-option-description">
                {wallet.name === 'freighter' 
                  ? 'Browser extension wallet for Stellar' 
                  : 'Web-based Stellar wallet'}
              </div>
            </div>
            <div className="wallet-option-arrow">→</div>
          </div>
        ))}
      </div>

      {availableWallets.length === 0 && (
        <div className="wallet-install-prompt">
          <div className="wallet-install-message">
            No wallet detected. Install a Stellar wallet to continue.
          </div>
          <a
            href="https://www.freighter.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="wallet-install-link"
          >
            Install Freighter →
          </a>
        </div>
      )}

      {error && (
        <div className="wallet-error">
          <div className="wallet-error-message">
            <span>⚠</span>
            <span>{error}</span>
          </div>
        </div>
      )}
    </div>
  );
}
