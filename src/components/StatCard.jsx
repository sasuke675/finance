import React from 'react';

export default function StatCard({ label, value, variant, size }) {
  const valueClass = [
    'stat-card__value',
    variant ? `stat-card__value--${variant}` : '',
    size === 'large' ? 'stat-card__value--large' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className="card stat-card animate-in">
      <span className="stat-card__label">{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  );
}
