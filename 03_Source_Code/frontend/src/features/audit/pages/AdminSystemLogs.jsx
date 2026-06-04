import React, { useState, useEffect } from 'react';
import { MagnifyingGlass, Download, CaretRight, Scroll, DotsThreeVertical, Door } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { bookingService } from '../../bookings/services/bookingService';
import { useValidationLookup } from '../../facilities/hooks/useValidationLookup';
import { toast } from 'react-hot-toast';

export default function AdminSystemLogs() {
  // Phase 1: Local States Setup
  const [searchQuery, setSearchQuery] = useState('');
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const { facilityMap, userMap, userIdnumMap, isLookupLoading } = useValidationLookup();

  useEffect(() => {
    let isMounted = true;
    
    const fetchLogs = async () => {
      try {
        setIsLoading(true);
        const res = await bookingService.getAllBookings();
        if (isMounted) {
          const allBookings = res.data?.items || res.items || res.data || [];
          
          // Process booking history into audit log format — 100% data-driven, zero mock entries
          const dynamicLogs = allBookings
            .filter(b => b.status && b.status.toLowerCase() !== 'pending')
            .map(b => {
              const status = b.status.toLowerCase();
              let actionText = 'Memperbarui Peminjaman';
              if (status === 'approved')  actionText = 'Persetujuan Peminjaman';
              if (status === 'rejected')  actionText = 'Penolakan Peminjaman';
              if (status === 'canceled' || status === 'cancelled') actionText = 'Pembatalan Peminjaman';
              if (status === 'checked-in' || status === 'checked_in') actionText = 'Check-in Ruangan';
              
              let badgeStatus = 'Berhasil';
              if (status === 'rejected') badgeStatus = 'Ditolak';
              if (status === 'canceled' || status === 'cancelled') badgeStatus = 'Dibatalkan';
              
              return {
                id: `BKG-${b.id}`,
                timestamp: b.updated_at || b.created_at || b.date_of_booking || new Date().toISOString(),
                operator: userMap[b.user_id] || `User #${b.user_id}`,
                operatorIdnum: userIdnumMap ? userIdnumMap[b.user_id] || '' : '',
                validator: (function(){
                  if(!b.validated_by) return null;
                  // Try numeric id mapping first
                  const asNum = Number(b.validated_by);
                  if (!isNaN(asNum) && userMap[asNum]) return { name: userMap[asNum], idnum: userIdnumMap ? userIdnumMap[asNum] : '' };
                  // Fallback to direct mapping if string key exists
                  if (userMap[b.validated_by]) return { name: userMap[b.validated_by], idnum: userIdnumMap ? userIdnumMap[b.validated_by] : '' };
                  // Otherwise use string as-is
                  return { name: b.validated_by, idnum: '' };
                })(),
                reason: b.reason || '',
                action: actionText,
                category: 'Validasi Peminjaman',
                entity: facilityMap[b.facility_id] || `Facility #${b.facility_id}`,
                status: badgeStatus,
                icon: Door
              };
            });

          // Sort descending by timestamp
          dynamicLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          setLogs(dynamicLogs);
        }
      } catch (err) {
        if (isMounted) {
          console.error(err);
          toast.error("Gagal memuat log audit sistem.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    
    fetchLogs();
    
    return () => { isMounted = false; };
  }, [facilityMap, userMap, userIdnumMap]);

  // Client-Side Filter
  const filteredLogs = logs.filter(log => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = q === '' || 
      log.action.toLowerCase().includes(q) || 
      (log.operator && log.operator.toLowerCase().includes(q)) || 
      (log.operatorIdnum && String(log.operatorIdnum).toLowerCase().includes(q)) || 
      (log.validator && log.validator.name && log.validator.name.toLowerCase().includes(q)) || 
      log.id.toLowerCase().includes(q) ||
      (log.entity && log.entity.toLowerCase().includes(q));

    return matchesSearch;
  });

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    // Outer container based on Figma styling parameters
    <div className="p-4 md:p-8 bg-[#F4F7FB] flex-1 overflow-y-auto mt-4 md:mt-0 min-h-full">
      
      {/* Breadcrumbs Row */}
      <nav className="flex items-center text-xs font-bold text-slate-400 mb-6">
        <Link to="/admin/facility/room-management" className="hover:text-primary transition-colors">Panel Admin</Link>
        <CaretRight size={12} weight="bold" className="mx-2" />
        <span className="text-primary flex items-center gap-1">
          <Scroll size={14} weight="fill" />
          Log Audit Sistem
        </span>
      </nav>

      {/* Header Title Section */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-black text-primary mb-1 tracking-tight">Log Audit Sistem</h1>
        <p className="text-slate-500 text-sm font-medium">Rekaman aktivitas peminjaman yang sudah diproses, disajikan dalam bahasa yang lebih mudah dibaca.</p>
      </div>

      {/* Simple Toolbar */}
      <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-100 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-lg flex-1">
          <MagnifyingGlass size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari nama operator, ruangan, atau nomor booking..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all placeholder:font-medium"
          />
        </div>

        <button 
          onClick={() => {}}
          className="w-full md:w-auto flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-primary hover:border-primary px-5 py-3 rounded-xl font-bold text-sm shadow-sm transition-all active:scale-95 whitespace-nowrap"
        >
          <Download size={18} weight="bold" /> Ekspor CSV
        </button>
      </div>

      {/* Table Framework */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-wider">Waktu Aktivitas</th>
                <th className="py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-wider">Operator</th>
                <th className="py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-wider">Aksi & Kategori</th>
                <th className="py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-wider">Entitas Terkait</th>
                <th className="py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-wider">Validator</th>
                <th className="py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-wider text-center">Status</th>
                <th className="py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-wider text-center">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading || isLookupLoading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <div className="animate-pulse flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-4 border-slate-200 border-t-accent rounded-full animate-spin"></div>
                      <span className="text-sm font-semibold text-slate-500">Mengekstrak log sistem...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <div className="bg-slate-50 p-4 rounded-full mb-3">
                        <Scroll size={32} weight="duotone" className="opacity-60 text-slate-500" />
                      </div>
                      <p className="font-bold text-slate-600 text-base">Log tidak ditemukan.</p>
                      <p className="text-sm mt-1">Coba sesuaikan kata kunci pencarian Anda.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, index) => {
                  let statusBadge = '';
                  if (log.status === 'Berhasil') statusBadge = 'bg-green-100 text-green-800 font-semibold rounded-full px-2.5 py-1 text-xs w-full text-center inline-block';
                  else if (log.status === 'Ditolak') statusBadge = 'bg-red-100 text-red-800 font-semibold rounded-full px-2.5 py-1 text-xs w-full text-center inline-block';
                  else if (log.status === 'Pending') statusBadge = 'bg-yellow-100 text-yellow-800 font-semibold rounded-full px-2.5 py-1 text-xs w-full text-center inline-block';
                  
                  const IconComp = log.icon || Scroll;

                  return (
                    <tr key={index} className="hover:bg-slate-50/70 transition-colors even:bg-[#F8FAFC]">
                      <td className="py-4 px-6 align-top">
                        <div className="font-bold text-slate-700 text-sm">{new Date(log.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                        <div className="text-xs font-semibold text-slate-500 mt-1">{new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</div>
                      </td>
                      <td className="py-4 px-6 align-top">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center font-black text-xs border border-accent/20 shrink-0">
                            {getInitials(log.operator)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-700 text-sm">{log.operator}</div>
                            {log.operatorIdnum && <div className="text-xs font-semibold text-slate-500 mt-0.5">{log.operatorIdnum}</div>}
                            <div className="text-xs font-semibold text-slate-500 mt-0.5">{log.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 align-top">
                        <div className="font-bold text-slate-700 text-sm">{log.action}</div>
                        <div className="text-xs font-semibold text-slate-500 mt-1">{log.category}</div>
                        {log.reason && (
                          <div className="text-[11px] font-medium text-slate-400 mt-1 whitespace-normal max-w-xl">Alasan: {log.reason}</div>
                        )}
                      </td>
                      <td className="py-4 px-6 align-top">
                        <div className="inline-flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                          <IconComp size={14} className="text-slate-500" />
                          <span className="font-bold text-slate-700 text-xs">{log.entity}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 align-top">
                        {log.validator ? (
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center font-black text-xs border border-accent/20 shrink-0">{getInitials(log.validator.name)}</div>
                            <div>
                              <div className="font-bold text-slate-700 text-sm">{log.validator.name}</div>
                              {log.validator.idnum && <div className="text-xs font-semibold text-slate-500 mt-0.5">{log.validator.idnum}</div>}
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400">-</div>
                        )}
                      </td>
                      <td className="py-4 px-6 w-32 align-top">
                        <span className={statusBadge}>{log.status}</span>
                      </td>
                      <td className="py-4 px-6 align-top">
                        <div className="flex justify-center">
                          <button 
                            className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-colors active:scale-95 border border-transparent hover:border-slate-200 shadow-sm"
                            title="Detail Log"
                          >
                            <DotsThreeVertical size={20} weight="bold" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        <div className="bg-slate-50/50 border-t border-slate-100 p-4 px-6 flex items-center justify-between text-sm text-slate-500">
          <span className="font-semibold">Menampilkan <strong className="text-slate-800 font-black">{filteredLogs.length}</strong> catatan aktivitas</span>
          <span className="text-xs font-semibold text-slate-400">Format disederhanakan untuk dibaca pengguna</span>
        </div>
      </div>
    </div>
  );
}
