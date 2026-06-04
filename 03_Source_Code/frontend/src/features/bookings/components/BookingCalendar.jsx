import React, { useState } from 'react';
import { CalendarBlank, CaretLeft, CaretRight } from '@phosphor-icons/react';

export default function BookingCalendar({ selectedDate, onDateSelect, error }) {
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [isExpanded, setIsExpanded] = useState(!selectedDate);

  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday

  const startOffset = (firstDayIndex + 6) % 7; // Monday first

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  const dayNamesShort = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

  const handleDateSelect = (dayNum) => {
    const selectedDateObj = new Date(year, month, dayNum);
    const cellYyyy = selectedDateObj.getFullYear();
    const cellMm = String(selectedDateObj.getMonth() + 1).padStart(2, '0');
    const cellDd = String(selectedDateObj.getDate()).padStart(2, '0');
    const dateString = `${cellYyyy}-${cellMm}-${cellDd}`;
    onDateSelect(dateString);
    setIsExpanded(false); // Auto collapse
  };

  const nextMonth = () => {
    setCalendarMonth(new Date(year, month + 1, 1));
  };

  const prevMonth = () => {
    const today = new Date();
    if (year > today.getFullYear() || (year === today.getFullYear() && month > today.getMonth())) {
      setCalendarMonth(new Date(year, month - 1, 1));
    }
  };

  const getFormattedSelectedDate = () => {
    if (!selectedDate) return '';
    const [y, m, d] = selectedDate.split('-');
    const dateObj = new Date(y, m - 1, d);
    return `${dateObj.getDate()} ${monthNames[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
  };

  return (
    <div>
      <label className="block text-sm font-bold text-gray-700 mb-2">Tanggal Peminjaman</label>
      
      {!isExpanded && selectedDate ? (
        /* Collapsed Elegant State Card */
        <div 
          onClick={() => setIsExpanded(true)}
          className={`border rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all shadow-sm group active:scale-99 ${
            error ? 'bg-red-50/50 border-danger' : 'bg-accent/5 border-accent/25 hover:bg-accent/10'
          }`}
          title="Klik untuk mengubah tanggal"
        >
          <div className="flex items-center gap-3">
            <div className="bg-accent text-white p-2.5 rounded-xl shadow-md group-hover:scale-105 transition-transform">
              <CalendarBlank size={20} weight="fill" />
            </div>
            <div>
              <p className="text-[9px] uppercase font-black text-accent tracking-widest leading-none">Tanggal Terpilih</p>
              <p className="text-sm font-black text-primary uppercase mt-1 leading-none">{getFormattedSelectedDate()}</p>
            </div>
          </div>
          
          <button
            type="button"
            className="text-[11px] bg-white hover:bg-gray-50 border border-gray-250 px-3 py-1.5 rounded-lg text-primary font-black shadow-sm transition-all active:scale-95"
          >
            Ubah Tanggal
          </button>
        </div>
      ) : (
        /* Expanded Calendar Month Selector Grid */
        <div className={`bg-gray-50 border rounded-2xl p-4 shadow-inner space-y-4 animate-fade-in ${
          error ? 'border-danger/70' : 'border-gray-200'
        }`}>
          {/* Month navigation header */}
          <div className="flex justify-between items-center bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 hover:bg-gray-50 text-gray-600 rounded-lg border border-gray-100 transition-colors cursor-pointer active:scale-95"
            >
              <CaretLeft size={16} weight="bold" />
            </button>
            <span className="font-extrabold text-sm text-primary uppercase tracking-wider">
              {monthNames[month]} {year}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 hover:bg-gray-50 text-gray-600 rounded-lg border border-gray-100 transition-colors cursor-pointer active:scale-95"
            >
              <CaretRight size={16} weight="bold" />
            </button>
          </div>

          {/* Day Names Grid */}
          <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-black uppercase text-gray-400 tracking-wider">
            {dayNamesShort.map(day => (
              <div key={day} className="py-1">{day}</div>
            ))}
          </div>

          {/* Day Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {/* Offsets */}
            {Array.from({ length: startOffset }).map((_, i) => (
              <div key={`offset-${i}`} className="aspect-square"></div>
            ))}

            {/* Active days list */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              
              const dateOfCell = new Date(year, month, dayNum);
              dateOfCell.setHours(0, 0, 0, 0);

              const isPast = dateOfCell < today;
              
              const cellYyyy = dateOfCell.getFullYear();
              const cellMm = String(dateOfCell.getMonth() + 1).padStart(2, '0');
              const cellDd = String(dateOfCell.getDate()).padStart(2, '0');
              const cellDateStr = `${cellYyyy}-${cellMm}-${cellDd}`;

              const isSelected = selectedDate === cellDateStr;
              const isCurrentDay = today.getTime() === dateOfCell.getTime();

              return (
                <button
                  key={dayNum}
                  type="button"
                  disabled={isPast}
                  onClick={() => handleDateSelect(dayNum)}
                  className={`aspect-square rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center relative ${
                    isPast
                      ? 'bg-transparent text-gray-300 border-transparent cursor-not-allowed'
                      : isSelected
                        ? 'bg-accent text-white border-accent shadow-md shadow-accent/20 font-black scale-105 active:scale-95'
                        : isCurrentDay
                          ? 'bg-white text-accent border-accent/30 hover:bg-gray-100/50 active:scale-95'
                          : 'bg-white hover:bg-gray-100 text-gray-700 border-gray-200/60 active:scale-95 shadow-sm'
                  }`}
                >
                  <span>{dayNum}</span>
                  {isCurrentDay && !isSelected && (
                    <span className="absolute bottom-1 w-1 h-1 bg-accent rounded-full"></span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Expanded footer actions */}
          <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-100/65">
            <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">
              {selectedDate ? 'Terpilih: ' + getFormattedSelectedDate() : 'Silakan pilih tanggal'}
            </p>
            {selectedDate && (
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="text-xs font-black text-accent bg-white border border-accent/25 hover:bg-accent/5 px-4 py-2 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                Selesai
              </button>
            )}
          </div>
        </div>
      )}

      {/* Custom Error Helper */}
      {error && (
        <p className="mt-2 text-xs font-black text-danger flex items-center gap-1.5 animate-shake">
          <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse"></span>
          {error}
        </p>
      )}
    </div>
  );
}
