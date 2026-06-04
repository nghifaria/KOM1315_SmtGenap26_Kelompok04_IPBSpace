import React, { useState, useEffect, useMemo } from 'react';
import { CalendarCheck, Door, ClockCounterClockwise, IdentificationBadge } from '@phosphor-icons/react';
import { bookingService } from '../../bookings/services/bookingService';
import { facilityService } from '../../facilities/services/facilityService';
import { userService } from '../../users/services/userService';
import { useValidationLookup } from '../../facilities/hooks/useValidationLookup';

export default function FacilityAdminOverview() {
  const [bookings, setBookings] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [facilityAdminCount, setFacilityAdminCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const { isLookupLoading, facilityMap, userMap } = useValidationLookup();

  useEffect(() => {
    let isMounted = true;
    
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        // allSettled: one failing endpoint (e.g. /users/ 403) won't wipe bookings & facilities
        const [bookingsResult, facilitiesResult, usersResult] = await Promise.allSettled([
          bookingService.getAllBookings(),
          facilityService.getAllFacilities(),
          userService.getAllUsers()
        ]);

        if (isMounted) {
          const extractArray = (result) => {
            if (result.status !== 'fulfilled') return [];
            const v = result.value;
            if (Array.isArray(v?.data?.items)) return v.data.items;
            if (Array.isArray(v?.items)) return v.items;
            if (Array.isArray(v?.data)) return v.data;
            if (Array.isArray(v)) return v;
            return [];
          };

          const bList = extractArray(bookingsResult);
          const fList = extractArray(facilitiesResult);
          const uList = extractArray(usersResult);

          setBookings(bList);
          setFacilities(fList);
          setFacilityAdminCount(
            uList.filter(u => u.role && (
              u.role.toLowerCase() === 'facility_manager' || 
              u.role.toLowerCase() === 'facilityadmin'
            )).length
          );
        }
      } catch (error) {
        console.error("Gagal memuat data dashboard:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchDashboardData();
    return () => { isMounted = false; };
  }, []);

  // --- DYNAMIC STAT CARD COMPUTATIONS ---
  const totalBookings = bookings.length;
  const pendingCount = bookings.filter(b => b.status && b.status.toLowerCase() === 'pending').length;
  const activeFacilities = facilities.filter(f => !f.condition || f.condition.toLowerCase() === 'good' || f.condition.toLowerCase() === 'tersedia').length;

  // --- DYNAMIC TOP ROOMS (Frequency Map) ---
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
    { icon: '🏆', color: 'bg-yellow-100 text-yellow-600' },
    { icon: '🥈', color: 'bg-slate-100 text-slate-500' },
    { icon: '🥉', color: 'bg-orange-100 text-orange-600' },
  ];

  // --- DYNAMIC WEEKLY BAR CHART ---
  const weeklyData = useMemo(() => {
    const dayLabels = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const counts = [0, 0, 0, 0, 0, 0, 0]; // Sun=0 through Sat=6

    bookings.forEach(b => {
      const dateStr = b.date_of_booking || b.start_time;
      if (!dateStr) return;
      const dayIndex = new Date(dateStr).getDay(); // 0=Sun, 6=Sat
      counts[dayIndex]++;
    });

    // Reorder: Mon(1), Tue(2), Wed(3), Thu(4), Fri(5), Sat(6), Sun(0)
    const ordered = [
      { day: 'Sen', value: counts[1] },
      { day: 'Sel', value: counts[2] },
      { day: 'Rab', value: counts[3] },
      { day: 'Kam', value: counts[4] },
      { day: 'Jum', value: counts[5] },
      { day: 'Sab', value: counts[6] },
      { day: 'Min', value: counts[0] },
    ];

    const maxCount = Math.max(...ordered.map(d => d.value), 1); // min 1 to avoid division by zero
    return ordered.map(d => ({
      ...d,
      heightPercent: Math.round((d.value / maxCount) * 100)
    }));
  }, [bookings]);

  // --- DYNAMIC RECENT ACTIVITY ---
  const recentBookings = useMemo(() => {
    return [...bookings]
      .sort((a, b) => new Date(a.created_at || a.date_of_booking) - new Date(b.created_at || b.date_of_booking))
      .slice(0, 3);
  }, [bookings]);

  const getActionText = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'approved')  return 'Menyetujui peminjaman';
    if (s === 'rejected')  return 'Menolak peminjaman';
    // Handle both backend spellings defensively
    if (s === 'canceled' || s === 'cancelled') return 'Membatalkan peminjaman';
    if (s === 'checked-in' || s === 'checked_in') return 'Check-in ruangan';
    if (s === 'pending')   return 'Mengajukan peminjaman';
    return 'Memperbarui peminjaman';
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, colorClass }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5 transition-transform hover:-translate-y-1">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${colorClass}`}>
        <Icon size={28} weight="duotone" />
      </div>
      <div>
        <p className="text-sm font-bold text-slate-500 mb-1">{title}</p>
        <div className="flex items-baseline gap-2">
          <h3 className="text-2xl font-black text-slate-800 tracking-tight">
            {isLoading || isLookupLoading ? '-' : value}
          </h3>
          {subtitle && <span className="text-xs font-semibold text-slate-400">{subtitle}</span>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex-grow p-4 md:p-8 bg-[#F4F7FB] pt-[64px] md:pt-8 min-h-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-black text-primary mb-1 tracking-tight">Dashboard Utama</h1>
        <p className="text-slate-500 text-sm font-medium">Ringkasan aktivitas peminjaman dan ketersediaan fasilitas IPB Space.</p>
      </div>

      {/* 4 Top Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total Peminjaman" 
          value={totalBookings} 
          subtitle="transaksi"
          icon={CalendarCheck} 
          colorClass="bg-blue-50 text-blue-600" 
        />
        <StatCard 
          title="Ruangan Aktif" 
          value={`${activeFacilities}/${facilities.length}`} 
          subtitle="tersedia"
          icon={Door} 
          colorClass="bg-emerald-50 text-emerald-600" 
        />
        <StatCard 
          title="Menunggu Validasi" 
          value={pendingCount} 
          subtitle="permohonan"
          icon={ClockCounterClockwise} 
          colorClass="bg-amber-50 text-amber-600" 
        />
        <StatCard 
          title="Total Facility Admin" 
          value={facilityAdminCount} 
          subtitle="operator aktif"
          icon={IdentificationBadge} 
          colorClass="bg-purple-50 text-purple-600" 
        />
      </div>

      {/* Middle Row: Chart & Top Rooms */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Dynamic CSS Bar Chart */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Statistik Peminjaman Mingguan</h3>
              <p className="text-sm font-medium text-slate-500 mt-0.5">Distribusi reservasi berdasarkan hari dalam minggu.</p>
            </div>
          </div>
          
          <div className="h-64 flex items-end justify-between gap-2 md:gap-6 pt-4 border-b border-slate-100 pb-2 relative">
            {/* Y-Axis Grid Lines */}
            <div className="absolute left-0 w-full h-full flex flex-col justify-between pointer-events-none pb-8 opacity-40">
              <div className="border-t border-dashed border-slate-200 w-full"></div>
              <div className="border-t border-dashed border-slate-200 w-full"></div>
              <div className="border-t border-dashed border-slate-200 w-full"></div>
              <div className="border-t border-dashed border-slate-200 w-full"></div>
            </div>

            {weeklyData.map((data, index) => (
              <div key={index} className="flex flex-col items-center gap-3 w-full group z-10 h-full justify-end">
                {/* Tooltip on hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs font-bold py-1.5 px-3 rounded-lg -translate-y-2 pointer-events-none shadow-md">
                  {data.value} Trx
                </div>
                
                {/* Dynamic Bar — inline style for true data-driven height */}
                <div 
                  className="w-full max-w-[40px] md:max-w-[60px] bg-accent/20 hover:bg-accent rounded-t-xl transition-all cursor-pointer border-b-4 border-accent relative overflow-hidden group-hover:shadow-md"
                  style={{ height: `${data.heightPercent}%`, minHeight: data.value > 0 ? '8px' : '2px' }}
                >
                  <div className="absolute bottom-0 w-full bg-gradient-to-t from-accent/40 to-transparent h-1/2"></div>
                </div>
                
                {/* Day Label */}
                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{data.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Top Rooms Ranking */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 lg:col-span-1">
          <div>
            <h3 className="text-lg font-black text-slate-800 tracking-tight">Ruangan Teratas</h3>
            <p className="text-sm font-medium text-slate-500 mt-0.5">Paling sering dipinjam.</p>
          </div>
          <div className="mt-8 space-y-6">
            {isLoading || isLookupLoading ? (
              <p className="text-sm text-slate-400 animate-pulse font-medium">Menghitung frekuensi...</p>
            ) : topRooms.length === 0 ? (
              <p className="text-sm text-slate-400 font-medium">Belum ada data peminjaman.</p>
            ) : (
              topRooms.map((room, idx) => {
                const badge = rankBadges[idx] || { icon: `${idx + 1}`, color: 'bg-slate-50 text-slate-400 font-black' };
                return (
                  <div key={idx} className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm ${badge.color}`}>
                      {badge.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-slate-700">{facilityMap[room.facilityId] || `Fasilitas #${room.facilityId}`}</h4>
                      <p className="text-xs font-semibold text-slate-400">{room.count} kali dipinjam</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row: Mini Activity Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-800 tracking-tight">Aktivitas Terbaru</h3>
            <p className="text-sm font-medium text-slate-500 mt-0.5">Transaksi peminjaman yang baru saja diperbarui.</p>
          </div>
          <button className="text-sm font-bold text-accent hover:text-accent/80 transition-colors px-4 py-2 bg-accent/10 rounded-lg">
            Lihat Semua
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-wider">Pemohon</th>
                <th className="py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-wider">Aksi & Ruangan</th>
                <th className="py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-wider">Dibuat Pada</th>
                <th className="py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-wider">Terakhir Update</th>
                <th className="py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-wider text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading || isLookupLoading ? (
                <tr><td colSpan="5" className="py-8 text-center text-slate-400 text-sm font-medium animate-pulse">Memuat data aktivitas...</td></tr>
              ) : recentBookings.length === 0 ? (
                <tr><td colSpan="5" className="py-8 text-center text-slate-400 text-sm font-medium">Belum ada aktivitas.</td></tr>
              ) : (
                recentBookings.map((b, idx) => {
                  const status = (b.status || '').toLowerCase();
                  let statusBadge = '';
                  let statusLabel = b.status;
                  if (status === 'approved' || status === 'checked-in' || status === 'checked_in') {
                    statusBadge = 'bg-green-100 text-green-800 font-semibold rounded-full px-2.5 py-1 text-xs w-full text-center inline-block';
                    statusLabel = 'Berhasil';
                  } else if (status === 'rejected') {
                    statusBadge = 'bg-red-100 text-red-800 font-semibold rounded-full px-2.5 py-1 text-xs w-full text-center inline-block';
                    statusLabel = 'Gagal';
                  } else if (status === 'canceled' || status === 'cancelled') {
                    statusBadge = 'bg-slate-100 text-slate-600 font-semibold rounded-full px-2.5 py-1 text-xs w-full text-center inline-block';
                    statusLabel = 'Dibatalkan';
                  } else {
                    statusBadge = 'bg-yellow-100 text-yellow-800 font-semibold rounded-full px-2.5 py-1 text-xs w-full text-center inline-block';
                    statusLabel = 'Pending';
                  }

                  const userName = userMap[b.user_id] || `Pemohon #${b.user_id}`;
                  const roomName = facilityMap[b.facility_id] || 'Ruangan';
                  const actionText = getActionText(b.status);
                  
                  const createdTs = b.created_at || b.date_of_booking;
                  const formattedCreatedAt = createdTs ? new Date(createdTs).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';
                  
                  const updatedTs = b.updated_at || b.created_at || b.date_of_booking;
                  const formattedUpdatedAt = updatedTs ? new Date(updatedTs).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';

                  return (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-700 text-sm">{userName}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-700 text-sm">{actionText}</div>
                        <div className="text-xs font-semibold text-slate-500 mt-1">{roomName}</div>
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-600 text-sm">{formattedCreatedAt}</td>
                      <td className="py-4 px-6 font-semibold text-slate-600 text-sm">{formattedUpdatedAt}</td>
                      <td className="py-4 px-6 w-32">
                        <span className={statusBadge}>{statusLabel}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
