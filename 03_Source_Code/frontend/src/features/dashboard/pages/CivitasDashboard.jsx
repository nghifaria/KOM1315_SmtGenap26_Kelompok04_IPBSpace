import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CalendarBlank, 
  MapPin, 
  Clock, 
  FolderSimple, 
  ClockCounterClockwise, 
  CheckCircle,
  BookOpen,
  Question,
  CaretDown,
  CaretUp,
  Phone,
  EnvelopeSimple,
  ShieldWarning,
  HandWaving
} from '@phosphor-icons/react';
import { useAuth } from '../../../context/AuthContext';
import { bookingService } from '../../bookings/services/bookingService';
import { facilityService } from '../../facilities/services/facilityService';
import RoomCard from '../../facilities/components/RoomCard';
import { isFacilityAvailable } from '../../../shared/constants/facility';
import StatusBadge from '../../../shared/components/ui/Badge/StatusBadge';
import { toast } from 'react-hot-toast';
import { formatDate, formatTime } from '../../../shared/utils/format';

export default function CivitasDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [recommendedFacilities, setRecommendedFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalStats, setTotalStats] = useState({ total: 0, pending: 0, approved: 0 });
  const [activeFaq, setActiveFaq] = useState(null);

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const faqs = [
    {
      q: "Berapa lama proses validasi pengajuan peminjaman?",
      a: "Proses validasi oleh Pengelola Fasilitas (Facility Admin) dilakukan dengan cepat, biasanya hanya membutuhkan waktu beberapa jam saja pada jam kerja. Status terbaru dapat dipantau langsung di halaman Riwayat."
    },
    {
      q: "Apakah saya bisa membatalkan peminjaman yang sudah disetujui?",
      a: "Ya, Anda dapat membatalkan peminjaman sebelum waktu mulai yang dijadwalkan melalui tombol Batal di halaman Detail Tiket Anda."
    },
    {
      q: "Bagaimana cara melakukan check-in ruangan di lokasi?",
      a: "Untuk melakukan check-in, Anda cukup menekan tombol check-in yang tersedia di halaman Detail Tiket Anda saat sudah berada di lokasi. Tiket digital sendiri dapat diperlihatkan kepada penjaga ruangan ketika Anda meminta kunci ruangan atau jika diminta oleh petugas."
    }
  ];

  useEffect(() => {
    let isMounted = true;

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch both my bookings and all facilities concurrently
        const [bookingsRes, facilitiesRes] = await Promise.all([
          bookingService.getMyBookings(),
          facilityService.getAllFacilities()
        ]);
        
        const allBookings = bookingsRes?.data?.items || [];
        const allFacilities = facilitiesRes?.success ? (facilitiesRes.data?.items || []) : (facilitiesRes?.items || []);
        
        if (isMounted) {
          // Slice the first 3 bookings for the recent bookings list
          setBookings(Array.isArray(allBookings) ? allBookings.slice(0, 3) : []);
          
          // Calculate stats from all bookings dynamically
          const total = allBookings.length;
          const pending = allBookings.filter(b => b.status?.toLowerCase() === 'pending').length;
          const approved = allBookings.filter(b => 
            b.status?.toLowerCase() === 'approved' || 
            b.status?.toLowerCase() === 'checked-in' ||
            b.status?.toLowerCase() === 'checked_in'
          ).length;
          
          setTotalStats({ total, pending, approved });

          // Get 3 recommended facilities (available first)
          const sortedFacilities = [...allFacilities]
            .sort((a, b) => {
              const aAvail = isFacilityAvailable(a) ? 1 : 0;
              const bAvail = isFacilityAvailable(b) ? 1 : 0;
              return bAvail - aAvail;
            })
            .slice(0, 3);
          setRecommendedFacilities(sortedFacilities);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Failed to fetch dashboard data:', error);
          toast.error('Gagal memuat data beranda.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="bg-surface-bright py-8 px-4 md:px-8 min-h-screen flex-1">
      <style>{`
        @keyframes wave {
          0% { transform: rotate( 0.0deg) }
          10% { transform: rotate(14.0deg) }
          20% { transform: rotate(-8.0deg) }
          30% { transform: rotate(14.0deg) }
          40% { transform: rotate(-4.0deg) }
          50% { transform: rotate(10.0deg) }
          60% { transform: rotate( 0.0deg) }
          100% { transform: rotate( 0.0deg) }
        }
        .animate-waving-hand {
          animation: wave 2.5s infinite;
          transform-origin: 70% 70%;
          display: inline-block;
        }
      `}</style>
      <div className="max-w-6xl mx-auto">
        {/* Greeting Section */}
        <section className="mb-8 animate-slide-up flex items-center gap-3.5 py-2">
          <div className="text-accent shrink-0 animate-waving-hand">
            <HandWaving size={44} weight="duotone" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-primary leading-tight">
              Halo, {user?.fullname || 'Civitas'}!
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Selamat datang di IPB Space. Ada yang bisa kami bantu hari ini?
            </p>
          </div>
        </section>

        {/* Bento Grid Stats Section */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 animate-slide-up" style={{ animationDelay: '0.05s' }}>
          <div className="bg-white border border-slate-100 rounded-card p-5 shadow-ambient flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 text-primary-container rounded-xl flex items-center justify-center shrink-0">
              <FolderSimple size={24} weight="fill" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Pengajuan</p>
              <p className="text-2xl font-black text-slate-800 mt-0.5">{totalStats.total}</p>
            </div>
          </div>
          <div className="bg-white border border-slate-100 rounded-card p-5 shadow-ambient flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 text-warning rounded-xl flex items-center justify-center shrink-0">
              <ClockCounterClockwise size={24} weight="fill" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Menunggu Validasi</p>
              <p className="text-2xl font-black text-slate-800 mt-0.5">{totalStats.pending}</p>
            </div>
          </div>
          <div className="bg-white border border-slate-100 rounded-card p-5 shadow-ambient flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
              <CheckCircle size={24} weight="fill" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Disetujui & Aktif</p>
              <p className="text-2xl font-black text-slate-800 mt-0.5">{totalStats.approved}</p>
            </div>
          </div>
        </section>

        {/* Quick Action Card */}
        <section 
          className="bg-gradient-to-r from-primary-container to-secondary-container text-white rounded-card p-6 md:p-8 shadow-ambient flex flex-col md:flex-row md:justify-between md:items-center gap-6 mb-8 animate-slide-up" 
          style={{ animationDelay: '0.1s' }}
        >
          <div className="space-y-2">
            <h2 className="text-xl md:text-2xl font-bold">Butuh ruangan untuk kegiatan?</h2>
            <p className="text-white/80 max-w-md text-sm md:text-base leading-relaxed">
              Eksplorasi berbagai fasilitas yang tersedia di lingkungan IPB University dan ajukan peminjaman sekarang juga.
            </p>
          </div>
          <button
            onClick={() => navigate('/facilities/explore')}
            className="bg-accent hover:bg-accent/95 text-white px-8 py-3 rounded-btn font-semibold hover:brightness-110 transition-all shadow-md active:scale-95 whitespace-nowrap cursor-pointer"
          >
            Ajukan Peminjaman
          </button>
        </section>

        {/* Recent Bookings Section */}
        <section className="mb-8 animate-slide-up" style={{ animationDelay: '0.15s' }}>
          <header className="flex justify-between items-end mb-4">
            <h2 className="text-lg font-bold text-primary">Status Peminjaman Terkini</h2>
            {bookings.length > 0 && (
              <button
                onClick={() => navigate('/civitas/history')}
                className="text-sm font-semibold text-secondary hover:text-accent transition-colors underline-offset-4 hover:underline cursor-pointer"
              >
                Lihat Semua
              </button>
            )}
          </header>

          {loading ? (
            <BookingSkeletons />
          ) : bookings.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          )}
        </section>

        {/* Recommended Facilities Section */}
        <section className="mb-8 animate-slide-up" style={{ animationDelay: '0.18s' }}>
          <header className="flex justify-between items-end mb-4">
            <div>
              <h2 className="text-lg font-bold text-primary">Rekomendasi Fasilitas Kampus</h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Pilihan tempat terbaik untuk menunjang kegiatan akademik dan kemahasiswaan.</p>
            </div>
            <button
              onClick={() => navigate('/facilities/explore')}
              className="text-sm font-semibold text-secondary hover:text-accent transition-colors underline-offset-4 hover:underline cursor-pointer"
            >
              Lihat Semua
            </button>
          </header>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 space-y-4 animate-pulse" style={{ contentVisibility: 'auto', containIntrinsicSize: '0 320px' }}>
                  <div className="w-full aspect-[4/3] bg-slate-200 rounded-2xl"></div>
                  <div className="h-5 bg-slate-200 rounded w-2/3"></div>
                  <div className="h-4 bg-slate-100 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : recommendedFacilities.length === 0 ? (
            <div className="bg-white rounded-card p-8 text-center border border-slate-100">
              <p className="text-slate-400 text-sm font-medium">Belum ada rekomendasi fasilitas tersedia.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recommendedFacilities.map((room) => (
                <RoomCard 
                  key={room.id}
                  id={room.id}
                  name={room.name}
                  location={room.location}
                  capacity={room.capacity}
                  status={isFacilityAvailable(room) ? "Tersedia" : "Dalam Perbaikan"}
                  imageUrl={room.image_url}
                />
              ))}
            </div>
          )}
        </section>

        {/* Booking Guide Section */}
        <section className="mb-8 animate-slide-up bg-white border border-slate-100 p-6 md:p-8 rounded-card shadow-ambient" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-lg font-bold text-primary mb-6 flex items-center gap-2">
            <BookOpen size={22} weight="fill" className="text-accent" />
            Panduan Peminjaman Fasilitas
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            <div className="space-y-2.5">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary-container font-black flex items-center justify-center text-sm">
                1
              </div>
              <h3 className="font-bold text-slate-800 text-sm">Cari Fasilitas</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Cari dan telusuri berbagai ruangan atau lapangan yang tersedia di kampus melalui menu eksplorasi.
              </p>
            </div>
            <div className="space-y-2.5">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary-container font-black flex items-center justify-center text-sm">
                2
              </div>
              <h3 className="font-bold text-slate-800 text-sm">Ajukan Peminjaman</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Pilih waktu mulai dan selesai, lalu isi formulir tujuan kegiatan secara lengkap dan kirimkan.
              </p>
            </div>
            <div className="space-y-2.5">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary-container font-black flex items-center justify-center text-sm">
                3
              </div>
              <h3 className="font-bold text-slate-800 text-sm">Verifikasi Dokumen</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Pengelola fasilitas (Facility Admin) akan memvalidasi data pengajuan peminjaman Anda.
              </p>
            </div>
            <div className="space-y-2.5">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary-container font-black flex items-center justify-center text-sm">
                4
              </div>
              <h3 className="font-bold text-slate-800 text-sm">Dapatkan Tiket</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Tiket digital dilengkapi QR-Code diterbitkan secara instan begitu peminjaman disetujui.
              </p>
            </div>
          </div>
        </section>

        {/* Bottom Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-4 animate-slide-up" style={{ animationDelay: '0.25s' }}>
          {/* FAQ Accordion Section */}
          <section className="bg-white border border-slate-100 p-6 md:p-8 rounded-card shadow-ambient flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold text-primary mb-6 flex items-center gap-2">
                <Question size={22} weight="fill" className="text-accent" />
                Pertanyaan Umum (FAQ)
              </h2>
              <div className="divide-y divide-slate-100">
                {faqs.map((faq, index) => {
                  const isOpen = activeFaq === index;
                  return (
                    <div key={index} className="py-4 first:pt-0 last:pb-0">
                      <button
                        onClick={() => toggleFaq(index)}
                        className="w-full flex items-center justify-between font-bold text-slate-700 text-sm md:text-base text-left hover:text-primary transition-colors cursor-pointer"
                      >
                        <span>{faq.q}</span>
                        {isOpen ? <CaretUp size={18} /> : <CaretDown size={18} />}
                      </button>
                      {isOpen && (
                        <p className="mt-2 text-xs md:text-sm text-slate-500 leading-relaxed animate-fade-in pl-1">
                          {faq.a}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Policies & Contact Section */}
          <section className="bg-white border border-slate-100 p-6 md:p-8 rounded-card shadow-ambient flex flex-col justify-between gap-6">
            <div>
              <h2 className="text-lg font-bold text-primary mb-6 flex items-center gap-2">
                <ShieldWarning size={22} weight="fill" className="text-accent" />
                Kebijakan & Kontak Bantuan
              </h2>
              <div className="space-y-4 text-slate-600">
                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-amber-50 text-warning flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold">!</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide">Ketentuan Pengajuan</h4>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      Pengajuan peminjaman disarankan dilakukan paling lambat H-1 sebelum kegiatan agar proses verifikasi digital dapat berjalan maksimal.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold">✓</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide">Tanggung Jawab Pengguna</h4>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      Wajib menjaga ketertiban, kebersihan, dan keutuhan fasilitas selama masa peminjaman berlangsung.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 space-y-3">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide">Layanan Bantuan Sarpras IPB</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a 
                  href="https://wa.me/6281373073310" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/20 transition-all text-slate-600 hover:text-emerald-700 cursor-pointer"
                >
                  <Phone size={18} className="text-emerald-500" weight="fill" />
                  <div>
                    <p className="font-bold text-[11px] leading-tight">WhatsApp Helpdesk</p>
                    <p className="text-slate-400 font-medium text-[10px] mt-0.5">+62 813-7307-3310</p>
                  </div>
                </a>
                <a 
                  href="mailto:sarpras@ipbspace.my.id" 
                  className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/20 transition-all text-slate-600 hover:text-blue-700 cursor-pointer"
                >
                  <EnvelopeSimple size={18} className="text-blue-500" weight="fill" />
                  <div>
                    <p className="font-bold text-[11px] leading-tight">Email Pengaduan</p>
                    <p className="text-slate-400 font-medium text-[10px] mt-0.5 font-mono">sarpras@ipbspace.my.id</p>
                  </div>
                </a>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

const BookingCard = ({ booking }) => (
  <article
    className="bg-white rounded-card shadow-ambient p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-accent hover:shadow-lg transition-all cursor-default group border border-slate-100"
  >
    <div className="flex-1">
      <h3 className="font-bold text-gray-800 text-base mb-2 group-hover:text-primary transition-colors">
        {booking.facility?.name || 'Fasilitas IPB'}
      </h3>
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 text-sm text-gray-500">
        <div className="flex items-center gap-1.5">
          <CalendarBlank size={16} />
          <span>{formatDate(booking.start_time)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock size={16} />
          <span>{formatTime(booking.start_time)} - {formatTime(booking.end_time)}</span>
        </div>
        {booking.facility?.location && (
          <div className="flex items-center gap-1.5">
            <MapPin size={16} />
            <span className="truncate max-w-[150px]">{booking.facility.location}</span>
          </div>
        )}
      </div>
    </div>
    <div className="flex justify-end items-center mt-2 md:mt-0">
      <StatusBadge status={booking.status} />
    </div>
  </article>
);

const BookingSkeletons = () => (
  <div className="space-y-4">
    {[1, 2].map((i) => (
      <div key={i} className="bg-white rounded-card p-4 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 animate-pulse">
        <div className="h-16 w-16 bg-gray-200 rounded-lg shrink-0"></div>
        <div className="flex-1 space-y-3 py-1">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="h-8 w-24 bg-gray-200 rounded-full md:self-center"></div>
      </div>
    ))}
  </div>
);

const EmptyState = () => (
  <div className="bg-white rounded-card p-10 text-center shadow-sm border border-slate-100 flex flex-col items-center justify-center">
    <div className="w-16 h-16 bg-surface-dim rounded-full flex items-center justify-center mb-4">
      <CalendarBlank size={32} className="text-gray-400" />
    </div>
    <h3 className="text-lg font-semibold text-gray-700 mb-1">Belum ada peminjaman aktif</h3>
    <p className="text-sm text-gray-500 max-w-sm">
      Anda belum memiliki riwayat peminjaman fasilitas. Silakan lakukan peminjaman terlebih dahulu.
    </p>
  </div>
);
