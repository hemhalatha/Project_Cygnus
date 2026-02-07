import React, { useState, useEffect } from 'react';
import './ContractStatus.css';

function ContractStatus() {
  const [contracts, setContracts] = useState([
    { name: 'Credit Scoring', status: 'deployed', address: 'CXXX...XXXX', calls: 0 },
    { name: 'Loan Management', status: 'deployed', address: 'LXXX...XXXX', calls: 0 },
    { name: 'Escrow', status: 'deployed', address: 'EXXX...XXXX', calls: 0 },
  ]);

  useEffect(() => {
    fetchContractStatus();
    const interval = setInterval(fetchContractStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchContractStatus = async () => {
    try {
      const response = await fetch('/api/contracts');
      const data = await response.json();
      setContracts(data);
    } catch (error) {
      console.error('Failed to fetch contract status:', error);
    }
  };

  return (
    <div className="contract-status card">
      <div className="card-header">
        <h3 className="card-title">Smart Contracts</h3>
        <span className="status-badge success">All Deployed</span>
      </div>
      
      <div className="contract-list">
        {contracts.map((contract, index) => (
          <div key={index} className="contract-item">
            <div className="contract-info">
              <div className="contract-name">{contract.name}</div>
              <div className="contract-address">{contract.address}</div>
            </div>
            <div className="contract-stats">
              <div className="contract-calls">{contract.calls} calls</div>
              <div className={`contract-status-badge ${contract.status}`}>
                {contract.status}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ContractStatus;
