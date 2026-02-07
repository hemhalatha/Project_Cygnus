import React, { useState } from 'react';
import './DeploymentPanel.css';

function DeploymentPanel({ onDeploy }) {
  const [deploying, setDeploying] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState(null);

  const handleDeploy = async (target) => {
    setDeploying(true);
    setDeploymentStatus({ type: 'info', message: `Deploying to ${target}...` });

    try {
      const response = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target }),
      });

      const data = await response.json();

      if (response.ok) {
        setDeploymentStatus({ type: 'success', message: data.message });
        onDeploy();
      } else {
        setDeploymentStatus({ type: 'error', message: data.error });
      }
    } catch (error) {
      setDeploymentStatus({ type: 'error', message: 'Deployment failed: ' + error.message });
    } finally {
      setDeploying(false);
    }
  };

  const handleBuildContracts = async () => {
    setDeploying(true);
    setDeploymentStatus({ type: 'info', message: 'Building contracts...' });

    try {
      const response = await fetch('/api/build', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        setDeploymentStatus({ type: 'success', message: data.message });
      } else {
        setDeploymentStatus({ type: 'error', message: data.error });
      }
    } catch (error) {
      setDeploymentStatus({ type: 'error', message: 'Build failed: ' + error.message });
    } finally {
      setDeploying(false);
    }
  };

  const handleRunTests = async () => {
    setDeploying(true);
    setDeploymentStatus({ type: 'info', message: 'Running tests...' });

    try {
      const response = await fetch('/api/test', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        setDeploymentStatus({ type: 'success', message: data.message });
      } else {
        setDeploymentStatus({ type: 'error', message: data.error });
      }
    } catch (error) {
      setDeploymentStatus({ type: 'error', message: 'Tests failed: ' + error.message });
    } finally {
      setDeploying(false);
    }
  };

  return (
    <div className="deployment-panel card">
      <div className="card-header">
        <h3 className="card-title">Deployment & Operations</h3>
      </div>

      <div className="deployment-actions">
        <div className="action-group">
          <h4 className="action-group-title">Build & Test</h4>
          <div className="action-buttons">
            <button 
              onClick={handleBuildContracts}
              disabled={deploying}
              className="success"
            >
              Build Contracts
            </button>
            <button 
              onClick={handleRunTests}
              disabled={deploying}
            >
              Run Tests
            </button>
          </div>
        </div>

        <div className="action-group">
          <h4 className="action-group-title">Deploy</h4>
          <div className="action-buttons">
            <button 
              onClick={() => handleDeploy('testnet')}
              disabled={deploying}
            >
              Deploy to Testnet
            </button>
            <button 
              onClick={() => handleDeploy('docker')}
              disabled={deploying}
            >
              Deploy to Docker
            </button>
            <button 
              onClick={() => handleDeploy('kubernetes')}
              disabled={deploying}
              className="danger"
            >
              Deploy to Kubernetes
            </button>
          </div>
        </div>
      </div>

      {deploymentStatus && (
        <div className={`deployment-status ${deploymentStatus.type}`}>
          <span className="status-icon">
            {deploymentStatus.type === 'success' && '[OK]'}
            {deploymentStatus.type === 'error' && '[ERROR]'}
            {deploymentStatus.type === 'info' && '[INFO]'}
          </span>
          <span>{deploymentStatus.message}</span>
        </div>
      )}
    </div>
  );
}

export default DeploymentPanel;
