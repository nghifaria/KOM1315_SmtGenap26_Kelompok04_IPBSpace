import React from 'react';

export default function AssetBadge({ icon: Icon, name }) {
  return (
    <div className="w-full sm:w-auto flex items-center gap-4 bg-surface-bright/30 hover:bg-surface-bright border border-surface-container p-4 rounded-xl transition-all duration-300 shadow-sm hover:shadow-ambient group">
      <div className="bg-surface-lowest p-3 rounded-xl border border-surface-container group-hover:scale-105 transition-transform duration-300 flex items-center justify-center shrink-0 shadow-sm">
        {Icon && <Icon className="text-accent" size={24} weight="duotone" />}
      </div>
      <span className="text-on-surface text-sm md:text-base font-extrabold leading-tight">
        {name}
      </span>
    </div>
  );
}
