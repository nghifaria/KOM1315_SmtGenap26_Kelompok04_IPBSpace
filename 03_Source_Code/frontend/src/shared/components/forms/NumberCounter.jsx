import React from 'react';
import { Minus, Plus } from '@phosphor-icons/react';

export default function NumberCounter({ 
  value, 
  onChange, 
  min = 0, 
  max, 
  disabled = false 
}) {
  const handleDecrease = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrease = () => {
    if (max === undefined || value < max) {
      onChange(value + 1);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        disabled={disabled || value <= min}
        onClick={handleDecrease}
        className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Minus size={14} weight="bold" />
      </button>
      <span className="font-bold text-gray-800 min-w-[20px] text-center">{value}</span>
      <button
        type="button"
        disabled={disabled || (max !== undefined && value >= max)}
        onClick={handleIncrease}
        className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Plus size={14} weight="bold" />
      </button>
    </div>
  );
}
