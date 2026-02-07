import React from 'react';
import './Header.css';

function Header({ isConnected }) {
  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <h1 className="header-title">Project Cygnus</h1>
          <span className="header-subtitle">Machine Economy Dashboard</span>
        </div>
        
        <div className="header-right">
          <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
            <span className="status-dot"></span>
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
          
          <div className="network-badge">
            Testnet
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
