import React, { useRef } from 'react';
import QRCode from 'react-qr-code';
import { toPng } from 'html-to-image';
import { toast } from 'react-hot-toast';
import { 
  CalendarBlank, 
  Clock, 
  MapPin, 
  TextAa, 
  CheckCircle, 
  DownloadSimple, 
  User,
  Info
} from '@phosphor-icons/react';
import { TICKET_STATUS } from '../constants/ticketConstants';
import logoIPBSpace from '../../../assets/icons/logo.png';

export default function TicketCard({ booking, facility, onCheckIn, timeValidation }) {
  const ticketRef = useRef(null);

  if (!booking) return null;

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const userName = user?.fullname || user?.name || 'Civitas IPB';
  
  const roleLower = user?.role?.toLowerCase() || 'civitas';
  const userRole = roleLower === 'civitas' ? 'Civitas Akademika' : (roleLower === 'admin' ? 'Administrator' : user.role);
  const userIdNumber = user?.idnum || '';

  // Booking details
  const bookingCode = `IS-${booking.id.toString().padStart(4, '0')}`;
  const adminUrl = `${window.location.origin}/admin/validate-ticket/${booking.id}`;
  
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
  const status = booking.status?.toLowerCase();

  // Download ticket as PNG
  const handleDownload = () => {
    if (!ticketRef.current) return;
    
    toast.loading('Mempersiapkan unduhan gambar...', { id: 'downloadTicketToast' });
    
    toPng(ticketRef.current, { 
      backgroundColor: '#f8fafc',
      style: {
        transform: 'scale(1)',
        borderRadius: '16px',
        boxShadow: 'none'
      },
      pixelRatio: 2
    })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `tiket_ipb_space_${bookingCode}.png`;
        link.href = dataUrl;
        link.click();
        toast.success('Tiket berhasil diunduh sebagai gambar!', { id: 'downloadTicketToast' });
      })
      .catch((error) => {
        console.error('Error generating image:', error);
        toast.error('Gagal mengunduh gambar tiket.', { id: 'downloadTicketToast' });
      });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start justify-center w-full max-w-7xl mx-auto">
      
      {/* LEFT: Ticket Boarding Pass Card */}
      <div 
        ref={ticketRef}
        className="bg-white rounded-2xl shadow-ambient overflow-hidden border border-gray-250 flex flex-col lg:flex-row relative flex-1 min-w-0"
      >
        
        {/* Main Ticket Body */}
        <div className="flex-1 p-6 md:p-8 space-y-6">
          
          {/* Header Row */}
          <div className="flex justify-between items-center gap-4 border-b border-gray-100 pb-4">
            <div className="flex items-center gap-3">
              <img 
                src={logoIPBSpace} 
                alt="IPB Space Logo" 
                className="h-11 w-11 object-contain drop-shadow-sm" 
              />
              <div>
                <span className="font-black text-2xl tracking-widest text-primary leading-none block">IPB SPACE</span>
                <span className="text-[11px] font-black text-accent tracking-widest leading-none block mt-1.5 uppercase">Boarding Access Pass</span>
              </div>
            </div>
            
            <div className="text-right">
              <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest leading-none block">Kode Pemesanan</span>
              <span className="text-xl font-black text-primary leading-none block mt-1.5 select-all bg-gray-50 border border-gray-150 px-2.5 py-1 rounded-md">
                {bookingCode}
              </span>
            </div>
          </div>

          {/* Core Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Column 1: Passenger profile */}
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="bg-primary/5 text-primary p-2.5 rounded-xl border border-primary/5 shrink-0 h-10 w-10 flex items-center justify-center">
                  <User size={20} weight="fill" className="text-accent" />
                </div>
                <div>
                  <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider block">Nama Pemesan</span>
                  <span className="font-extrabold text-base text-gray-800 block mt-0.5 leading-tight">{userName}</span>
                  <span className="text-xs text-gray-500 font-semibold block mt-0.5">
                    {userRole} {userIdNumber ? `(${userIdNumber})` : ''}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="bg-primary/5 text-primary p-2.5 rounded-xl border border-primary/5 shrink-0 h-10 w-10 flex items-center justify-center">
                  <MapPin size={20} weight="fill" className="text-accent" />
                </div>
                <div>
                  <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider block">Fasilitas / Gedung</span>
                  <span className="font-extrabold text-base text-gray-800 block mt-0.5 leading-tight">{facility?.name || 'Memuat...'}</span>
                  <span className="text-sm text-gray-500 font-semibold block mt-0.5 leading-snug">{facility?.location || 'Fasilitas Kampus IPB'}</span>
                </div>
              </div>
            </div>

            {/* Column 2: Booking schedule details */}
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="bg-primary/5 text-primary p-2.5 rounded-xl border border-primary/5 shrink-0 h-10 w-10 flex items-center justify-center">
                  <CalendarBlank size={20} weight="fill" className="text-accent" />
                </div>
                <div>
                  <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider block">Tanggal Boarding</span>
                  <span className="font-extrabold text-base text-gray-800 block mt-0.5 leading-tight">{formattedDate}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="bg-primary/5 text-primary p-2.5 rounded-xl border border-primary/5 shrink-0 h-10 w-10 flex items-center justify-center">
                  <Clock size={20} weight="fill" className="text-accent" />
                </div>
                <div>
                  <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider block">Waktu Boarding (Akses)</span>
                  <span className="font-extrabold text-base text-gray-800 block mt-0.5 leading-tight">{startTime} - {endTime} WIB</span>
                  <span className="text-xs text-gray-500 font-semibold block mt-0.5">Akses berakhir: {endTime} WIB</span>
                </div>
              </div>
            </div>

          </div>

          {/* Activities details at full width */}
          <div className="pt-4 border-t border-gray-100 flex items-start gap-3 w-full">
            <div className="bg-primary/5 text-primary p-2.5 rounded-xl border border-primary/5 shrink-0 h-10 w-10 flex items-center justify-center">
              <TextAa size={20} weight="fill" className="text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider block">Tujuan Penggunaan (Kegiatan)</span>
              <span className="font-bold text-sm text-gray-700 block mt-0.5 leading-relaxed break-words">{booking.purpose}</span>
            </div>
          </div>

        </div>

        {/* PERFORATION SEPARATOR: Dashed line and circular notches for authentic Boarding Pass feel */}
        <div className="hidden lg:flex flex-col items-center justify-between relative py-6 select-none shrink-0 w-px">
          {/* Top Notch */}
          <div className="absolute top-0 -translate-y-1/2 w-5 h-5 bg-surface rounded-full border-b border-gray-250 z-10"></div>
          {/* Dashed Line */}
          <div className="h-full border-l-2 border-dashed border-gray-300"></div>
          {/* Bottom Notch */}
          <div className="absolute bottom-0 translate-y-1/2 w-5 h-5 bg-surface rounded-full border-t border-gray-250 z-10"></div>
        </div>

        {/* Mobile Perforation Separator */}
        <div className="flex lg:hidden items-center justify-between relative px-6 select-none shrink-0 h-px w-full">
          <div className="absolute left-0 -translate-x-1/2 w-5 h-5 bg-surface rounded-full border-r border-gray-250 z-10"></div>
          <div className="w-full border-t-2 border-dashed border-gray-300"></div>
          <div className="absolute right-0 translate-x-1/2 w-5 h-5 bg-surface rounded-full border-l border-gray-250 z-10"></div>
        </div>

        {/* RIGHT SECTION: Tear-Off Boarding Stub */}
        <div className="w-full lg:w-[260px] p-6 md:p-8 bg-gray-50/55 flex flex-col items-center justify-center text-center gap-5 shrink-0">
          
          <div className="space-y-1.5">
            <span className="text-[8px] font-black text-accent tracking-widest uppercase block leading-none">Access Verification</span>
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider block">SCAN ME</span>
          </div>

          {/* QR Code Container */}
          <div className="bg-white p-3 rounded-xl border border-gray-200/80 shadow-inner inline-block hover:scale-102 transition-transform select-none">
            <QRCode value={adminUrl} size={110} />
          </div>

          <p className="text-[9px] text-gray-400 font-semibold max-w-[150px] leading-relaxed">
            Tunjukkan QR Code di atas kepada petugas jaga atau pengelola sarana untuk check-in.
          </p>

          {/* Status Badge in Stub */}
          <div className="w-full pt-2 border-t border-gray-200/50">
            <div className="flex flex-col items-center gap-3">
              {status === TICKET_STATUS.APPROVED && (
                <div className="w-full">
                  <button
                    onClick={onCheckIn}
                    disabled={!timeValidation?.isValid}
                    className="w-full py-2.5 px-4 bg-accent text-white font-black rounded-xl shadow-md hover:bg-accent-hover focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all text-xs uppercase tracking-wider active:scale-98 cursor-pointer"
                  >
                    Lakukan Check-in
                  </button>
                  {timeValidation?.message && (
                    <p className={`text-[10px] mt-2 font-semibold ${timeValidation.isValid ? 'text-green-600' : 'text-orange-500'}`}>
                      {timeValidation.message}
                    </p>
                  )}
                </div>
              )}

              {status === TICKET_STATUS.CHECKED_IN && (
                <div className="w-full">
                  <span className="w-full py-2.5 px-4 bg-green-50 text-green-700 font-black rounded-xl border border-green-200 flex items-center justify-center gap-1.5 text-xs select-none uppercase tracking-wider">
                    <CheckCircle size={16} weight="fill" />
                    Boarded
                  </span>
                  <p className="text-[10px] mt-2 font-semibold text-green-600">Akses ruangan telah diberikan.</p>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* RIGHT: Action Sidebar (Download & Boarding Guidelines) */}
      <div className="w-full lg:w-[300px] shrink-0 flex flex-col gap-5">
        
        {/* Card 1: Action Panel */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-ambient space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <div className="bg-accent/10 text-accent p-1.5 rounded-lg">
              <DownloadSimple size={18} weight="fill" />
            </div>
            <h4 className="font-black text-xs text-primary uppercase tracking-widest">
              Aksi Tiket
            </h4>
          </div>
          
          <button
            onClick={handleDownload}
            className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-accent hover:bg-accent-hover text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <DownloadSimple size={18} weight="bold" />
            Unduh Gambar Tiket
          </button>
          
          <p className="text-[10px] text-gray-500 font-semibold text-center leading-relaxed">
            Unduh tiket digital dalam format gambar PNG untuk disimpan secara offline.
          </p>
        </div>

        {/* Card 2: Guidelines */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-ambient space-y-4 flex-1">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <div className="bg-accent/10 text-accent p-1.5 rounded-lg">
              <Info size={18} weight="fill" />
            </div>
            <h4 className="font-black text-xs text-primary uppercase tracking-widest">
              Panduan Boarding
            </h4>
          </div>
          
          <ul className="space-y-3.5 text-[11px] text-gray-600 font-semibold leading-relaxed">
            <li className="flex gap-2">
              <span className="text-accent font-black">1.</span>
              <span><strong>Waktu Check-in</strong>: Akses check-in dibuka <strong>2 jam sebelum</strong> waktu mulai dan ditutup tepat <strong>30 menit setelah</strong> waktu mulai.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-accent font-black">2.</span>
              <span><strong>Validasi Mandiri</strong>: Tekan tombol <strong>Lakukan Check-in</strong> saat Anda berada di lokasi ruangan untuk konfirmasi kedatangan.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-accent font-black">3.</span>
              <span><strong>Jaga Ketertiban</strong>: Selalu jaga kebersihan fasilitas dan matikan seluruh perangkat AC/listrik setelah selesai digunakan.</span>
            </li>
          </ul>
        </div>

      </div>

    </div>
  );
}
