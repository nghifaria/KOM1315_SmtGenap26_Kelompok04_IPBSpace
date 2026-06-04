import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { FilePdf, CheckCircle, FileText, ClockCounterClockwise, Wrench, WarningCircle, CaretLeft, CaretRight } from '@phosphor-icons/react';
import apiClient from '../../../shared/services/api/apiClient';
import { bookingService } from '../../bookings/services/bookingService';
import { facilityService } from '../../facilities/services/facilityService';
import { userService } from '../../users/services/userService';
import ValidationActionModal from '../components/ValidationActionModal';
import { formatDate, formatTime } from '../../../shared/utils/format';

const getInitials = (name) => {
  if (!name) return '??';
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export default function AdminValidationList() {
  const [allBookings, setAllBookings] = useState([]);
  const [pendingBookings, setPendingBookings] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Enhanced lookup: stores full user objects for role/work_unit access
  const [facilityMap, setFacilityMap] = useState({});
  const [userMap, setUserMap] = useState({});       // id -> fullname
  const [userDetailMap, setUserDetailMap] = useState({}); // id -> { role, work_unit, fullname }

  const parseBookingDateTime = (booking, field) => {
    const rawValue = booking?.[field];
    if (!rawValue) return null;

    if (rawValue instanceof Date) {
      return rawValue;
    }

    const rawString = String(rawValue).trim();
    if (!rawString) return null;

    const fullDateTime = new Date(rawString);
    if (!Number.isNaN(fullDateTime.getTime()) && rawString.includes('T')) {
      return fullDateTime;
    }

    const datePart = String(booking?.date_of_booking || '').trim();
    if (!datePart) {
      return Number.isNaN(fullDateTime.getTime()) ? null : fullDateTime;
    }

    const timeMatch = rawString.match(/^(\d{2}):(\d{2})(?::(\d{2}))?/);
    if (timeMatch) {
      const hours = timeMatch[1];
      const minutes = timeMatch[2];
      const seconds = timeMatch[3] || '00';
      const localDateTime = new Date(`${datePart}T${hours}:${minutes}:${seconds}`);
      return Number.isNaN(localDateTime.getTime()) ? null : localDateTime;
    }

    return Number.isNaN(fullDateTime.getTime()) ? null : fullDateTime;
  };

  const getBookingWindow = (booking) => {
    const start = parseBookingDateTime(booking, 'start_time');
    const end = parseBookingDateTime(booking, 'end_time');
    if (!start || !end) return null;
    return { start, end };
  };

  const getCreatedAt = (booking) => {
    const createdAt = parseBookingDateTime(booking, 'created_at');
    if (createdAt) return createdAt;

    const updatedAt = parseBookingDateTime(booking, 'updated_at');
    if (updatedAt) return updatedAt;

    return null;
  };

  const isSameQueueGroup = (baseBooking, otherBooking) => {
    const baseWindow = getBookingWindow(baseBooking);
    const otherWindow = getBookingWindow(otherBooking);
    if (!baseWindow || !otherWindow) return false;

    return baseWindow.start < otherWindow.end && baseWindow.end > otherWindow.start;
  };

  useEffect(() => {
    let isMounted = true;

    const fetchAllData = async () => {
      try {
        setIsLoading(true);
        // allSettled: if /users/ returns 403 before backend restart,
        // bookings and facilities still load cleanly
        const [bookingsResult, facilitiesResult, usersResult] = await Promise.allSettled([
          bookingService.getAllBookings(),
          facilityService.getAllFacilities(),
          userService.getAllUsers()
        ]);

        if (isMounted) {
          // apiClient interceptor returns response.data directly.
          // Backend wraps items as: { success, data: { items: [] } }
          // So res = { success, data: { items: [] } } → res.data.items is the array.
          const safeExtract = (result) => {
            if (result.status !== 'fulfilled') return [];
            const v = result.value;
            // Try every possible nesting the backend might return
            if (Array.isArray(v?.data?.items)) return v.data.items;
            if (Array.isArray(v?.items)) return v.items;
            if (Array.isArray(v?.data)) return v.data;
            if (Array.isArray(v)) return v;
            return [];
          };

          const bookingsList = safeExtract(bookingsResult);
          const facilitiesList = safeExtract(facilitiesResult);
          const usersList = safeExtract(usersResult);

          // Build facility dictionary
          const fMap = {};
          facilitiesList.forEach(f => { fMap[f.id] = f.name; });

          // Build user dictionaries (name + full detail)
          const uMap = {};
          const uDetailMap = {};
          usersList.forEach(u => {
            uMap[u.id] = u.fullname || u.name;
            uDetailMap[u.id] = {
              fullname: u.fullname || u.name,
              role: u.role || 'Civitas',
              work_unit: u.work_unit || 'IPB Space',
              idnum: u.idnum
            };
          });

          setFacilityMap(fMap);
          setUserMap(uMap);
          setUserDetailMap(uDetailMap);
          setAllBookings(bookingsList);
          setFacilities(facilitiesList);

          // Filter ketat hanya data yang berstatus 'pending' dan urutkan dari yang tertua
          const pending = bookingsList
            .filter(b => b.status?.toLowerCase() === 'pending')
            .sort((a, b) => new Date(a.created_at || a.date_of_booking) - new Date(b.created_at || b.date_of_booking));
          setPendingBookings(pending);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Failed to fetch validation list:', error);
          toast.error('Gagal memuat antrean validasi peminjaman.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }

      }
    };

    fetchAllData();

    return () => {
      isMounted = false;
    };
  }, []);

  // --- DYNAMIC STAT CARD COMPUTATIONS ---
  const totalPermohonan = allBookings.length;
  const menungguValidasi = pendingBookings.length;

  const getQueueMeta = (booking) => {
    const bookingWindow = getBookingWindow(booking);
    if (!bookingWindow) {
      return { queuePosition: 1, queueSize: 1, isBlocked: false, hasOverlapQueue: false };
    }

    let isBlocked = false;
    const overlappingPendingBookings = [];

    allBookings.forEach((otherBooking) => {
      if (otherBooking.id === booking.id || otherBooking.facility_id !== booking.facility_id) {
        return;
      }

      if (isSameQueueGroup(booking, otherBooking)) {
        const otherStatus = otherBooking.status?.toLowerCase();
        if (otherStatus === 'approved' || otherStatus === 'ongoing' || otherStatus === 'checked-in' || otherStatus === 'checked_in') {
          isBlocked = true;
        } else if (otherStatus === 'pending') {
          overlappingPendingBookings.push(otherBooking);
        }
      }
    });

    const hasOverlapQueue = overlappingPendingBookings.length > 0;

    if (!hasOverlapQueue) {
      return { queuePosition: 1, queueSize: 1, isBlocked, hasOverlapQueue };
    }

    const orderedQueue = [booking, ...overlappingPendingBookings].sort((left, right) => {
      const leftCreated = getCreatedAt(left);
      const rightCreated = getCreatedAt(right);

      if (leftCreated && rightCreated && leftCreated.getTime() !== rightCreated.getTime()) {
        return leftCreated.getTime() - rightCreated.getTime();
      }

      if (leftCreated && !rightCreated) return -1;
      if (!leftCreated && rightCreated) return 1;

      return (left.id || 0) - (right.id || 0);
    });

    return {
      queuePosition: orderedQueue.findIndex(item => item.id === booking.id) + 1,
      queueSize: orderedQueue.length,
      isBlocked,
      hasOverlapQueue
    };
  };

  // Disetujui hari ini: approved bookings where updated_at is today
  const disetujuiHariIni = allBookings.filter(b => {
    if (b.status?.toLowerCase() !== 'approved') return false;
    const updated = new Date(b.updated_at || b.created_at);
    const today = new Date();
    return updated.toDateString() === today.toDateString();
  }).length;

  // Ruangan maintenance: facilities with condition indicating maintenance
  const ruanganMaintenance = facilities.filter(f => 
    f.condition && (f.condition.toLowerCase() === 'maintenance' || f.condition.toLowerCase() === 'under_maintenance')
  ).length;

  const handleViewPDF = async (bookingId) => {
    try {
      await bookingService.viewDocument(bookingId);
    } catch (error) {
      toast.error('Gagal membuka atau mengunduh dokumen pendukung.');
    }
  };
  const openValidationModal = (booking) => {
    setSelectedBooking(booking);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (bookingId, actionType, rejectionReason) => {
    try {
      // Backend contract: Sekarang menerima status baru dan alasan penolakan (opsional).
      await bookingService.updateBookingStatus(bookingId, { 
        new_status: actionType,
        reason: actionType === 'rejected' ? rejectionReason : undefined
      });

      // Update UI state lokal

      setPendingBookings(prev => prev.filter(b => b.id !== bookingId));
      setIsModalOpen(false);
      setSelectedBooking(null);

      // Fake Toast Workaround: Tampilkan alasan di frontend seolah-olah terekam di sistem
      if (actionType === 'rejected') {
         toast.success(`Peminjaman ditolak. Alasan: ${rejectionReason}`);
      } else {
         toast.success('Peminjaman berhasil disetujui.');
      }
    } catch (error) {
      console.error(`Failed to update booking status to ${actionType}:`, error);
      const apiMessage = error?.response?.data?.data?.error?.message || error?.response?.data?.detail || error?.message;
      toast.error(apiMessage || 'Gagal memproses tindakan validasi.');
      throw error; // Lempar error kembali agar status isSubmitting di Modal mati
    }
  };

  const totalPages = Math.ceil(pendingBookings.length / itemsPerPage);
  const paginatedBookings = pendingBookings.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );

  return (
    <div className="bg-[#F4F7FB] min-h-screen flex-1 p-4 md:p-8">
      <div className="w-full max-w-[1600px] mx-auto space-y-6">
        {/* Header Title */}
        <header className="mb-6 animate-slide-up">
          <h1 className="text-2xl md:text-3xl font-bold text-primary mb-2">Validasi Peminjaman</h1>
          <p className="text-on-surface-variant">Daftar pengajuan fasilitas yang menunggu persetujuan (Facility Admin).</p>
          <p className="mt-2 text-sm text-slate-500">
            Status <strong>pending</strong> berarti masih antre validasi. Jika jadwal bertabrakan dengan booking yang sudah <strong>approved</strong> atau <strong>checked-in</strong>, persetujuan akan ditolak dari server.
          </p>
        </header>

        {/* Dynamic Statistic Cards Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up" style={{ animationDelay: '0.05s' }}>
          <div className="bg-white p-5 rounded-card shadow-ambient border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-primary shrink-0">
              <FileText size={24} weight="fill" />
            </div>
            <div>
              <p className="text-sm font-medium text-on-surface-variant line-clamp-1">Total Permohonan</p>
              <h3 className="text-2xl font-black text-primary leading-none mt-1">{isLoading ? '-' : totalPermohonan}</h3>
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-card shadow-ambient border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-warning shrink-0">
              <ClockCounterClockwise size={24} weight="fill" />
            </div>
            <div>
              <p className="text-sm font-medium text-on-surface-variant line-clamp-1">Menunggu Validasi</p>
              <h3 className="text-2xl font-black text-primary leading-none mt-1">{isLoading ? '-' : menungguValidasi}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-card shadow-ambient border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600 shrink-0">
              <CheckCircle size={24} weight="fill" />
            </div>
            <div>
              <p className="text-sm font-medium text-on-surface-variant line-clamp-1">Disetujui Hari Ini</p>
              <h3 className="text-2xl font-black text-primary leading-none mt-1">{isLoading ? '-' : disetujuiHariIni}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-card shadow-ambient border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-danger shrink-0">
              <Wrench size={24} weight="fill" />
            </div>
            <div>
              <p className="text-sm font-medium text-on-surface-variant line-clamp-1">Ruangan Maintenance</p>
              <h3 className="text-2xl font-black text-primary leading-none mt-1">{isLoading ? '-' : ruanganMaintenance}</h3>
            </div>
          </div>
        </section>

        {/* Tabel Validasi */}
        <section className="bg-surface-lowest rounded-card shadow-ambient border border-surface-container overflow-hidden animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="w-full overflow-hidden">
            <table className="w-full text-left border-collapse table-fixed">
              <colgroup>
                <col className="w-[15%]" />
                <col className="w-[23%]" />
                <col className="w-[14%]" />
                <col className="w-[17%]" />
                <col className="w-[21%]" />
                <col className="w-[10%]" />
              </colgroup>
              <thead>
                <tr className="bg-slate-50/50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-gray-100">
                  <th className="p-4 font-medium text-left">Peminjam</th>
                  <th className="p-4 font-medium text-left">Ruangan & Agenda</th>
                  <th className="p-4 font-medium text-left">Dibuat Pada</th>
                  <th className="p-4 font-medium text-left">Waktu Pelaksanaan</th>
                  <th className="p-4 font-medium text-left">Status</th>
                  <th className="p-4 font-medium text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan="6" className="p-10 text-center text-slate-500 font-medium">Memuat antrean validasi...</td>
                  </tr>
                ) : pendingBookings.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-12 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <CheckCircle size={56} className="text-slate-300 mb-4" weight="light" />
                        <p className="font-bold text-lg text-slate-700">Tidak Ada Antrean Validasi</p>
                        <p className="text-sm mt-1">
                          Bagus sekali!<br />
                          Semua permohonan peminjaman fasilitas telah selesai diproses.<br />
                          Silakan bersantai atau pantau kalender jadwal.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedBookings.map((booking) => {
                    const userName = userMap[booking.user_id] || `Mencari Data (ID: ${booking.user_id})`;
                    const initials = getInitials(userName);
                    const facilityName = facilityMap[booking.facility_id] || `Fasilitas ID: ${booking.facility_id}`;

                    // Dynamic subtext from full user detail payload
                    const userDetail = userDetailMap[booking.user_id];
                    const userSubtext = userDetail?.idnum || 'Civitas - IPB Space';

                    const createdTs = booking.created_at || booking.date_of_booking;
                    const formattedCreatedAt = createdTs ? new Date(createdTs).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';

                    const startDateTime = new Date(`${booking.date_of_booking}T${booking.start_time}`);
                    
                    const { queuePosition, queueSize, isBlocked, hasOverlapQueue } = getQueueMeta(booking);
                    const queueLabel = isBlocked
                      ? 'Konflik Waktu'
                      : hasOverlapQueue
                        ? (queuePosition === 1 ? 'Prioritas Slot' : `Antrean Slot #${queuePosition}`)
                        : 'Menunggu Validasi';
                    const queueHint = isBlocked
                      ? 'Bentrok jadwal dengan booking lain.'
                      : hasOverlapQueue
                        ? (queuePosition === 1
                          ? `Booking pertama dari ${queueSize} pengajuan.`
                          : `Ada ${queuePosition - 1} pengajuan lebih dulu.`)
                        : 'Tidak ada overlap lain.';

                    return (
                      <tr key={booking.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="p-4 align-top">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                              {initials}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 text-sm">{userName}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{userSubtext}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 align-top">
                          <div>
                            <p className="font-bold text-primary text-sm">{facilityName}</p>
                            <p className="font-medium text-slate-600 text-sm mt-1 line-clamp-2">{booking.purpose}</p>
                          </div>
                        </td>
                        <td className="p-4 align-top text-sm font-semibold text-slate-600">
                          {formattedCreatedAt}
                        </td>
                        <td className="p-4 align-top text-sm text-slate-600">
                          <div className="flex flex-col gap-1">
                            <div className="font-semibold text-slate-800">{formatDate(booking.date_of_booking)}</div>
                            <div className="flex items-center gap-1.5 text-slate-500">
                              <ClockCounterClockwise size={14} />
                              <span>{formatTime(booking.start_time)} - {formatTime(booking.end_time)}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 align-top">
                          <div className="flex flex-col gap-1.5">
                            <span className={`rounded-full text-xs font-bold inline-flex w-fit items-center gap-1 px-2.5 py-1 border ${
                              isBlocked
                                ? 'bg-red-100 text-red-700 border-red-200'
                                : hasOverlapQueue
                                  ? queuePosition === 1
                                    ? 'bg-amber-100 text-amber-800 border-amber-200'
                                    : 'bg-orange-100 text-orange-800 border-orange-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                            } whitespace-nowrap`} title={queueHint}>
                              {isBlocked && <WarningCircle size={14} weight="fill" />}
                              {queueLabel}
                            </span>
                            <span className={`text-[10px] font-semibold leading-tight max-w-full ${
                              isBlocked
                                ? 'text-red-600'
                                : hasOverlapQueue
                                  ? queuePosition === 1
                                    ? 'text-amber-700'
                                    : 'text-orange-700'
                                  : 'text-slate-500'
                            }`}>
                              {queueHint}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 align-top">
                          <div className="flex justify-center">
                            <button
                              onClick={() => openValidationModal(booking)}
                              className="px-4 py-1.5 bg-primary text-white rounded-btn text-xs font-bold hover:bg-primary-container shadow-sm transition-all active:scale-95 w-full sm:w-auto whitespace-nowrap"
                            >
                              Validasi
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

          {!isLoading && pendingBookings.length > 0 && (
            <div className="bg-slate-50/50 border-t border-slate-100 p-4 px-6 flex items-center justify-between text-sm text-slate-500">
              <span className="font-semibold">Menampilkan <strong className="text-slate-800 font-black">{paginatedBookings.length}</strong> dari <strong className="text-slate-800 font-black">{pendingBookings.length}</strong> antrean</span>
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
        </section>
      </div>

      <ValidationActionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        booking={selectedBooking}
        onSubmit={handleModalSubmit}
        onViewPDF={handleViewPDF}
        userMap={userMap}
        facilityMap={facilityMap}
      />
    </div>
  );
}
