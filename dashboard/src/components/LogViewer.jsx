import React, { useRef, useEffect } from 'react';
import './LogViewer.css';

function LogViewer({ logs }) {
  const logEndRef = useRef(null);
  const [autoScroll, setAutoScroll] = React.useState(true);

  useEffect(() => {
    if (autoScroll && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const getLogClass = (level) => {
    switch (level) {
      case 'error':
        return 'log-error';
      case 'warn':
        return 'log-warn';
      case 'info':
        return 'log-info';
      default:
        return 'log-debug';
    }
  };

  return (
    <div className="log-viewer card">
      <div className="card-header">
        <h3 className="card-title">System Logs</h3>
        <div className="log-controls">
          <label className="auto-scroll-toggle">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
            />
            <span>Auto-scroll</span>
          </label>
          <span className="log-count">{logs.length} entries</span>
        </div>
      </div>

      <div className="log-content">
        {logs.length === 0 ? (
          <div className="log-empty">No logs available</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className={`log-entry ${getLogClass(log.level)}`}>
              <span className="log-timestamp">{log.timestamp}</span>
              <span className="log-level">[{log.level.toUpperCase()}]</span>
              <span className="log-message">{log.message}</span>
            </div>
          ))
        )}
        <div ref={logEndRef} />
      </div>
    </div>
  );
}

export default LogViewer;
