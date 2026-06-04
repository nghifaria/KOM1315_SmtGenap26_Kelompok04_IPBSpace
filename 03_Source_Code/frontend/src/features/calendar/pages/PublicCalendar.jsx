import React, { useEffect, useRef, useState } from 'react';
import { usePublicCalendar } from '../hooks/usePublicCalendar';
import { CaretLeft, CaretRight, CalendarBlank, PlusCircle, X } from '@phosphor-icons/react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { userService } from '../../users/services/userService';

export default function PublicCalendar() {
  const { bookings, facilities, loading, error } = usePublicCalendar();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().getDate());
  const [showDesktopModal, setShowDesktopModal] = useState(false);
  const [borrowerMap, setBorrowerMap] = useState({});
  const dateButtonRefs = useRef({});

  useEffect(() => {
    let isMounted = true;

    const fetchBorrowerNames = async () => {
      if (!user) {
        setBorrowerMap({});
        return;
      }

      try {
        const response = await userService.getAllUsers();
        const users = response?.data?.items || response?.items || [];
        const map = {};

        users.forEach((item) => {
          map[item.id] = item.fullname || item.name || '';
        });

        if (isMounted) {
          setBorrowerMap(map);
        }
      } catch {
        if (isMounted) {
          setBorrowerMap({});
        }
      }
    };

    fetchBorrowerNames();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday

  // Generate grid days including prev and next month padding
  const gridDays = [];
  const prevMonthDate = new Date(year, month, 0);
  const prevMonthDaysCount = prevMonthDate.getDate();
  const prevMonthVal = prevMonthDate.getMonth();
  const prevYearVal = prevMonthDate.getFullYear();

  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    gridDays.push({
      date: prevMonthDaysCount - i,
      month: prevMonthVal,
      year: prevYearVal,
      isCurrentMonth: false
    });
  }

  for (let i = 1; i <= daysInMonth; i++) {
    gridDays.push({
      date: i,
      month: month,
      year: year,
      isCurrentMonth: true
    });
  }

  const nextMonthDate = new Date(year, month + 1, 1);
  const nextMonthVal = nextMonthDate.getMonth();
  const nextYearVal = nextMonthDate.getFullYear();

  const totalCells = 42; // Always 6 rows for stable grid
  const nextDaysNeeded = totalCells - gridDays.length;
  for (let i = 1; i <= nextDaysNeeded; i++) {
    gridDays.push({
      date: i,
      month: nextMonthVal,
      year: nextYearVal,
      isCurrentMonth: false
    });
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleBookingAction = () => {
    navigate('/facilities/explore');
  };

  const getBorrowerName = (booking) => {
    if (!user) return '';
    if (booking.user_id === user.id) {
      return user.fullname || user.name || 'Anda';
    }
    return borrowerMap[booking.user_id] || '';
  };

  useEffect(() => {
    const activeDateButton = dateButtonRefs.current[selectedDate];
    if (activeDateButton) {
      activeDateButton.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [selectedDate, month, year]);

  const getBookingsForDate = (date, m = month, y = year) => {
    return bookings.filter(b => {
      const bookingDate = new Date(b.start_time);
      return bookingDate.getDate() === date && bookingDate.getMonth() === m && bookingDate.getFullYear() === y;
    });
  };

  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

  return (
    <>
      <div className="bg-surface py-8 px-4 md:px-8 min-h-screen flex-1">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 border-b border-surface-high pb-4 gap-4 animate-slide-up">
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-primary flex items-center gap-3">
                <CalendarBlank size={36} weight="duotone" className="text-accent" />
                Kalender Publik
              </h1>
              <p className="text-on-surface-variant mt-2 text-base">Lihat jadwal penggunaan fasilitas kampus untuk merencanakan kegiatan Anda.</p>
            </div>
          </div>

          <div className="bg-surface-lowest rounded-[2rem] shadow-ambient p-6 md:p-8 border border-surface-high animate-slide-up" style={{ animationDelay: '0.08s' }}>
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 bg-surface-lowest p-4 rounded-card shadow-sm border border-surface-high gap-4">
              <h2 className="text-2xl font-black text-primary-container tracking-wide">
                {monthNames[month]} {year}
              </h2>
              <div className="flex items-center gap-4">
                <div className="flex gap-2 border-r border-surface-high pr-4 mr-2">
                  <button onClick={prevMonth} className="p-2 border border-surface-high rounded-btn hover:bg-surface-bright text-primary-container transition-colors shadow-sm">
                    <CaretLeft size={20} weight="bold" />
                  </button>
                  <button onClick={nextMonth} className="p-2 border border-surface-high rounded-btn hover:bg-surface-bright text-primary-container transition-colors shadow-sm">
                    <CaretRight size={20} weight="bold" />
                  </button>
                </div>
                <button 
                  onClick={handleBookingAction}
                  className="flex items-center gap-2 bg-accent text-surface-lowest px-5 py-2.5 rounded-btn font-bold hover:scale-105 transition-all shadow-lg text-sm"
                >
                  <PlusCircle size={20} weight="bold" />
                  Pesan Ruangan
                </button>
              </div>
            </div>

            {loading ? (
              <div className="animate-pulse h-[500px] bg-surface rounded-card"></div>
            ) : error ? (
              <div className="text-center py-20 text-danger bg-error-container rounded-card border border-danger/20">
                <p className="font-bold">{error}</p>
              </div>
            ) : (
              <>
                {/* Desktop Grid */}
                <div className="hidden md:grid grid-cols-7 gap-px bg-surface-high border border-surface-high rounded-[1.5rem] overflow-hidden shadow-inner">
                  {dayNames.map(day => (
                    <div key={day} className="bg-primary-container p-3 text-center font-bold text-surface-lowest text-sm tracking-widest uppercase">
                      {day}
                    </div>
                  ))}
                  
                  {gridDays.map((day, idx) => {
                    const isToday = new Date().getDate() === day.date && new Date().getMonth() === day.month && new Date().getFullYear() === day.year;
                    const dayBookings = getBookingsForDate(day.date, day.month, day.year);

                    return (
                      <div 
                        key={`${day.year}-${day.month}-${day.date}-${idx}`} 
                        onClick={() => { 
                          setSelectedDate(day.date); 
                          if (day.month !== month || day.year !== year) {
                            setCurrentDate(new Date(day.year, day.month, 1));
                          }
                          setShowDesktopModal(true); 
                        }}
                        className={`bg-surface-lowest min-h-[140px] p-3 border-t border-surface-high transition-colors hover:bg-surface-bright cursor-pointer ${
                          !day.isCurrentMonth ? 'bg-surface/40 opacity-60' : ''
                        } ${isToday ? 'bg-secondary/10' : ''}`}
                      >
                        <div className={`text-sm font-bold mb-3 w-8 h-8 flex items-center justify-center rounded-full shadow-sm ${
                          isToday 
                            ? 'bg-accent text-surface-lowest shadow-lg' 
                            : !day.isCurrentMonth 
                              ? 'bg-surface text-on-surface-variant border border-surface-high' 
                              : 'bg-surface-lowest text-on-surface border border-surface-high'
                        }`}>
                          {day.date}
                        </div>
                        <div className="space-y-1.5">
                          {dayBookings.slice(0, 3).map(b => {
                            const facility = facilities.find(f => f.id === b.facility_id);
                            const borrowerName = getBorrowerName(b);
                            const statusLower = b.status?.toLowerCase();
                            let cellClass = 'bg-secondary/10 border border-secondary/20 text-secondary hover:bg-secondary/15';
                            let tooltipStatus = 'Disetujui';
                            if (statusLower === 'pending') {
                              cellClass = 'bg-warning/10 border border-warning/20 text-warning hover:bg-warning/15';
                              tooltipStatus = 'Waitlist';
                            } else if (statusLower === 'ongoing') {
                              cellClass = 'bg-accent/10 border border-accent/20 text-accent hover:bg-accent/15';
                              tooltipStatus = 'Berlangsung';
                            }
                            if (!day.isCurrentMonth) {
                              cellClass += ' opacity-75';
                            }
                            return (
                              <div key={b.id} className={`text-xs px-2 py-1.5 rounded font-semibold truncate transition-colors ${cellClass}`} title={`${b.purpose} - ${facility?.name} (${tooltipStatus})${borrowerName ? ` • Peminjam: ${borrowerName}` : ''}`}>
                                {new Date(b.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {facility?.name || 'Ruangan'}
                                {borrowerName && (
                                  <div className="text-[10px] font-bold mt-0.5 opacity-80 truncate">
                                    Peminjam: {borrowerName}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          {dayBookings.length > 3 && (
                            <div className="text-xs text-accent font-bold pl-1 hover:underline cursor-pointer">+{dayBookings.length - 3} kegiatan lain</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Mobile View */}
                <div className="md:hidden">
                  {/* Horizontal Date Picker */}
                  <div className="flex overflow-x-auto gap-3 pb-6 mb-6 no-scrollbar scroll-smooth">
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const date = i + 1;
                      const isToday = new Date().getDate() === date && new Date().getMonth() === month && new Date().getFullYear() === year;
                      const isSelected = selectedDate === date;
                      const dayName = dayNames[(firstDayOfMonth + i) % 7];
                      const hasBookings = getBookingsForDate(date).length > 0;

                      return (
                        <button
                          key={date}
                          onClick={() => setSelectedDate(date)}
                          ref={(element) => { dateButtonRefs.current[date] = element; }}
                          className={`flex-shrink-0 w-16 h-24 rounded-2xl flex flex-col items-center justify-center transition-all ${
                            isSelected 
                              ? 'bg-accent text-surface-lowest shadow-lg scale-105' 
                              : 'bg-surface-bright text-on-surface-variant border border-surface-high'
                          }`}
                        >
                          <span className={`text-[10px] uppercase font-black mb-1 ${isSelected ? 'text-surface-lowest/80' : 'text-on-surface-variant'}`}>
                            {dayName}
                          </span>
                          <span className="text-xl font-black">{date}</span>
                          {hasBookings && !isSelected && (
                            <div className="w-1 h-1 bg-accent rounded-full mt-1"></div>
                          )}
                          {isToday && !isSelected && (
                            <div className="text-[8px] font-bold mt-1 text-accent uppercase">Hari ini</div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Bookings for Selected Date */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-black text-primary-container text-lg">
                        Jadwal {selectedDate} {monthNames[month]}
                      </h3>
                      <span className="text-xs bg-secondary/10 text-secondary px-3 py-1 rounded-full font-bold">
                        {getBookingsForDate(selectedDate).length} Kegiatan
                      </span>
                    </div>

                    {getBookingsForDate(selectedDate).length > 0 ? (
                      <div className="space-y-3">
                        {getBookingsForDate(selectedDate).map(b => {
                          const facility = facilities.find(f => f.id === b.facility_id);
                          const borrowerName = getBorrowerName(b);
                          const statusLower = b.status?.toLowerCase();
                          let statusStyles = {
                            bg: 'bg-secondary/10 border-secondary/20',
                            iconBg: 'bg-secondary/15 text-secondary',
                            text: 'text-secondary',
                            badge: 'bg-secondary/20 text-secondary',
                            label: 'Disetujui'
                          };
                          
                          if (statusLower === 'pending') {
                            statusStyles = {
                              bg: 'bg-warning/10 border-warning/20',
                              iconBg: 'bg-warning/15 text-warning',
                              text: 'text-warning',
                              badge: 'bg-warning/20 text-warning',
                              label: 'Waitlist'
                            };
                          } else if (statusLower === 'ongoing') {
                            statusStyles = {
                              bg: 'bg-accent/10 border-accent/20',
                              iconBg: 'bg-accent/15 text-accent',
                              text: 'text-accent',
                              badge: 'bg-accent/20 text-accent',
                              label: 'Berlangsung'
                            };
                          }
                          return (
                            <div key={b.id} className={`p-5 rounded-[1.5rem] border shadow-sm ${statusStyles.bg}`}>
                              <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-xl ${statusStyles.iconBg}`}>
                                  <CalendarBlank size={24} weight="fill" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className={`text-xs font-black uppercase tracking-wider ${statusStyles.text}`}>
                                      {new Date(b.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(b.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${statusStyles.badge}`}>{statusStyles.label}</span>
                                  </div>
                                  <h4 className="font-black text-primary-container text-lg leading-tight mb-1">
                                    {facility?.name || 'Fasilitas'}
                                  </h4>
                                  <p className="text-sm text-on-surface-variant font-medium">{b.purpose}</p>
                                  {borrowerName && (
                                    <p className="text-xs text-on-surface-variant font-bold mt-1">
                                      Peminjam: {borrowerName}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-16 bg-surface-bright rounded-[2rem] border-2 border-dashed border-surface-high">
                        <div className="bg-surface w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-on-surface-variant">
                          <CalendarBlank size={32} />
                        </div>
                        <p className="text-on-surface-variant font-bold">Tidak ada jadwal kegiatan</p>
                        <p className="text-sm text-on-surface-variant">Silakan pilih tanggal lain atau pesan sekarang.</p>
                        <button 
                          onClick={handleBookingAction}
                          className="mt-6 text-accent font-black text-sm hover:underline"
                        >
                          Pesan Ruangan Sekarang
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Modal */}
      {showDesktopModal && (
        <div className="fixed inset-0 z-[9999] hidden md:flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-[#02275D]/45 backdrop-blur-[5px] animate-fade-in cursor-default"
            onClick={() => setShowDesktopModal(false)}
          />
          
          {/* Modal Container */}
          <div 
            className="relative bg-white rounded-3xl w-full max-w-lg max-h-[85vh] shadow-2xl animate-slide-up z-10 flex flex-col border border-slate-100 overflow-hidden" 
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-white flex-none">
              <h3 className="font-black text-slate-800 text-lg leading-tight">
                Jadwal {selectedDate} {monthNames[month]} {year}
              </h3>
              <button 
                onClick={() => setShowDesktopModal(false)} 
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-650 hover:bg-slate-50 transition-colors"
              >
                <X size={20} weight="bold" />
              </button>
            </div>
            <div className="flex-1 min-h-0 p-6 overflow-y-auto space-y-3 bg-slate-50/20">
              {getBookingsForDate(selectedDate).length > 0 ? (
                getBookingsForDate(selectedDate).map(b => {
                  const facility = facilities.find(f => f.id === b.facility_id);
                  const borrowerName = getBorrowerName(b);
                  const statusLower = b.status?.toLowerCase();
                  let statusStyles = {
                    bg: 'bg-secondary/10 border-secondary/20',
                    text: 'text-secondary',
                    badge: 'bg-secondary/20 text-secondary',
                    label: 'Disetujui'
                  };
                  
                  if (statusLower === 'pending') {
                    statusStyles = {
                      bg: 'bg-warning/10 border-warning/20',
                      text: 'text-warning',
                      badge: 'bg-warning/20 text-warning',
                      label: 'Waitlist'
                    };
                  } else if (statusLower === 'ongoing') {
                    statusStyles = {
                      bg: 'bg-primary/10 border-primary/20',
                      text: 'text-primary',
                      badge: 'bg-primary/20 text-primary',
                      label: 'Berlangsung'
                    };
                  }
                  return (
                    <div key={b.id} className={`p-4 rounded-2xl border shadow-sm ${statusStyles.bg}`}>
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-xs font-black uppercase tracking-wider ${statusStyles.text}`}>
                          {new Date(b.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(b.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${statusStyles.badge}`}>{statusStyles.label}</span>
                      </div>
                      <h4 className="font-bold text-primary-container text-base mb-1">
                        {facility?.name || 'Fasilitas'}
                      </h4>
                      <p className="text-sm text-on-surface-variant font-semibold">{b.purpose}</p>
                      {borrowerName && (
                        <p className="text-xs text-on-surface-variant font-bold mt-1">
                          Peminjam: {borrowerName}
                        </p>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <CalendarBlank size={48} weight="duotone" className="mx-auto mb-3 opacity-50" />
                  <p className="font-bold text-sm">Tidak ada jadwal kegiatan</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-200 bg-slate-50 flex-none rounded-b-3xl">
              <button 
                onClick={handleBookingAction} 
                className="w-full bg-accent text-white py-3 rounded-xl font-bold hover:bg-accent-hover transition-all shadow-md"
              >
                Pesan Ruangan Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
