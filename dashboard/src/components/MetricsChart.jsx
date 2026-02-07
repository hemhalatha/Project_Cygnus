import React from 'react';
import './MetricsChart.css';

function MetricsChart({ metrics }) {
  const latestMetrics = {
    settlement: metrics.settlement[metrics.settlement.length - 1] || 0,
    latency: metrics.latency[metrics.latency.length - 1] || 0,
    errors: metrics.errors[metrics.errors.length - 1] || 0,
  };

  const getStatusColor = (value, threshold) => {
    if (value < threshold * 0.7) return 'var(--success)';
    if (value < threshold) return 'var(--warning)';
    return 'var(--danger)';
  };

  return (
    <div className="metrics-chart card">
      <div className="card-header">
        <h3 className="card-title">Performance Metrics</h3>
        <span className="status-badge info">Real-time</span>
      </div>
      
      <div className="metrics-grid">
        <div className="metric-item">
          <div className="metric-label">Settlement Finality</div>
          <div className="metric-value" style={{ color: getStatusColor(latestMetrics.settlement, 5000) }}>
            {(latestMetrics.settlement / 1000).toFixed(2)}s
          </div>
          <div className="metric-target">Target: &lt; 5s</div>
          <div className="metric-bar">
            <div 
              className="metric-bar-fill"
              style={{ 
                width: `${Math.min((latestMetrics.settlement / 5000) * 100, 100)}%`,
                background: getStatusColor(latestMetrics.settlement, 5000)
              }}
            ></div>
          </div>
        </div>

        <div className="metric-item">
          <div className="metric-label">Channel Latency</div>
          <div className="metric-value" style={{ color: getStatusColor(latestMetrics.latency, 100) }}>
            {latestMetrics.latency.toFixed(0)}ms
          </div>
          <div className="metric-target">Target: &lt; 100ms</div>
          <div className="metric-bar">
            <div 
              className="metric-bar-fill"
              style={{ 
                width: `${Math.min((latestMetrics.latency / 100) * 100, 100)}%`,
                background: getStatusColor(latestMetrics.latency, 100)
              }}
            ></div>
          </div>
        </div>

        <div className="metric-item">
          <div className="metric-label">Error Rate</div>
          <div className="metric-value" style={{ color: latestMetrics.errors > 5 ? 'var(--danger)' : 'var(--success)' }}>
            {latestMetrics.errors}/min
          </div>
          <div className="metric-target">Target: &lt; 5/min</div>
          <div className="metric-bar">
            <div 
              className="metric-bar-fill"
              style={{ 
                width: `${Math.min((latestMetrics.errors / 10) * 100, 100)}%`,
                background: latestMetrics.errors > 5 ? 'var(--danger)' : 'var(--success)'
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MetricsChart;
