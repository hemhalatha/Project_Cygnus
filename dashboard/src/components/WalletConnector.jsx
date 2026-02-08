import { useState, useEffect } from 'react';
import './WalletConnector.css';

/**
 * WalletConnector component for connecting and managing Stellar wallets
 * 
 * Supports Freighter and Albedo wallet providers
 */
export function WalletConnector({ walletService, onConnect, onDisconnect }) {
  const [availableWallets, setAvailableWallets] = useState([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [walletState, setWalletState] = useState(null);

  // Detect wallets on mount
  useEffect(() => {
    detectWallets();
    
    // Try to restore connection
    restoreConnection();
  }, []);

  const detectWallets = async () => {
    try {
      const wallets = await walletService.detectWallets();
      setAvailableWallets(wallets);
      
      if (wallets.length === 0) {
        setError('No wallet providers found. Please install Freighter or Albedo.');
      }
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
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const formatBalance = (stroops) => {
    if (!stroops) return '0';
    const xlm = Number(stroops) / 10_000_000;
    return xlm.toFixed(2);
  };

  // Connected state
  if (walletState?.isConnected && walletState.connection) {
    return (
      <div className="wallet-connector connected">
        <div className="wallet-info">
          <div className="wallet-provider">
            {walletState.connection.provider === 'freighter' ? '🚀 Freighter' : '⭐ Albedo'}
          </div>
          <div className="wallet-address" title={walletState.connection.publicKey}>
            {formatAddress(walletState.connection.publicKey)}
          </div>
          <div className="wallet-balance">
            {formatBalance(walletState.balance)} XLM
          </div>
        </div>
        <button 
          className="disconnect-button"
          onClick={handleDisconnect}
        >
          Disconnect
        </button>
      </div>
    );
  }

  // Disconnected state
  return (
    <div className="wallet-connector disconnected">
      <h3>Connect Wallet</h3>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {availableWallets.length === 0 && !error && (
        <div className="no-wallets">
          <p>No wallet providers detected.</p>
          <p>Please install:</p>
          <ul>
            <li>
              <a href="https://www.freighter.app/" target="_blank" rel="noopener noreferrer">
                Freighter Wallet
              </a>
            </li>
            <li>
              <a href="https://albedo.link/" target="_blank" rel="noopener noreferrer">
                Albedo Wallet
              </a>
            </li>
          </ul>
        </div>
      )}

      {availableWallets.length > 0 && (
        <div className="wallet-options">
          {availableWallets.map((wallet) => (
            <button
              key={wallet.name}
              className="wallet-option"
              onClick={() => handleConnect(wallet.name)}
              disabled={isConnecting}
            >
              {wallet.name === 'freighter' ? '🚀 Connect Freighter' : '⭐ Connect Albedo'}
            </button>
          ))}
        </div>
      )}

      {isConnecting && (
        <div className="connecting">
          Connecting...
        </div>
      )}
    </div>
  );
}
