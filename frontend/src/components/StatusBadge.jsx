import React from 'react';

export default function StatusBadge({ status }) {
  const norm = (status || '').toLowerCase();
  
  return (
    <span className={`badge badge-${norm}`}>
      {norm === 'serving' && <span className="pulse-dot" />}
      {norm}
    </span>
  );
}
