import React from 'react';
import './StatusCards.css';

function StatusCards({ status }) {
  const cards = [
    {
      title: 'Active Agents',
      value: status.agents.active,
      total: status.agents.total,
      status: status.agents.active === status.agents.total ? 'success' : 'warning',
      icon: '🤖',
    },
    {
      title: 'Smart Contracts',
      value: status.contracts.deployed,
      total: status.contracts.total,
      status: status.contracts.deployed === status.contracts.total ? 'success' : 'danger',
      icon: '📜',
    },
    {
      title: 'Payment Channels',
      value: status.channels.active,
      total: status.channels.total,
      status: 'info',
      icon: '⚡',
    },
    {
      title: 'Transactions',
      value: status.transactions.count,
      rate: `${status.transactions.rate}/min`,
      status: 'info',
      icon: '💳',
    },
  ];

  return (
    <div className="status-cards">
      {cards.map((card, index) => (
        <div key={index} className="status-card card">
          <div className="status-card-icon">{card.icon}</div>
          <div className="status-card-content">
            <div className="status-card-title">{card.title}</div>
            <div className="status-card-value">
              {card.value}
              {card.total !== undefined && <span className="status-card-total">/{card.total}</span>}
            </div>
            {card.rate && <div className="status-card-rate">{card.rate}</div>}
          </div>
          <div className={`status-indicator ${card.status}`}></div>
        </div>
      ))}
    </div>
  );
}

export default StatusCards;
