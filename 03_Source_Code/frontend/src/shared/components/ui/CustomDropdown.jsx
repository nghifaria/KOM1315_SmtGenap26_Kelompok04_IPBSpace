import React, { useState, useRef, useEffect } from 'react';
import { CaretDown, Check } from '@phosphor-icons/react';

/**
 * CustomDropdown — Premium styled dropdown to replace native <select> and pill buttons.
 *
 * Props:
 *   options   : Array<{ value: string, label: string, color?: string }>
 *   value     : string  — currently selected value
 *   onChange  : (value: string) => void
 *   placeholder : string (optional, shown when value is empty)
 *   className : string (optional, extra class on the trigger button)
 *   icon      : ReactNode (optional, icon before label)
 */
export default function CustomDropdown({
  options = [],
  value,
  onChange,
  placeholder = 'Pilih...',
  className = '',
  icon = null,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selected = options.find(o => o.value === value);

  // Close when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setIsOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleSelect = (opt) => {
    onChange(opt.value);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={`
          flex items-center gap-2 min-w-[160px] w-full
          bg-white border rounded-xl px-4 py-2.5 text-sm font-semibold
          shadow-sm transition-all duration-200 cursor-pointer select-none
          ${isOpen
            ? 'border-primary ring-2 ring-primary/20 text-primary'
            : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
          }
        `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {icon && <span className="text-slate-400 shrink-0">{icon}</span>}
        {selected?.color && (
          <span className={`w-2 h-2 rounded-full shrink-0 ${selected.color}`} />
        )}
        <span className="flex-1 text-left truncate">
          {selected ? selected.label : placeholder}
        </span>
        <CaretDown
          size={15}
          weight="bold"
          className={`shrink-0 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : ''}`}
        />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          role="listbox"
          className={`
            absolute top-full left-0 mt-2 w-full min-w-[160px] z-50
            bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden
            animate-slide-up
          `}
          style={{ animationDuration: '0.15s' }}
        >
          <div className="py-1.5 px-1.5 space-y-0.5">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(opt)}
                  className={`
                    flex items-center gap-2.5 w-full px-3 py-2 text-sm font-semibold rounded-lg
                    transition-colors duration-100 text-left
                    ${isSelected
                      ? 'bg-primary/10 text-primary'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                    }
                  `}
                >
                  {opt.color && (
                    <span className={`w-2 h-2 rounded-full shrink-0 ${opt.color}`} />
                  )}
                  <span className="flex-1">{opt.label}</span>
                  {isSelected && <Check size={14} weight="bold" className="text-primary shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
