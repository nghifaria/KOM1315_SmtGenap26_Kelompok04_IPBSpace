import React from 'react';

export default function StatCard({ title, value, description, icon: Icon, colorTheme }) {
  // Define color mappings based on theme string to map to our tailwind colors
  const colorMap = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', hover: 'hover:border-blue-300/40 hover:shadow-md' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', hover: 'hover:border-emerald-300/40 hover:shadow-md' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', hover: 'hover:border-purple-300/40 hover:shadow-md' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-500', hover: 'hover:border-orange-300/40 hover:shadow-md' },
    primary: { bg: 'bg-slate-50', text: 'text-primary-container', hover: 'hover:border-primary-container/40 hover:shadow-md' },
    danger: { bg: 'bg-red-50', text: 'text-danger', hover: 'hover:border-danger/40 hover:shadow-md' }
  };

  const theme = colorMap[colorTheme] || colorMap.blue;

  return (
    <div className={`h-full bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5 group ${theme.hover} transition-all duration-300`}>
      <div className={`w-14 h-14 ${theme.bg} rounded-2xl flex items-center justify-center shrink-0 ${theme.text}`}>
        <Icon size={28} weight="fill" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-base font-bold text-slate-500 mb-1 truncate">{title}</p>
        <h3 className="text-4xl font-black text-slate-800 tracking-tight leading-none mb-1.5">
          {value}
        </h3>
        {typeof description === 'string' ? (
          <p className="text-sm text-slate-400 font-semibold leading-relaxed">
            {description}
          </p>
        ) : (
          description
        )}
      </div>
    </div>
  );
}
