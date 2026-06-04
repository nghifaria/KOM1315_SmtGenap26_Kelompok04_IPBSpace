import React, { useState, useEffect, useMemo } from 'react';
import { 
  Door, 
  CalendarCheck, 
  Users, 
  Warning, 
  ArrowsClockwise,
  CaretLeft,
  CaretRight,
  CalendarBlank
} from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { bookingService } from '../../bookings/services/bookingService';
import { facilityService } from '../../facilities/services/facilityService';
import { userService } from '../../users/services/userService';
import toast from 'react-hot-toast';
import StatCard from '../../../shared/components/ui/AdminCard/StatCard';
import AdminPageHeader from '../../../shared/components/ui/AdminHeader/AdminPageHeader';
import ConfirmModal from '../../../shared/components/ui/Modal/ConfirmModal';

export default function SuperAdminDashboard() {
  const [bookings, setBookings] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);

  const fetchAllData = async () => {
    try {
      setIsLoading(true);
      const [bookingsRes, facilitiesRes, usersRes] = await Promise.allSettled([
        bookingService.getAllBookings(),
        facilityService.getAllFacilities(),
        userService.getAllUsers()
      ]);

      const safeExtract = (result, ...paths) => {
        if (result.status !== 'fulfilled') return [];
        const v = result.value;
        for (const path of paths) {
          const val = path.split('.').reduce((o, k) => o?.[k], v);
          if (Array.isArray(val)) return val;
        }
        return [];
      };

      setBookings(safeExtract(bookingsRes, 'data.items', 'items', 'data'));
      setFacilities(safeExtract(facilitiesRes, 'data.items', 'items', 'data'));
      setUsers(safeExtract(usersRes, 'data.items', 'items', 'data'));
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengambil data ringkasan dashboard.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // --- STATS CALCULATION ---
  const activeFacilities = useMemo(() => {
    return facilities.filter(f => f.is_active).length;
  }, [facilities]);

  const pendingBookings = useMemo(() => {
    return bookings.filter(b => b.status?.toLowerCase() === 'pending').length;
  }, [bookings]);

  const civitasCount = useMemo(() => {
    return users.filter(u => u.role?.toLowerCase() === 'civitas').length;
  }, [users]);

  const managerCount = useMemo(() => {
    return users.filter(u => u.role?.toLowerCase() === 'facilityadmin' || u.role?.toLowerCase() === 'facility_manager').length;
  }, [users]);

  // --- USER & FACILITY LOOKUP MAPS ---
  const facilityMap = useMemo(() => {
    const map = {};
    facilities.forEach(f => {
      map[f.id] = f.name;
    });
    return map;
  }, [facilities]);

  const userMap = useMemo(() => {
    const map = {};
    users.forEach(u => {
      map[u.id] = u.fullname;
    });
    return map;
  }, [users]);

  // --- WEEKLY CHART DATA ---
  const weekRange = useMemo(() => {
    const today = new Date();
    const currentDay = today.getDay();
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() + distanceToMonday + weekOffset * 7);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    return { start: startOfWeek, end: endOfWeek };
  }, [weekOffset]);

  const formattedWeekRangeLabel = useMemo(() => {
    const optStart = { day: 'numeric', month: 'short' };
    const optEnd = { day: 'numeric', month: 'short', year: 'numeric' };
    
    if (weekRange.start.getFullYear() !== weekRange.end.getFullYear()) {
      optStart.year = 'numeric';
    }
    
    const startStr = weekRange.start.toLocaleDateString('id-ID', optStart);
    const endStr = weekRange.end.toLocaleDateString('id-ID', optEnd);
    return `${startStr} - ${endStr}`;
  }, [weekRange]);

  const weeklyChartData = useMemo(() => {
    const dayNames = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
    const days = dayNames.map((name, index) => {
      const d = new Date(weekRange.start);
      d.setDate(weekRange.start.getDate() + index);
      return {
        day: name,
        dateStr: d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        fullDate: d.toISOString().split('T')[0],
        value: 0
      };
    });

    bookings.forEach(b => {
      const dateStr = b.date_of_booking || b.start_time;
      if (!dateStr) return;
      const bDateOnly = dateStr.split('T')[0];
      const match = days.find(d => d.fullDate === bDateOnly);
      if (match) {
        match.value++;
      }
    });

    const maxVal = Math.max(...days.map(d => d.value), 1);
    return days.map(d => ({
      ...d,
      heightPercent: Math.round((d.value / maxVal) * 100)
    }));
  }, [bookings, weekRange]);

  // --- TOP ROOMS FREQUENCY MAP ---
  const topRooms = useMemo(() => {
    const freqMap = {};
    bookings.forEach(b => {
      if (b.facility_id) {
        freqMap[b.facility_id] = (freqMap[b.facility_id] || 0) + 1;
      }
    });
    return Object.entries(freqMap)
      .map(([facilityId, count]) => ({ facilityId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [bookings]);

  const rankBadges = [
    { label: '1', color: 'bg-amber-500 text-white font-black text-xs' },
    { label: '2', color: 'bg-slate-400 text-white font-black text-xs' },
    { label: '3', color: 'bg-amber-700 text-white font-black text-xs' },
  ];

  // --- RECENT ACTIVITIES ---
  const recentBookings = useMemo(() => {
    return [...bookings]
      .sort((a, b) => new Date(b.created_at || b.date_of_booking) - new Date(a.created_at || a.date_of_booking))
      .slice(0, 5);
  }, [bookings]);

  const getActionText = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'approved')  return 'Menyetujui peminjaman';
    if (s === 'rejected')  return 'Menolak peminjaman';
    if (s === 'canceled' || s === 'cancelled') return 'Membatalkan peminjaman';
    if (s === 'checked-in' || s === 'checked_in') return 'Check-in ruangan';
    if (s === 'pending')   return 'Mengajukan peminjaman';
    return 'Memperbarui peminjaman';
  };

  // --- EMERGENCY LOCKDOWN CONTROL ---


  const headerActions = (
    <button 
      onClick={fetchAllData}
      disabled={isLoading}
      className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-primary hover:border-primary/50 rounded-btn font-bold text-sm shadow-sm transition-all active:scale-95 disabled:opacity-50"
    >
      <ArrowsClockwise size={18} className={isLoading ? 'animate-spin' : ''} /> Refresh Data
    </button>
  );

  return (
    <div className="flex flex-col gap-6 w-full animate-slide-up">
      <AdminPageHeader 
        title="Dashboard Utama"
        description="Ringkasan operasi, kontrol darurat, dan log audit sistem IPB Space."
        actions={headerActions}
      />

      {/* 4 TOP STAT CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Reservasi"
          value={isLoading ? '-' : bookings.length}
          description="Seluruh catatan peminjaman ruangan oleh civitas."
          icon={CalendarCheck}
          colorTheme="blue"
        />

        <StatCard 
          title="Pengguna & Operator"
          value={isLoading ? '-' : users.length}
          description={isLoading ? 'Memuat data...' : `${civitasCount} Civitas & ${managerCount} Admin terdaftar.`}
          icon={Users}
          colorTheme="purple"
        />

        <StatCard 
          title="Ruangan Aktif"
          value={isLoading ? '-' : `${activeFacilities}/${facilities.length}`}
          description="Ruangan aktif dari total ruangan terdaftar."
          icon={Door}
          colorTheme="emerald"
        />

        <StatCard 
          title="Antrean Validasi"
          value={isLoading ? '-' : pendingBookings}
          description="Peminjaman aktif menunggu persetujuan admin."
          icon={Warning}
          colorTheme="orange"
        />
      </div>

      {/* CHART & POPULAR ROOMS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Dynamic Weekly Booking Chart */}
        <div className="bg-white p-6 rounded-card shadow-sm border border-slate-100 lg:col-span-2 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
            <div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight">Statistik Peminjaman Mingguan</h3>
                <p className="text-sm font-semibold text-slate-400 mt-0.5">Jumlah reservasi per hari berdasarkan tanggal pemesanan.</p>
            </div>
            
            {/* Week navigation controls */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setWeekOffset(prev => prev - 1)}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-all active:scale-95"
                title="Minggu Lalu"
              >
                <CaretLeft size={16} weight="bold" />
              </button>
              
              <button
                onClick={() => setWeekOffset(0)}
                disabled={weekOffset === 0}
                className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-50 transition-all active:scale-95"
              >
                Minggu Ini
              </button>
              
              <button 
                onClick={() => setWeekOffset(prev => prev + 1)}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-all active:scale-95"
                title="Minggu Depan"
              >
                <CaretRight size={16} weight="bold" />
              </button>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Periode Tanggal</span>
            <span className="text-sm font-black text-primary bg-primary/5 px-2.5 py-1 rounded-md border border-primary/10">
              {formattedWeekRangeLabel}
            </span>
          </div>

          <div className="h-56 flex items-end justify-between gap-2 md:gap-4 pt-4 border-b border-slate-100 pb-2 relative">
            {/* Y-Axis Grid Lines */}
            <div className="absolute left-0 w-full h-full flex flex-col justify-between pointer-events-none pb-8 opacity-30">
              <div className="border-t border-dashed border-slate-350 w-full"></div>
              <div className="border-t border-dashed border-slate-350 w-full"></div>
              <div className="border-t border-dashed border-slate-350 w-full"></div>
            </div>

            {weeklyChartData.map((data, index) => (
              <div key={index} className="flex flex-col items-center w-full group z-10 h-full justify-end relative">
                {/* Tooltip on hover - Absolutely positioned above the bar container */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] font-bold py-1 px-2 rounded-md pointer-events-none shadow-md whitespace-nowrap z-30">
                  {data.value} Reservasi ({data.dateStr})
                </div>
                
                {/* Dynamic Bar Wrapper - holds bar with constrained max height */}
                <div className="w-full flex-grow flex flex-col justify-end max-h-[140px] mb-2">
                  <div 
                    className="w-full max-w-[36px] mx-auto bg-accent/20 hover:bg-accent rounded-t-lg transition-all cursor-pointer border-b-2 border-accent relative overflow-hidden group-hover:shadow-md"
                    style={{ height: `${data.heightPercent}%`, minHeight: data.value > 0 ? '8px' : '2px' }}
                  >
                    <div className="absolute bottom-0 w-full bg-gradient-to-t from-accent/30 to-transparent h-1/2"></div>
                  </div>
                </div>
                
                {/* Day Label */}
                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{data.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Rooms Ranking */}
        <div className="bg-white p-6 rounded-card shadow-sm border border-slate-100 lg:col-span-1 flex flex-col justify-between">
          <div>
            <h3 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Ruangan Teratas</h3>
            <p className="text-base font-semibold text-slate-400 mt-1">Paling sering dipinjam oleh civitas.</p>
            
            <div className="mt-6 space-y-4">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-3 animate-pulse">
                      <div className="w-8 h-8 rounded-full bg-slate-100 shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3.5 bg-slate-100 rounded w-2/3" />
                        <div className="h-3 bg-slate-100 rounded w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : topRooms.length === 0 ? (
                <div className="py-8 text-center">
                  <CalendarBlank size={32} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-base font-bold text-slate-400">Belum ada data peminjaman.</p>
                </div>
              ) : (
                topRooms.map((room, idx) => {
                  const badge = rankBadges[idx] || { label: `${idx + 1}`, color: 'bg-slate-100 text-slate-500 font-bold text-xs' };
                  return (
                    <div key={idx} className="flex items-center gap-3.5 p-3 rounded-xl border border-slate-50 bg-slate-50/30 hover:border-slate-100 transition-colors">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-black/5 shadow-sm ${badge.color}`}>
                        {badge.label}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-base font-bold text-slate-750 truncate">{facilityMap[room.facilityId] || `Fasilitas #${room.facilityId}`}</h4>
                        <p className="text-sm font-semibold text-slate-450 mt-0.5">{room.count} kali dipinjam</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          
          <div className="pt-4 border-t border-slate-100 mt-6 text-center">
            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">
              Data Frekuensi Akumulatif
            </span>
          </div>
        </div>
      </div>

      {/* RECENT ACTIVITIES TABLE */}
      <div className="bg-white rounded-card shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Aktivitas Terbaru</h3>
            <p className="text-base font-semibold text-slate-450 mt-1">Transaksi peminjaman yang baru saja masuk atau diperbarui.</p>
          </div>
          <Link 
            to="/admin/super/audit"
            className="text-base font-black text-accent hover:text-accent/80 transition-colors px-4 py-2 bg-accent/5 rounded-lg border border-accent/10 shadow-sm"
          >
            Lihat Semua Log
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="py-4 px-6 text-sm font-black text-slate-500 uppercase tracking-wider">Pemohon</th>
                <th className="py-4 px-6 text-sm font-black text-slate-500 uppercase tracking-wider">Aksi & Ruangan</th>
                <th className="py-4 px-6 text-sm font-black text-slate-500 uppercase tracking-wider">Terakhir Update</th>
                <th className="py-4 px-6 text-sm font-black text-slate-500 uppercase tracking-wider text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="4" className="py-10 text-center text-slate-400 text-sm font-bold animate-pulse">
                    Memuat data aktivitas terbaru...
                  </td>
                </tr>
              ) : recentBookings.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-10 text-center text-slate-400 text-sm font-bold">
                    Belum ada aktivitas terdaftar.
                  </td>
                </tr>
              ) : (
                recentBookings.map((b, idx) => {
                  const status = (b.status || '').toLowerCase();
                  let statusBadge = 'bg-slate-100 text-slate-800';
                  let statusLabel = b.status;
                  
                  if (status === 'approved' || status === 'checked-in' || status === 'checked_in') {
                    statusBadge = 'bg-emerald-100 text-emerald-800 border border-emerald-200';
                    statusLabel = 'Berhasil';
                  } else if (status === 'rejected') {
                    statusBadge = 'bg-red-100 text-red-800 border border-red-200';
                    statusLabel = 'Gagal';
                  } else if (status === 'canceled' || status === 'cancelled') {
                    statusBadge = 'bg-slate-100 text-slate-600 border border-slate-200';
                    statusLabel = 'Dibatalkan';
                  } else {
                    statusBadge = 'bg-amber-100 text-amber-800 border border-amber-200';
                    statusLabel = 'Pending';
                  }

                  const userName = userMap[b.user_id] || `Pemohon #${b.user_id}`;
                  const roomName = facilityMap[b.facility_id] || 'Ruangan';
                  const actionText = getActionText(b.status);
                  
                  const updatedTs = b.updated_at || b.created_at || b.date_of_booking;
                  const formattedUpdatedAt = updatedTs 
                    ? new Date(updatedTs).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB'
                    : '-';

                  return (
                    <tr key={idx} className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-700 text-sm">{userName}</td>
                      <td className="py-3.5 px-6">
                        <div className="font-bold text-slate-700 text-sm">{actionText}</div>
                        <div className="text-sm font-semibold text-slate-450 mt-0.5">{roomName}</div>
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-500 text-sm">{formattedUpdatedAt}</td>
                      <td className="py-3.5 px-6 text-center w-28">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold inline-block w-max ${statusBadge}`}>
                          {statusLabel}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EMERGENCY CONTROL PANEL (FULL WIDTH AT BOTTOM) */}
    </div>
  );
}
