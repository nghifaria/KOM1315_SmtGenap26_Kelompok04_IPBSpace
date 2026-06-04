import React, { useState } from 'react';
import { Clock } from '@phosphor-icons/react';

export default function TimeSelector({ 
  startTime, 
  endTime, 
  onStartTimeChange, 
  onEndTimeChange, 
  errorStart, 
  errorEnd 
}) {
  const [isStartTimeOpen, setIsStartTimeOpen] = useState(false);
  const [isEndTimeOpen, setIsEndTimeOpen] = useState(false);

  const timeSlots = [];
  for (let hour = 7; hour <= 22; hour++) {
    const hourStr = String(hour).padStart(2, '0');
    timeSlots.push(`${hourStr}:00`);
    if (hour !== 22) {
      timeSlots.push(`${hourStr}:30`);
    }
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Jam Mulai Custom Dropdown */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">Jam Mulai</label>
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setIsStartTimeOpen(!isStartTimeOpen);
              setIsEndTimeOpen(false);
            }}
            className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-accent focus:bg-white outline-none transition-all font-semibold text-left flex items-center justify-between text-gray-700 shadow-sm cursor-pointer ${
              errorStart ? 'border-danger focus:ring-danger/30' : 'border-gray-250'
            }`}
          >
            <Clock size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <span>{startTime || 'Pilih Jam'}</span>
          </button>

          {isStartTimeOpen && (
            <>
              <div className="fixed inset-0 z-20 cursor-default" onClick={() => setIsStartTimeOpen(false)} />
              <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-ambient z-30 py-2 max-h-56 overflow-y-auto transform-gpu transition-all animate-fade-in">
                {timeSlots.map(slot => (
                  <div
                    key={slot}
                    onClick={() => {
                      onStartTimeChange(slot);
                      setIsStartTimeOpen(false);
                      // If end_time is selected and is before/equal new start_time, reset it
                      if (endTime && endTime <= slot) {
                        onEndTimeChange('');
                      }
                    }}
                    className={`px-4 py-2.5 hover:bg-surface-bright/70 text-sm font-extrabold cursor-pointer border-b border-gray-50 last:border-b-0 transition-colors ${
                      startTime === slot ? 'text-accent bg-accent/5' : 'text-gray-700'
                    }`}
                  >
                    {slot}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Custom Error Helper */}
        {errorStart && (
          <p className="mt-1.5 text-xs font-black text-danger flex items-center gap-1.5 animate-shake">
            <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse"></span>
            {errorStart}
          </p>
        )}
      </div>

      {/* Jam Selesai Custom Dropdown */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">Jam Selesai</label>
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setIsEndTimeOpen(!isEndTimeOpen);
              setIsStartTimeOpen(false);
            }}
            className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-accent focus:bg-white outline-none transition-all font-semibold text-left flex items-center justify-between text-gray-700 shadow-sm cursor-pointer ${
              errorEnd ? 'border-danger focus:ring-danger/30' : 'border-gray-250'
            }`}
          >
            <Clock size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <span>{endTime || 'Pilih Jam'}</span>
          </button>

          {isEndTimeOpen && (
            <>
              <div className="fixed inset-0 z-20 cursor-default" onClick={() => setIsEndTimeOpen(false)} />
              <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-ambient z-30 py-2 max-h-56 overflow-y-auto transform-gpu transition-all animate-fade-in">
                {timeSlots.map(slot => {
                  const isBeforeStart = startTime && slot <= startTime;

                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled={isBeforeStart}
                      onClick={() => {
                        onEndTimeChange(slot);
                        setIsEndTimeOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm font-extrabold transition-colors border-b border-gray-50 last:border-b-0 ${
                        isBeforeStart 
                          ? 'text-gray-300 bg-gray-50/30 cursor-not-allowed'
                          : endTime === slot 
                            ? 'text-accent bg-accent/5' 
                            : 'text-gray-700 hover:bg-surface-bright/70 cursor-pointer'
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Custom Error Helper */}
        {errorEnd && (
          <p className="mt-1.5 text-xs font-black text-danger flex items-center gap-1.5 animate-shake">
            <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse"></span>
            {errorEnd}
          </p>
        )}
      </div>
    </div>
  );
}
