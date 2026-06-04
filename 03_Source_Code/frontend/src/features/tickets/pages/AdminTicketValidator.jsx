import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  ArrowLeft, 
  CheckCircle, 
  WarningCircle, 
  Clock, 
  CalendarBlank, 
  MapPin, 
  Tag, 
  User, 
  ShieldCheck,
  Package
} from '@phosphor-icons/react';
import { bookingService } from '../../bookings/services/bookingService';
import { useAuth } from '../../../context/AuthContext';
import { normalizeRole } from '../../../shared/utils/authRole';
import { useValidationLookup } from '../../facilities/hooks/useValidationLookup';

export default function AdminTicketValidator() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userMap, userIdnumMap } = useValidationLookup();
  
  const [booking, setBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBookingDetail = async () => {
    try {
      setIsLoading(true);
      const res = await bookingService.getBookingById(bookingId);
      // Handle potential different response structures
      const data = res?.data?.booking ?? res?.data ?? res;
      if (data) {
        setBooking(data);
        setError(null);
      } else {
        setError('Data reservasi tidak ditemukan.');
      }
    } catch (err) {
      console.error(err);
      setError('Gagal memuat detail reservasi untuk validasi.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookingDetail();
  }, [bookingId]);

  const handleAdminCheckIn = async () => {
    try {
      setIsSubmitting(true);
      toast.loading('Memproses check-in...', { id: 'adminCheckinToast' });
      const response = await bookingService.checkInBooking(bookingId);
      
      if (response.success || response.id || response) {
        toast.success('Check-in berhasil dikonfirmasi!', { id: 'adminCheckinToast' });
        fetchBookingDetail(); // Refresh data
      } else {
        toast.error(response.message || 'Gagal melakukan check-in', { id: 'adminCheckinToast' });
      }
    } catch (err) {
      toast.error('Terjadi kesalahan saat mengonfirmasi check-in', { id: 'adminCheckinToast' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent shadow-md"></div>
        <p className="text-primary font-bold animate-pulse">Memvalidasi Akses Tiket...</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="bg-slate-50 min-h-screen py-12 px-4 flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-8 text-center border border-slate-100">
          <WarningCircle size={64} className="text-danger mx-auto mb-4" weight="fill" />
          <h2 className="text-xl font-black text-slate-800 mb-2">Validasi Gagal</h2>
          <p className="text-slate-500 font-semibold text-sm mb-6 leading-relaxed">
            {error || 'Tiket atau reservasi tidak ditemukan dalam database.'}
          </p>
          <button 
            onClick={() => navigate('/')}
            className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary-container transition-all"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  // Parse booking dates
  const now = new Date();
  const startTime = new Date(booking.start_time);
  const endTime = new Date(booking.end_time);
  const dateObj = new Date(booking.date_of_booking || booking.start_time);
  
  const formattedDate = dateObj.toLocaleDateString('id-ID', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  
  const startStr = startTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const endStr = endTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  
  const status = (booking.status || 'pending').toLowerCase();
  
  // Calculate Ticket Validity Status
  let validity = {
    isValid: false,
    theme: 'bg-red-50 border-red-200 text-red-700',
    icon: WarningCircle,
    title: 'TIKET TIDAK VALID / BATAL',
    badge: 'bg-red-200 text-red-800',
    description: 'Reservasi ini telah dibatalkan atau ditolak.'
  };

  const isExpired = now > endTime;
  const isTooEarly = now < new Date(startTime.getTime() - 2 * 60 * 60 * 1000); // More than 2 hours early

  if (status === 'approved' || status === 'checked-in' || status === 'checked_in' || status === 'ongoing') {
    if (isExpired) {
      validity = {
        isValid: false,
        theme: 'bg-slate-100 border-slate-200 text-slate-600',
        icon: Clock,
        title: 'TIKET SUDAH KEDALUWARSA',
        badge: 'bg-slate-200 text-slate-700',
        description: 'Jadwal peminjaman ruangan untuk reservasi ini telah selesai.'
      };
    } else if (status === 'checked-in' || status === 'checked_in') {
      validity = {
        isValid: true,
        theme: 'bg-blue-50 border-blue-200 text-blue-700',
        icon: CheckCircle,
        title: 'BOARDED / SUDAH CHECK-IN',
        badge: 'bg-blue-200 text-blue-800',
        description: 'Check-in telah dikonfirmasi. Pengguna diperbolehkan mengakses ruangan.'
      };
    } else {
      validity = {
        isValid: true,
        theme: 'bg-emerald-50 border-emerald-200 text-emerald-700',
        icon: CheckCircle,
        title: 'TIKET VALID / SIAP AKSES',
        badge: 'bg-emerald-200 text-emerald-800',
        description: isTooEarly 
          ? 'Tiket terverifikasi valid, namun jam penggunaan belum dimulai.'
          : 'Tiket valid. Silakan konfirmasi check-in di bawah ini untuk memberikan akses masuk.'
      };
    }
  } else if (status === 'pending') {
    validity = {
      isValid: false,
      theme: 'bg-amber-50 border-amber-200 text-amber-700',
      icon: Clock,
      title: 'RESERVASI MENUNGGU VALIDASI',
      badge: 'bg-amber-200 text-amber-800',
      description: 'Pengajuan peminjaman ruangan ini belum disetujui oleh pengelola sarana.'
    };
  }

  const roleLabel = normalizeRole(user?.role) === 'SuperAdmin' ? 'Super Admin' : 'Admin Fasilitas';
  const applicantName = userMap[booking.user_id] || booking.user?.fullname || booking.user?.name || `Pemohon #${booking.user_id}`;
  const applicantId = userIdnumMap[booking.user_id] || booking.user?.idnum || 'Civitas Akademika IPB';

  return (
    <div className="bg-slate-50 min-h-screen py-8 px-4 md:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors font-bold text-sm uppercase tracking-wider"
        >
          <ArrowLeft size={18} weight="bold" />
          Kembali
        </button>

        {/* Validator Meta */}
        <div className="bg-primary-container text-white p-4 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center">
              <ShieldCheck size={20} weight="fill" className="text-accent" />
            </div>
            <div>
              <p className="text-[10px] text-blue-200 font-bold uppercase tracking-wider">Validator Petugas</p>
              <p className="text-sm font-black leading-none mt-1">{user?.fullname || 'Petugas Jaga'}</p>
            </div>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest bg-white/10 px-3 py-1 rounded-md border border-white/5">
            {roleLabel}
          </span>
        </div>

        {/* Validity Status Card */}
        <div className={`p-6 rounded-3xl border shadow-sm flex flex-col items-center text-center gap-3 ${validity.theme}`}>
          <validity.icon size={48} weight="fill" />
          <div>
            <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full ${validity.badge}`}>
              {status.toUpperCase()}
            </span>
            <h2 className="text-xl font-black mt-2 leading-none tracking-tight">{validity.title}</h2>
            <p className="text-xs font-semibold mt-2 max-w-md leading-relaxed opacity-90">
              {validity.description}
            </p>
          </div>
        </div>

        {/* Main Details Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 md:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Detail Fasilitas & Ruangan</span>
            <h3 className="text-xl font-black text-slate-800 leading-tight mt-1">
              {booking.facility?.name || `Fasilitas #${booking.facility_id}`}
            </h3>
            <p className="text-slate-500 text-sm font-semibold mt-1 flex items-center gap-1.5">
              <MapPin size={16} weight="fill" className="text-accent shrink-0" />
              {booking.facility?.location || 'Fasilitas Kampus IPB'}
            </p>
          </div>

          {/* Grid Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="bg-slate-50 text-slate-600 p-2.5 rounded-xl border border-slate-100 shrink-0 h-10 w-10 flex items-center justify-center">
                  <User size={20} weight="fill" className="text-accent" />
                </div>
                <div>
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Pemohon (Civitas)</span>
                  <p className="font-bold text-sm text-slate-800 block mt-0.5 leading-tight">
                    {applicantName}
                  </p>
                  <p className="text-xs text-slate-500 font-semibold block mt-0.5">
                    {booking.user?.email || applicantId}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="bg-slate-50 text-slate-600 p-2.5 rounded-xl border border-slate-100 shrink-0 h-10 w-10 flex items-center justify-center">
                  <Tag size={20} weight="fill" className="text-accent" />
                </div>
                <div>
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Agenda Kegiatan</span>
                  <p className="font-bold text-sm text-slate-700 block mt-0.5 leading-snug break-words">
                    {booking.purpose}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="bg-slate-50 text-slate-600 p-2.5 rounded-xl border border-slate-100 shrink-0 h-10 w-10 flex items-center justify-center">
                  <CalendarBlank size={20} weight="fill" className="text-accent" />
                </div>
                <div>
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Tanggal Boarding</span>
                  <p className="font-bold text-sm text-slate-800 block mt-0.5 leading-tight">
                    {formattedDate}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="bg-slate-50 text-slate-600 p-2.5 rounded-xl border border-slate-100 shrink-0 h-10 w-10 flex items-center justify-center">
                  <Clock size={20} weight="fill" className="text-accent" />
                </div>
                <div>
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Waktu Reservasi</span>
                  <p className="font-bold text-sm text-slate-800 block mt-0.5 leading-tight">
                    {startStr} - {endStr} WIB
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Reserved Extra Items (Layanan Tambahan) */}
          {booking.extra_items && booking.extra_items.length > 0 && (
            <div className="pt-6 border-t border-slate-100 space-y-3">
              <div className="flex items-center gap-2">
                <Package size={18} weight="fill" className="text-accent" />
                <h4 className="font-black text-xs text-slate-800 uppercase tracking-widest">Aset Inventaris Tambahan Terpilih</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {booking.extra_items.map((ei, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                    <span className="text-xs font-bold text-slate-700">{ei.item?.name || 'Barang'}</span>
                    <span className="text-xs font-black text-accent bg-accent/5 px-2.5 py-0.5 rounded-full border border-accent/10">
                      {ei.quantity} Unit
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Admin Validation Actions */}
          {status === 'approved' && !isExpired && (
            <div className="pt-6 border-t border-slate-100">
              <button
                onClick={handleAdminCheckIn}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black rounded-2xl shadow-md transition-all uppercase tracking-wider text-sm cursor-pointer"
              >
                <CheckCircle size={20} weight="bold" />
                {isSubmitting ? 'Mengonfirmasi...' : 'Konfirmasi Check-In & Berikan Akses'}
              </button>
            </div>
          )}

          {/* Already checked-in stub */}
          {(status === 'checked-in' || status === 'checked_in') && (
            <div className="pt-6 border-t border-slate-100 text-center py-2 bg-emerald-50/30 rounded-2xl border border-dashed border-emerald-200">
              <p className="text-xs font-bold text-emerald-700">✓ Peminjam telah melakukan check-in dan masuk ruangan.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
