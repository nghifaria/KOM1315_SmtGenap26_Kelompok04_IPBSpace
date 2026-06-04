import React, { useState, useEffect } from 'react';
import { Download, MagnifyingGlass, Eye, CaretLeft, CaretRight, FunnelSimple } from '@phosphor-icons/react';
import { bookingService } from '../../bookings/services/bookingService';
import { useValidationLookup } from '../../facilities/hooks/useValidationLookup';
import { toast } from 'react-hot-toast';
import BookingHistoryDetailModal from '../components/BookingHistoryDetailModal';
import CustomDropdown from '../../../shared/components/ui/CustomDropdown';

export default function AdminBookingHistory() {
  const [historyBookings, setHistoryBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua Status');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const openModal = (booking) => {
    setSelectedBooking(booking);
    setIsModalOpen(true);
  };

  const { facilityMap, userMap, isLookupLoading } = useValidationLookup();

  useEffect(() => {
    let isMounted = true;
    
    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        const res = await bookingService.getAllBookings();
        if (isMounted) {
          // apiClient interceptor already unwraps response.data,
          // so res = { success, data: { items: [] } }
          const all = res?.data?.items ?? res?.items ?? (Array.isArray(res) ? res : []);
          // Filter OUT pending items — all other statuses (approved, rejected, canceled/cancelled, checked-in/checked_in) are history
          const filtered = all.filter(b => b.status && b.status.toLowerCase() !== 'pending');
          // Sort descending by date
          filtered.sort((a, b) => new Date(b.created_at || b.date_of_booking) - new Date(a.created_at || a.date_of_booking));
          setHistoryBookings(filtered);
        }
      } catch (err) {
        if (isMounted) {
          console.error(err);
          toast.error("Gagal memuat riwayat peminjaman.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    
    fetchHistory();
    
    return () => { isMounted = false; };
  }, []);

  // Client-side filtering
  const filteredData = historyBookings.filter(b => {
    // Search Matching
    const refId = `#BKG-${b.id}`.toLowerCase();
    const applicant = (userMap[b.user_id] || '').toLowerCase();
    const room = (facilityMap[b.facility_id] || '').toLowerCase();
    const purpose = (b.purpose || '').toLowerCase();
    const q = searchQuery.toLowerCase();
    
    const matchesSearch = q === '' || 
      refId.includes(q) || 
      applicant.includes(q) || 
      room.includes(q) || 
      purpose.includes(q);
    
    // Status Matching
    let matchesStatus = true;
    if (statusFilter !== 'Semua Status') {
      matchesStatus = b.status?.toLowerCase() === statusFilter.toLowerCase();
    }
    
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleExportCSV = () => {
    if (filteredData.length === 0) {
      toast.error('Tidak ada data untuk diekspor.');
      return;
    }
    
    const headers = ['Ref ID', 'Tanggal Pengajuan', 'Pemohon', 'Ruangan', 'Agenda', 'Status'];
    const rows = filteredData.map(b => {
      const refId = `BKG-${b.id}`;
      const tgl = new Date(b.created_at || b.date_of_booking).toLocaleDateString('id-ID');
      const pemohon = `"${userMap[b.user_id] || `User #${b.user_id}`}"`;
      const ruangan = `"${facilityMap[b.facility_id] || `Fasilitas #${b.facility_id}`}"`;
      const agenda = `"${b.purpose ? b.purpose.replace(/"/g, '""') : ''}"`;
      const status = b.status || '';
      return [refId, tgl, pemohon, ruangan, agenda, status].join(',');
    });
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Riwayat_Peminjaman_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Laporan berhasil diekspor ke CSV.');
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'approved')   return <span className="bg-[#D1FAE5] text-[#065F46] px-3 py-1 rounded-full text-xs font-bold shadow-sm border border-emerald-200">Disetujui</span>;
    if (s === 'rejected')   return <span className="bg-[#FEE2E2] text-[#991B1B] px-3 py-1 rounded-full text-xs font-bold shadow-sm border border-red-200">Ditolak</span>;
    // Backend stores 'canceled' (one L) — handle both spellings defensively
    if (s === 'canceled' || s === 'cancelled') return <span className="bg-[#F1F5F9] text-[#475569] px-3 py-1 rounded-full text-xs font-bold shadow-sm border border-slate-200">Dibatalkan</span>;
    // Backend stores 'checked-in' (with hyphen) — handle both formats
    if (s === 'checked_in' || s === 'checked-in') return <span className="bg-[#DBEAFE] text-[#1E40AF] px-3 py-1 rounded-full text-xs font-bold shadow-sm border border-blue-200">Check-In</span>;
    if (s === 'pending')    return <span className="bg-[#FEF3C7] text-[#92400E] px-3 py-1 rounded-full text-xs font-bold shadow-sm border border-amber-200">Menunggu</span>;
    return <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold">{status}</span>;
  };

  const isPageLoading = isLoading || isLookupLoading;

  return (
    <div className="flex-grow p-4 md:p-8 bg-[#F4F7FB] min-h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-primary mb-1">Riwayat Peminjaman</h1>
          <p className="text-slate-500 text-sm font-medium">Arsip seluruh transaksi peminjaman ruangan yang telah diproses.</p>
        </div>
        <button 
          onClick={handleExportCSV}
          className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all active:scale-95"
        >
          <Download size={18} weight="bold" /> Ekspor CSV
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 flex flex-col md:flex-row gap-3 items-center">
        <div className="relative flex-grow w-full">
          <MagnifyingGlass size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari Ref ID, Pemohon, atau Ruangan..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
          />
        </div>
        <CustomDropdown
          value={statusFilter}
          onChange={setStatusFilter}
          icon={<FunnelSimple size={16} weight="bold" />}
          options={[
            { value: 'Semua Status', label: 'Semua Status' },
            { value: 'approved',    label: 'Disetujui',       color: 'bg-emerald-500' },
            { value: 'rejected',    label: 'Ditolak',         color: 'bg-red-500' },
            { value: 'canceled',    label: 'Dibatalkan',      color: 'bg-slate-400' },
            { value: 'checked-in',  label: 'Telah Check-In',  color: 'bg-blue-500' },
          ]}
          className="w-full md:w-52 shrink-0"
        />
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-wider">Ref ID & Tanggal</th>
                <th className="py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-wider">Pemohon</th>
                <th className="py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-wider">Ruangan</th>
                <th className="py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-wider">Agenda</th>
                <th className="py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-wider">Status</th>
                <th className="py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-wider text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isPageLoading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <div className="animate-pulse flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-4 border-slate-200 border-t-accent rounded-full animate-spin"></div>
                      <span className="text-sm font-semibold text-slate-500">Menyinkronkan arsip...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <div className="bg-slate-50 p-4 rounded-full mb-3">
                        <MagnifyingGlass size={32} weight="duotone" className="opacity-60 text-slate-500" />
                      </div>
                      <p className="font-bold text-slate-600 text-base">Tidak ada arsip peminjaman ditemukan.</p>
                      <p className="text-sm mt-1">Coba sesuaikan kata kunci atau filter status pencarian Anda.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50/70 transition-colors even:bg-[#F8FAFC]">
                    <td className="py-4 px-6">
                      <div className="font-black text-primary text-sm tracking-tight">#BKG-{b.id}</div>
                      <div className="text-xs font-semibold text-slate-500 mt-1">
                        {new Date(b.created_at || b.date_of_booking).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-700 text-sm">{userMap[b.user_id] || `User #${b.user_id}`}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-700 text-sm flex items-center gap-2">
                        {facilityMap[b.facility_id] || `Fasilitas #${b.facility_id}`}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-600 text-sm max-w-[220px] truncate" title={b.purpose}>
                        {b.purpose}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {getStatusBadge(b.status)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center">
                        <button 
                          onClick={() => openModal(b)} 
                          className="p-2 bg-white text-slate-400 hover:bg-primary hover:text-white hover:border-primary rounded-xl transition-all border border-slate-200 shadow-sm active:scale-90"
                          title="Lihat Detail Histori"
                        >
                          <Eye size={18} weight="bold" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        {!isPageLoading && filteredData.length > 0 && (
          <div className="bg-slate-50/50 border-t border-slate-100 p-4 px-6 flex items-center justify-between text-sm text-slate-500">
            <span className="font-semibold">Menampilkan <strong className="text-slate-800 font-black">{paginatedData.length}</strong> dari <strong className="text-slate-800 font-black">{filteredData.length}</strong> entri</span>
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-sm"
              >
                <CaretLeft size={16} weight="bold" />
              </button>
              <span className="font-black text-slate-700 px-3 py-1 bg-white border border-slate-200 rounded-lg shadow-sm">{currentPage} / {Math.max(1, totalPages)}</span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages || totalPages === 0}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-sm"
              >
                <CaretRight size={16} weight="bold" />
              </button>
            </div>
          </div>
        )}
      </div>

      <BookingHistoryDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        booking={selectedBooking}
      />
    </div>
  );
}
