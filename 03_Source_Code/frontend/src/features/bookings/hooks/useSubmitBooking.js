import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { bookingService } from '../services/bookingService';

export function useSubmitBooking(clearDraft) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitBooking = async (facilityId, values, documentFile) => {
    try {
      setIsSubmitting(true);
      toast.loading('Mengirim pengajuan...', { id: 'bookingSubmit' });

      const formData = new FormData();
      formData.append('purpose', values.purpose);
      formData.append('number_of_attendees', values.number_of_attendees);
      formData.append('date_of_booking', values.date_of_booking);
      formData.append('start_time', values.start_time);
      formData.append('end_time', values.end_time);
      formData.append('document', documentFile);
      
      if (values.extra_items && values.extra_items.length > 0) {
        formData.append('extra_items', JSON.stringify(values.extra_items));
      }

      const response = await bookingService.createBooking(facilityId, formData);
      
      if (response.success || response.id) {
        toast.success('Pengajuan berhasil dikirim!', { id: 'bookingSubmit' });
        if (clearDraft) clearDraft();
        navigate('/civitas/history');
        return true;
      } else {
        toast.error(response.message || 'Gagal mengirim pengajuan', { id: 'bookingSubmit' });
        return false;
      }
    } catch (error) {
      console.error('DEBUG: Booking submission error:', error.response?.data);
      const serverError = error.response?.data?.data?.error;
      const serverMessage = serverError?.message || error.response?.data?.detail;
      
      if (error.response?.status === 409) {
        toast.error('Jadwal bentrok dengan peminjaman lain.', { id: 'bookingSubmit' });
        return { success: false, conflict: true };
      } else if (serverError?.type === 'validation_error' && Array.isArray(serverError.details)) {
        const errors = serverError.details.map(err => {
          const field = err.loc ? err.loc[err.loc.length - 1] : 'kolom';
          return `${field}: ${err.msg}`;
        }).join(', ');
        toast.error(`Gagal validasi: ${errors}`, { id: 'bookingSubmit' });
      } else if (serverMessage) {
        toast.error(typeof serverMessage === 'string' ? serverMessage : JSON.stringify(serverMessage), { id: 'bookingSubmit' });
      } else {
        toast.error('Terjadi kesalahan sistem.', { id: 'bookingSubmit' });
      }
      return { success: false, conflict: false };
    } finally {
      setIsSubmitting(false);
    }
  };

  return { submitBooking, isSubmitting };
}
