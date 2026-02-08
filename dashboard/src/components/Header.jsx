import { useState } from 'react';
import './Header.css';

export function Header({ walletState, onConnectWallet, onDisconnectWallet }) {
  const [activeTab, setActiveTab] = useState('dashboard');

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <a href="/" className="logo">
            <div className="logo-icon">C</div>
            <span className="logo-text">Cygnus</span>
          </a>
          
          <nav className="header-nav">
            <button
              className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              Dashboard
            </button>
            <button
              className={`nav-link ${activeTab === 'agents' ? 'active' : ''}`}
              onClick={() => setActiveTab('agents')}
            >
              Agents
            </button>
            <button
              className={`nav-link ${activeTab === 'contracts' ? 'active' : ''}`}
              onClick={() => setActiveTab('contracts')}
            >
              Contracts
            </button>
            <button
              className={`nav-link ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              Analytics
            </button>
          </nav>
        </div>

        <div className="header-right">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="Search transactions..."
            />
          </div>

          <button className="icon-button" title="Notifications">
            🔔
          </button>

          <button className="icon-button" title="Settings">
            ⚙️
          </button>

          {walletState.isConnected ? (
            <button
              className="wallet-button connected"
              onClick={onDisconnectWallet}
            >
              <span className="wallet-indicator"></span>
              <span className="wallet-address">
                {formatAddress(walletState.connection.publicKey)}
              </span>
            </button>
          ) : (
            <button className="wallet-button" onClick={onConnectWallet}>
              <span>+</span>
              <span>Connect Wallet</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
