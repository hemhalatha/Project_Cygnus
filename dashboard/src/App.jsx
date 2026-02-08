import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import StatusCards from './components/StatusCards';
import MetricsChart from './components/MetricsChart';
import DeploymentPanel from './components/DeploymentPanel';
import LogViewer from './components/LogViewer';
import ContractStatus from './components/ContractStatus';
import { WalletConnector } from './components/WalletConnector';
import { AgentFundingPanel } from './components/AgentFundingPanel';
import { TradingPanel } from './components/TradingPanel';
import { LoanManagementPanel } from './components/LoanManagementPanel';
import { WalletService } from './services/WalletService';
import { TransactionService } from './services/TransactionService';
import { ContractService } from './services/ContractService';
import { StorageService } from './services/StorageService';
import './App.css';

function App() {
  const [systemStatus, setSystemStatus] = useState({
    agents: { active: 0, total: 3 },
    contracts: { deployed: 0, total: 3 },
    channels: { active: 0, total: 0 },
    transactions: { count: 0, rate: 0 },
  });

  const [metrics, setMetrics] = useState({
    settlement: [],
    latency: [],
    errors: [],
  });

  const [logs, setLogs] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  
  // Wallet and blockchain services
  const [walletService] = useState(() => new WalletService(new StorageService()));
  const [transactionService] = useState(() => new TransactionService());
  const [contractService] = useState(() => new ContractService());
  const [walletState, setWalletState] = useState(walletService.getState());
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'agents', 'loans'
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [showWalletModal, setShowWalletModal] = useState(false);

  useEffect(() => {
    // Restore wallet connection on app load
    const restoreWallet = async () => {
      try {
        const connection = await walletService.restoreConnection();
        if (connection) {
          setWalletState(walletService.getState());
        }
      } catch (error) {
        console.error('Failed to restore wallet connection:', error);
      }
    };

    restoreWallet();
  }, [walletService]);

  useEffect(() => {
    // Fetch initial data
    fetchSystemStatus();
    fetchMetrics();
    fetchLogs();

    // Set up WebSocket for real-time updates
    const ws = new WebSocket('ws://localhost:3001');
    
    ws.onopen = () => {
      setIsConnected(true);
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'status') {
        setSystemStatus(data.payload);
      } else if (data.type === 'metrics') {
        setMetrics(data.payload);
      } else if (data.type === 'log') {
        setLogs(prev => [data.payload, ...prev].slice(0, 100));
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log('WebSocket disconnected');
    };

    // Polling fallback
    const interval = setInterval(() => {
      if (!isConnected) {
        fetchSystemStatus();
        fetchMetrics();
      }
    }, 5000);

    return () => {
      ws.close();
      clearInterval(interval);
    };
  }, [isConnected]);

  const fetchSystemStatus = async () => {
    try {
      const response = await fetch('/api/status');
      const data = await response.json();
      setSystemStatus(data);
    } catch (error) {
      console.error('Failed to fetch status:', error);
    }
  };

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/metrics');
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/logs');
      const data = await response.json();
      setLogs(data);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    }
  };

  const handleWalletConnect = async (connection) => {
    setWalletState(walletService.getState());
  };

  const handleWalletDisconnect = async () => {
    setWalletState(walletService.getState());
  };

  const handleBalanceUpdate = () => {
    setWalletState(walletService.getState());
  };

  const renderView = () => {
    switch (currentView) {
      case 'agents':
        return (
          <div className="agents-view">
            <h2>Agent Management</h2>
            {selectedAgent ? (
              <div className="agent-detail">
                <button onClick={() => setSelectedAgent(null)}>← Back to Agents</button>
                <h3>Agent: {selectedAgent.id}</h3>
                
                <AgentFundingPanel
                  agentId={selectedAgent.id}
                  agentAddress={selectedAgent.address}
                  agentBalance={selectedAgent.balance || '0'}
                  userBalance={walletState.balance}
                  transactionService={transactionService}
                  walletService={walletService}
                  onBalanceUpdate={handleBalanceUpdate}
                />
                
                <TradingPanel
                  agentDid={selectedAgent.did}
                  transactionService={transactionService}
                  contractService={contractService}
                  walletService={walletService}
                />
              </div>
            ) : (
              <div className="agent-list">
                <p>Select an agent to manage funding and trading operations.</p>
                {/* Agent list would go here */}
              </div>
            )}
          </div>
        );
      
      case 'loans':
        return (
          <div className="loans-view">
            <h2>Loan Management</h2>
            {walletState.isConnected ? (
              <LoanManagementPanel
                userAddress={walletState.connection?.publicKey || ''}
                contractService={contractService}
                transactionService={transactionService}
                walletService={walletService}
              />
            ) : (
              <p>Please connect your wallet to manage loans.</p>
            )}
          </div>
        );
      
      default:
        return (
          <>
            <StatusCards status={systemStatus} />
            
            <div className="grid-2">
              <MetricsChart metrics={metrics} />
              <ContractStatus />
            </div>
            
            <DeploymentPanel onDeploy={fetchSystemStatus} />
            
            <LogViewer logs={logs} />
          </>
        );
    }
  };

  return (
    <div className="app">
      <Header 
        walletState={walletState}
        onConnectWallet={() => setShowWalletModal(true)}
        onDisconnectWallet={handleWalletDisconnect}
      />
      
      {showWalletModal && (
        <div className="modal-overlay" onClick={() => setShowWalletModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <WalletConnector
              walletService={walletService}
              onConnect={(connection) => {
                handleWalletConnect(connection);
                setShowWalletModal(false);
              }}
              onDisconnect={handleWalletDisconnect}
            />
          </div>
        </div>
      )}
      
      <nav className="main-nav">
        <button 
          className={currentView === 'dashboard' ? 'active' : ''}
          onClick={() => setCurrentView('dashboard')}
        >
          Dashboard
        </button>
        <button 
          className={currentView === 'agents' ? 'active' : ''}
          onClick={() => setCurrentView('agents')}
        >
          Agents
        </button>
        <button 
          className={currentView === 'loans' ? 'active' : ''}
          onClick={() => setCurrentView('loans')}
        >
          Loans
        </button>
      </nav>
      
      <main className="main-content">
        {renderView()}
      </main>
    </div>
  );
}

export default App;
