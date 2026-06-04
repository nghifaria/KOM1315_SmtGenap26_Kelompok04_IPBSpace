import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ClockCounterClockwise, MagnifyingGlass } from '@phosphor-icons/react';
import BookingHistoryCard from '../components/BookingHistoryCard';
import BookingFilterTabs from '../components/BookingFilterTabs';
import { bookingService } from '../services/bookingService';
import { facilityService } from '../../facilities/services/facilityService';
import { BOOKING_MESSAGES } from '../constants/bookingConstants';
import ConfirmModal from '../../../shared/components/ui/Modal/ConfirmModal';

export default function BookingHistory() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [facilitiesMap, setFacilitiesMap] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);

  const fetchBookingsAndFacilities = useCallback(async () => {
    try {
      setIsLoading(true);
      // Fetch both my bookings and all facilities concurrently
      const [bookingsRes, facilitiesRes] = await Promise.all([
        bookingService.getMyBookings(),
        facilityService.getAllFacilities()
      ]);

      if (facilitiesRes.success && facilitiesRes.data?.items) {
        const map = {};
        facilitiesRes.data.items.forEach(fac => {
          map[fac.id] = fac.name;
        });
        setFacilitiesMap(map);
      } else if (Array.isArray(facilitiesRes.items)) {
        const map = {};
        facilitiesRes.items.forEach(fac => {
          map[fac.id] = fac.name;
        });
        setFacilitiesMap(map);
      }

      if (bookingsRes.success && bookingsRes.data?.items) {
        // Sort bookings by created_at descending (newest first)
        const sortedBookings = bookingsRes.data.items.sort((a, b) => {
          return new Date(b.created_at || b.date_of_booking) - new Date(a.created_at || a.date_of_booking);
        });
        setBookings(sortedBookings);
      } else {
        setBookings([]);
      }
    } catch (error) {
      console.error('Error fetching booking history:', error);
      toast.error(BOOKING_MESSAGES.ERROR_FETCH_HISTORY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookingsAndFacilities();
  }, [fetchBookingsAndFacilities]);

  const handleCancelClick = (id) => {
    setSelectedBookingId(id);
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedBookingId) return;
    const id = selectedBookingId;
    setSelectedBookingId(null);

    try {
      // Create a temporary overlay to prevent multiple clicks
      toast.loading('Membatalkan...', { id: 'cancelToast' });
      const response = await bookingService.cancelBooking(id);
      
      if (response.success || response.id) {
        toast.success(BOOKING_MESSAGES.SUCCESS_CANCEL, { id: 'cancelToast' });
        fetchBookingsAndFacilities();
      } else {
        toast.error(response.message || BOOKING_MESSAGES.ERROR_CANCEL, { id: 'cancelToast' });
      }
    } catch (error) {
      toast.error(BOOKING_MESSAGES.ERROR_CANCEL_SYSTEM, { id: 'cancelToast' });
    }
  };

  const handleViewTicket = (id) => {
    navigate(`/civitas/ticket/${id}`);
  };

  const handleViewDetail = (id) => {
    navigate(`/civitas/booking-detail/${id}`);
  };

  const [searchQuery, setSearchQuery] = useState('');

  const filteredBookings = bookings.filter(b => {
    const facilityName = (facilitiesMap[b.facility_id] || '').toLowerCase();
    const purpose = (b.purpose || '').toLowerCase();
    const refId = `#BKG-${b.id}`.toLowerCase();
    const q = searchQuery.toLowerCase();
    const matchesSearch = q === '' || facilityName.includes(q) || purpose.includes(q) || refId.includes(q);

    if (activeFilter === 'all') return matchesSearch;
    return matchesSearch && b.status.toLowerCase() === activeFilter.toLowerCase();
  });

  return (
    <div className="bg-surface min-h-screen py-8 px-4 md:px-8 flex-1">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 border-b border-gray-100 pb-4 gap-4 animate-slide-up">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-primary flex items-center gap-3">
              <ClockCounterClockwise size={36} weight="duotone" className="text-accent" />
              Riwayat Peminjaman
            </h1>
            <p className="text-gray-500 mt-2 text-base">Pantau status, batalkan, dan akses tiket peminjaman Anda di sini.</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6 items-center justify-between animate-slide-up" style={{ animationDelay: '0.05s' }}>
          <div className="w-full md:w-auto">
            <BookingFilterTabs activeFilter={activeFilter} onFilterChange={setActiveFilter} />
          </div>
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Cari peminjaman..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-200 text-slate-700 text-sm font-semibold rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent shadow-sm transition-all"
            />
            <MagnifyingGlass size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          {isLoading ? (
            // Skeletons
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-white rounded-2xl shadow-ambient p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-pulse">
                  <div className="flex-1 w-full space-y-3">
                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                    <div className="flex gap-4 mt-2">
                      <div className="h-4 bg-gray-100 rounded w-24"></div>
                      <div className="h-4 bg-gray-100 rounded w-32"></div>
                    </div>
                  </div>
                  <div className="w-24 h-8 bg-gray-200 rounded-full mt-4 md:mt-0"></div>
                </div>
              ))}
            </div>
          ) : bookings.length === 0 ? (
            // Empty State
            <div className="bg-white rounded-2xl shadow-ambient p-12 text-center border-2 border-dashed border-gray-200 flex flex-col items-center justify-center">
              <MagnifyingGlass size={64} weight="duotone" className="text-gray-300 mb-4" />
              <h3 className="text-xl font-bold text-gray-700 mb-2">Belum ada riwayat peminjaman</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Anda belum pernah mengajukan peminjaman fasilitas. Silakan menuju halaman Eksplorasi untuk mulai meminjam ruangan.
              </p>
            </div>
          ) : (
            // Booking List
            <div className="space-y-4">
              {filteredBookings.length > 0 ? (
                filteredBookings.map((booking) => (
                  <BookingHistoryCard
                    key={booking.id}
                    booking={booking}
                    facilityName={facilitiesMap[booking.facility_id] || `Fasilitas #${booking.facility_id}`}
                    onCancel={handleCancelClick}
                    onViewTicket={handleViewTicket}
                    onViewDetail={handleViewDetail}
                  />
                ))
              ) : (
                <div className="text-center py-10 text-gray-500 bg-white rounded-2xl shadow-sm border border-gray-100">
                  Tidak ada peminjaman dengan status ini.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Cancellation Confirmation Pop-up Modal */}
      <ConfirmModal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={handleConfirmCancel}
        title="Batalkan Peminjaman"
        message="Apakah Anda yakin ingin membatalkan pengajuan peminjaman fasilitas ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Ya, Batalkan"
        cancelText="Kembali"
        type="danger"
      />
    </div>
  );
}
