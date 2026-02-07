import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import StatusCards from './components/StatusCards';
import MetricsChart from './components/MetricsChart';
import DeploymentPanel from './components/DeploymentPanel';
import LogViewer from './components/LogViewer';
import ContractStatus from './components/ContractStatus';
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

  return (
    <div className="app">
      <Header isConnected={isConnected} />
      
      <main className="main-content">
        <StatusCards status={systemStatus} />
        
        <div className="grid-2">
          <MetricsChart metrics={metrics} />
          <ContractStatus />
        </div>
        
        <DeploymentPanel onDeploy={fetchSystemStatus} />
        
        <LogViewer logs={logs} />
      </main>
    </div>
  );
}

export default App;
