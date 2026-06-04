import React from 'react';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { twMerge } from 'tailwind-merge';

export default function Input({ className, ...props }) {
  return (
    <div className="relative w-full">
      <MagnifyingGlass 
        size={20} 
        className="text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" 
      />
      <input 
        {...props}
        className={twMerge(
          "w-full rounded-btn border border-gray-300 pl-12 pr-4 py-3 focus:outline-none focus:border-accent text-on-surface",
          className
        )}
      />
    </div>
  );
}
