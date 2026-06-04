import React from 'react';

export default function DescriptionItem({ icon: Icon, label, value, subValue, className = '' }) {
  return (
    <div className={`bg-surface-lowest border border-surface-container p-4 rounded-card shadow-ambient flex items-start gap-4 ${className}`}>
      <div className="bg-surface-dim/40 p-3 rounded-xl text-primary-container shadow-inner shrink-0">
        {Icon && <Icon size={24} weight="duotone" />}
      </div>
      <div>
        <span className="text-xs font-black text-on-surface-variant/80 uppercase tracking-widest block mb-1">{label}</span>
        <div className="font-extrabold text-on-surface text-base leading-snug">{value}</div>
        {subValue && <span className="text-xs text-on-surface-variant/60 font-semibold block mt-0.5">{subValue}</span>}
      </div>
    </div>
  );
}
