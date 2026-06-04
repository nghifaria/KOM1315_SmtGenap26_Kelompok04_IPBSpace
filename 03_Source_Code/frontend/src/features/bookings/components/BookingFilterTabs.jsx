import React from 'react';
import { BOOKING_FILTER_TABS } from '../constants/bookingConstants';

export default function BookingFilterTabs({ activeFilter, onFilterChange }) {
  return (
    <div className="flex overflow-x-auto gap-2 pb-4 scrollbar-hide">
      {BOOKING_FILTER_TABS.map((tab) => {
        const isActive = activeFilter === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onFilterChange(tab.id)}
            className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors border ${
              isActive 
                ? 'bg-primary-container text-white border-primary-container shadow-sm' 
                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 hover:text-gray-800'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
