import React from 'react';
import { MagnifyingGlass } from '@phosphor-icons/react';

export default function AdminPageHeader({ 
  title, 
  description, 
  searchQuery, 
  onSearchChange, 
  searchPlaceholder = "Cari...",
  actions 
}) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-white shadow-ambient rounded-card gap-4 mb-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-black text-primary tracking-tight">{title}</h2>
        {description && (
          <p className="text-sm md:text-base font-medium text-slate-500 mt-1">{description}</p>
        )}
      </div>
      
      <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
        {/* Optional Search */}
        {onSearchChange && (
          <div className="relative w-full sm:w-64">
            <MagnifyingGlass size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery || ''}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-slate-50 border border-transparent rounded-btn py-2.5 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent focus:bg-white transition-all"
            />
          </div>
        )}
        
        {/* Action Buttons */}
        {actions && (
          <div className="flex gap-2 w-full sm:w-auto">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
