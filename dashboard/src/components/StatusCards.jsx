import './StatusCards.css';

function StatusCards({ status }) {
  if (!status) return null;

  const cards = [
    {
      label: 'Active Agents',
      value: status.agents.active,
      subvalue: `of ${status.agents.total}`,
      icon: '🤖',
      status: status.agents.active === status.agents.total ? 'success' : 'warning',
      change: '+12%',
      changeType: 'positive',
      meta: 'vs last month',
      progress: (status.agents.active / status.agents.total) * 100,
    },
    {
      label: 'Deployed Contracts',
      value: status.contracts.deployed,
      subvalue: `of ${status.contracts.total}`,
      icon: '[CONTRACT]',
      status: status.contracts.deployed === status.contracts.total ? 'success' : 'danger',
      change: '100%',
      changeType: 'positive',
      meta: 'deployment rate',
      progress: (status.contracts.deployed / status.contracts.total) * 100,
    },
    {
      label: 'Payment Channels',
      value: status.channels.active,
      subvalue: `of ${status.channels.total}`,
      icon: '⚡',
      status: 'info',
      change: '+8%',
      changeType: 'positive',
      meta: 'vs last week',
      progress: (status.channels.active / status.channels.total) * 100,
    },
    {
      label: 'Transactions',
      value: status.transactions.count.toLocaleString(),
      subvalue: `${status.transactions.rate}/min`,
      icon: '[TX]',
      status: 'info',
      change: '+24%',
      changeType: 'positive',
      meta: 'throughput',
      progress: 75,
    },
  ];

  return (
    <div className="status-cards">
      {cards.map((card, index) => (
        <div key={index} className="status-card">
          <div className="status-card-header">
            <div className={`status-card-icon ${card.status}`}>
              {card.icon}
            </div>
            <div className={`status-card-badge ${card.status}`}>
              {card.status}
            </div>
          </div>
          
          <div className="status-card-body">
            <div className="status-card-label">{card.label}</div>
            <div className="status-card-value">
              {card.value}
              <span className="status-card-subvalue">{card.subvalue}</span>
            </div>
          </div>

          <div className="status-card-progress">
            <div className="progress-bar">
              <div
                className={`progress-fill ${card.status}`}
                style={{ width: `${card.progress}%` }}
              ></div>
            </div>
          </div>

          <div className="status-card-footer">
            <div className={`status-card-change ${card.changeType}`}>
              <span>{card.changeType === 'positive' ? '↑' : '↓'}</span>
              <span>{card.change}</span>
            </div>
            <div className="status-card-meta">{card.meta}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default StatusCards;
