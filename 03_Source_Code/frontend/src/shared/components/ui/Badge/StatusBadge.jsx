import React from 'react';
import { STATUS_MAP, DEFAULT_STATUS } from '../../../constants/status';

export default function StatusBadge({ status }) {
  const normalizedStatus = status?.toLowerCase();
  const config = STATUS_MAP[normalizedStatus] || { ...DEFAULT_STATUS, label: status || 'Unknown' };

  return (
    <span className={`px-3 py-1 text-xs font-bold rounded-full w-max ${config.bg} ${config.text} transition-all`}>
      {config.label}
    </span>
  );
}
