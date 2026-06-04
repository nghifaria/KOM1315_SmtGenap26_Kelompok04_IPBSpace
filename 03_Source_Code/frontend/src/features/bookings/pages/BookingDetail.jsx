import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ArrowLeft } from '@phosphor-icons/react';
import { bookingService } from '../services/bookingService';
import StatusBadge from '../../../shared/components/ui/Badge/StatusBadge';
import { BOOKING_STATUS, BOOKING_MESSAGES } from '../constants/bookingConstants';
import { useBookingDetail } from '../hooks/useBookingDetail';
import AlertBanner from '../../../shared/components/feedback/AlertBanner';
import ConfirmModal from '../../../shared/components/ui/Modal/ConfirmModal';
import BookingDetailMainInfo from '../components/BookingDetailMainInfo';
import BookingDetailFacilityInfo from '../components/BookingDetailFacilityInfo';
import BookingDetailSidebar from '../components/BookingDetailSidebar';

export default function BookingDetail() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { booking, facility, isLoading, error, setBooking } = useBookingDetail(bookingId);
  const [isSticky, setIsSticky] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleCancelClick = () => {
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    try {
      toast.loading('Membatalkan...', { id: 'cancelDetailToast' });
      const response = await bookingService.cancelBooking(booking.id);
      
      if (response.success || response.id) {
        toast.success(BOOKING_MESSAGES.SUCCESS_CANCEL, { id: 'cancelDetailToast' });
        setBooking({ ...booking, status: BOOKING_STATUS.CANCELED });
      } else {
        toast.error(response.message || BOOKING_MESSAGES.ERROR_CANCEL, { id: 'cancelDetailToast' });
      }
    } catch (error) {
      toast.error(BOOKING_MESSAGES.ERROR_CANCEL_SYSTEM, { id: 'cancelDetailToast' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface py-12 px-4 flex items-center justify-center">
        <div className="animate-pulse space-y-4 w-full max-w-6xl">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
            <div className="lg:col-span-7 h-[450px] bg-gray-200 rounded-card"></div>
            <div className="lg:col-span-5 h-[350px] bg-gray-200 rounded-card"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-surface py-12 px-4">
        <div className="max-w-2xl mx-auto bg-error-container text-on-error-container p-6 rounded-card text-center shadow-md">
          <p className="font-bold">{error}</p>
          <button onClick={() => navigate('/civitas/history')} className="mt-4 text-sm font-black hover:underline uppercase tracking-wider">
            Kembali ke Riwayat
          </button>
        </div>
      </div>
    );
  }

  const status = booking.status?.toLowerCase();
  
  const dateObj = new Date(booking.date_of_booking || booking.start_time);
  const formattedDate = dateObj.toLocaleDateString('id-ID', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    return new Date(timeStr).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };
  const startTime = formatTime(booking.start_time);
  const endTime = formatTime(booking.end_time);

  return (
    <div className="bg-surface min-h-screen py-8 px-4 md:px-8">
      
      {/* Sticky Contextual Sub-Header */}
      <div 
        className={`fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-ambient transition-all duration-300 py-3.5 px-4 md:px-8 ${
          isSticky ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/civitas/history')}
              className="flex items-center gap-1.5 text-gray-500 hover:text-primary transition-colors font-black text-xs uppercase tracking-wider"
            >
              <ArrowLeft size={16} weight="bold" />
              <span>Kembali</span>
            </button>
            <span className="h-4 w-px bg-gray-200 hidden sm:block"></span>
            <span className="text-sm font-black text-primary select-all">
              Peminjaman #{booking.id.toString().padStart(6, '0')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none hidden md:inline">Status Pengajuan:</span>
            <StatusBadge status={status} />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Navigation & Title Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-slide-up">
          <button 
            onClick={() => navigate('/civitas/history')}
            className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors font-black text-sm uppercase tracking-wider"
          >
            <ArrowLeft size={20} weight="bold" />
            Kembali ke Riwayat
          </button>
          
          <div className="flex items-center gap-3">
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest leading-none">Status Pengajuan:</span>
            <StatusBadge status={status} />
          </div>
        </div>

        {/* Rejection Notification Banner */}
        {status === BOOKING_STATUS.REJECTED && booking.rejection_reason && (
          <div className="animate-slide-up" style={{ animationDelay: '0.03s' }}>
            <AlertBanner 
              type="error" 
              title="Peminjaman Ditolak" 
              message={booking.rejection_reason} 
            />
          </div>
        )}

        {/* Layout Grid*/}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-slide-up" style={{ animationDelay: '0.08s' }}>
          
          {/* LEFT SIDE: Core Detail Cards (7 columns) */}
          <div className="lg:col-span-7 space-y-6">
            <BookingDetailMainInfo 
              booking={booking}
              formattedDate={formattedDate}
              startTime={startTime}
              endTime={endTime}
            />

            <BookingDetailFacilityInfo 
              facility={facility} 
            />
          </div>

          {/* RIGHT SIDE: Extra Items, Document & Actions (5 columns) */}
          <div className="lg:col-span-5 space-y-6">
            <BookingDetailSidebar 
              booking={booking}
              status={status}
              onCancel={handleCancelClick}
            />
          </div>

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
