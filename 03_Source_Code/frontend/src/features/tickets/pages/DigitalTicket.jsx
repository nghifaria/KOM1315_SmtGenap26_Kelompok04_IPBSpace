import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ArrowLeft } from '@phosphor-icons/react';
import { bookingService } from '../../bookings/services/bookingService';
import TicketCard from '../components/TicketCard';
import { useTicketData } from '../hooks/useTicketData';
import { validateCheckInTime } from '../utils/ticketUtils';
import { TICKET_STATUS } from '../constants/ticketConstants';
import ConfirmModal from '../../../shared/components/ui/Modal/ConfirmModal';

export default function DigitalTicket() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { booking, facility, isLoading, error, setBooking } = useTicketData(bookingId);
  const [timeValidation, setTimeValidation] = useState({ isValid: false, message: '' });
  const [checkInModalOpen, setCheckInModalOpen] = useState(false);

  useEffect(() => {
    if (booking?.start_time && booking?.end_time) {
      setTimeValidation(validateCheckInTime(booking.start_time, booking.end_time));

      const interval = setInterval(() => {
        setTimeValidation(validateCheckInTime(booking.start_time, booking.end_time));
      }, 60000);

      return () => clearInterval(interval);
    }
  }, [booking?.start_time, booking?.end_time]);

  const handleCheckInClick = () => {
    setCheckInModalOpen(true);
  };

  const handleConfirmCheckIn = async () => {
    try {
      toast.loading('Memproses check-in...', { id: 'checkinToast' });
      const response = await bookingService.checkInBooking(bookingId);
      
      if (response.success || response.id) {
        toast.success('Check-in berhasil!', { id: 'checkinToast' });
        setBooking({ ...booking, status: TICKET_STATUS.CHECKED_IN });
      } else {
        toast.error(response.message || 'Gagal melakukan check-in', { id: 'checkinToast' });
      }
    } catch (err) {
      toast.error('Terjadi kesalahan saat check-in', { id: 'checkinToast' });
    }
  };

  return (
    <div className="bg-surface min-h-screen py-8 px-4 md:px-8 flex-1">
      <div className="max-w-6xl mx-auto">
        <button 
          onClick={() => navigate('/civitas/history')}
          className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors mb-8 font-black text-sm uppercase tracking-wider animate-slide-up"
        >
          <ArrowLeft size={20} weight="bold" />
          Kembali ke Riwayat
        </button>

        <div className="animate-slide-up" style={{ animationDelay: '0.08s' }}>
          {isLoading ? (
            <div className="bg-white rounded-2xl shadow-ambient max-w-md mx-auto p-8 animate-pulse text-center space-y-6">
              <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto"></div>
              <div className="h-40 w-40 bg-gray-200 rounded mx-auto mt-8"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mt-8"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto mt-2"></div>
            </div>
          ) : error ? (
            <div className="bg-error-container text-on-error-container p-6 rounded-2xl shadow-ambient max-w-md mx-auto text-center">
              <p className="font-bold mb-2">Gagal Memuat Tiket</p>
              <p className="text-sm">{error}</p>
            </div>
          ) : (
            <TicketCard 
              booking={booking} 
              facility={facility}
              onCheckIn={handleCheckInClick}
              timeValidation={timeValidation}
            />
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={checkInModalOpen}
        onClose={() => setCheckInModalOpen(false)}
        onConfirm={handleConfirmCheckIn}
        title="Konfirmasi Check-In"
        message="Apakah Anda yakin ingin melakukan check-in sekarang? Pastikan Anda sudah berada di lokasi ruangan/fasilitas sebelum menekan tombol."
        confirmText="Ya, Check-In Sekarang"
        cancelText="Kembali"
        type="info"
      />
    </div>
  );
}
