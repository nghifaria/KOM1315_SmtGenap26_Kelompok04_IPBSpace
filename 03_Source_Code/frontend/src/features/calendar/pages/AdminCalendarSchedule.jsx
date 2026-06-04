import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CaretLeft, CaretRight, CalendarBlank, X, Clock, MapPin, Tag, User } from '@phosphor-icons/react';
import { bookingService } from '../../bookings/services/bookingService';
import { useValidationLookup } from '../../facilities/hooks/useValidationLookup';
import { useAuth } from '../../../context/AuthContext';
import { normalizeRole } from '../../../shared/utils/authRole';
import { toast } from 'react-hot-toast';

const formatTime = (timeStr) => {
  if (!timeStr) return '';
  if (typeof timeStr === 'string') {
    if (timeStr.includes('T')) {
      return timeStr.split('T')[1].slice(0, 5);
    }
    if (timeStr.includes(' ')) {
      return timeStr.split(' ')[1].slice(0, 5);
    }
    return timeStr.slice(0, 5);
  }
  return '';
};

// ─── Status helpers ───────────────────────────────────────────────────────────
function getStatusMeta(status) {
  const s = (status || '').toLowerCase();
  if (s === 'approved')   return { label: 'Disetujui',    pill: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' };
  if (s === 'checked_in' || s === 'checked-in') return { label: 'Check-In',  pill: 'bg-blue-100 text-blue-700 border-blue-200',     dot: 'bg-blue-500' };
  if (s === 'ongoing')    return { label: 'Berlangsung',  pill: 'bg-blue-100 text-blue-700 border-blue-200',    dot: 'bg-blue-500' };
  if (s === 'pending')    return { label: 'Menunggu',     pill: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500' };
  if (s === 'rejected')   return { label: 'Ditolak',      pill: 'bg-red-100 text-red-700 border-red-200',       dot: 'bg-red-500' };
  if (s === 'cancelled' || s === 'canceled') return { label: 'Dibatalkan', pill: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' };
  return { label: status || '—', pill: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400' };
}

function getPillStyle(status) {
  const s = (status || '').toLowerCase();
  if (s === 'approved')   return 'bg-emerald-50 border border-emerald-100 text-emerald-700 hover:bg-emerald-100';
  if (s === 'checked_in' || s === 'checked-in' || s === 'ongoing') return 'bg-blue-50 border border-blue-100 text-blue-700 hover:bg-blue-100';
  if (s === 'pending')    return 'bg-amber-50 border border-amber-100 text-amber-700 hover:bg-amber-100';
  if (s === 'rejected' || s === 'cancelled' || s === 'canceled') return 'bg-red-50 border border-red-100 text-red-600 hover:bg-red-100 opacity-70';
  return 'bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200';
}

const getCalendarStatusLabel = (status) => {
  const s = (status || '').toLowerCase();
  if (s === 'approved') return 'Disetujui';
  if (s === 'pending') return 'Menunggu';
  if (s === 'rejected') return 'Ditolak';
  if (s === 'canceled' || s === 'cancelled') return 'Dibatalkan';
  if (s === 'ongoing') return 'Berlangsung';
  if (s === 'checked_in' || s === 'checked-in') return 'Check-in';
  return status || '—';
};

function getActionCopy(actionType, force) {
  if (force) {
    return {
      title: 'Force Override Persetujuan',
      subtitle: 'Gunakan untuk membatalkan booking yang sudah disetujui. Aksi ini hanya untuk SuperAdmin.',
      reasonLabel: 'Alasan force override',
      confirmLabel: 'Konfirmasi Override',
    };
  }

  if (actionType === 'rejected') {
    return {
      title: 'Tolak Permohonan',
      subtitle: 'Permohonan akan ditolak dan alasan akan ditampilkan ke pemohon.',
      reasonLabel: 'Alasan penolakan',
      confirmLabel: 'Konfirmasi Tolak',
    };
  }

  return {
    title: 'Setujui Permohonan',
    subtitle: 'Pastikan detail booking sudah benar sebelum menyetujui.',
    reasonLabel: 'Alasan tambahan',
    confirmLabel: 'Konfirmasi Setujui',
  };
}

function ActionReasonModal({ isOpen, actionState, onClose, onConfirm }) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setIsSubmitting(false);
    }
  }, [isOpen, actionState?.booking?.id]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen || !actionState?.booking) return null;

  const { title, subtitle, reasonLabel, confirmLabel } = getActionCopy(actionState.actionType, actionState.force);
  const booking = actionState.booking;
  const isReasonRequired = actionState.actionType === 'rejected' || actionState.force;

  const handleSubmit = async () => {
    if (isReasonRequired && !reason.trim()) return;
    setIsSubmitting(true);
    try {
      await onConfirm({
        booking,
        actionType: actionState.actionType,
        force: actionState.force,
        reason: reason.trim(),
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const facilityName = actionState.facilityName || 'Fasilitas';
  const userName = actionState.userName || 'Pemohon';

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/55 backdrop-blur-md overflow-hidden">
      <div className="w-full max-w-2xl max-h-[calc(100vh-2rem)] rounded-[28px] bg-white shadow-[0_30px_80px_rgba(2,39,93,0.28)] overflow-hidden border border-slate-100 flex flex-col">
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-primary/70 mb-2">Aksi Kalender</p>
            <h3 className="text-xl font-black text-slate-900">{title}</h3>
            <p className="text-sm text-slate-500 mt-1 leading-relaxed">{subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 h-10 w-10 rounded-full bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors"
          >
            <X size={18} weight="bold" className="mx-auto" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6 scroll-smooth">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="text-[11px] uppercase tracking-[0.2em] font-black text-slate-400 mb-1">Ruangan</p>
              <p className="text-sm font-bold text-slate-800">{facilityName}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="text-[11px] uppercase tracking-[0.2em] font-black text-slate-400 mb-1">Pemohon</p>
              <p className="text-sm font-bold text-slate-800">{userName}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="text-[11px] uppercase tracking-[0.2em] font-black text-slate-400 mb-1">Tanggal</p>
              <p className="text-sm font-bold text-slate-800">{booking.date_of_booking ? new Date(booking.date_of_booking).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="text-[11px] uppercase tracking-[0.2em] font-black text-slate-400 mb-1">Waktu</p>
              <p className="text-sm font-bold text-slate-800">{formatTime(booking.start_time)} - {formatTime(booking.end_time)}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[11px] uppercase tracking-[0.2em] font-black text-slate-400 mb-2">Detail Permohonan</p>
            <p className="text-sm text-slate-700 leading-relaxed font-medium">{booking.purpose || 'Tidak ada deskripsi agenda.'}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
              <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">Status: {getCalendarStatusLabel(booking.status)}</span>
              <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">Peserta: {booking.number_of_attendees || 0}</span>
            </div>
          </div>

          {actionState.actionType === 'approved' ? (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
              <p className="text-sm font-bold text-emerald-900">Permohonan ini masih menunggu keputusan.</p>
              <p className="text-sm text-emerald-800/90 mt-1">Setujui jika jadwal aman. Jika perlu penolakan, gunakan tombol Tolak.</p>
            </div>
          ) : actionState.force ? (
            <div className="rounded-2xl border border-amber-100 bg-amber-50/80 p-4">
              <p className="text-sm font-bold text-amber-900">Force override akan membatalkan persetujuan yang sudah ada.</p>
              <p className="text-sm text-amber-800/90 mt-1">Jelaskan alasan secara spesifik agar audit log dan notifikasi lebih jelas.</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-red-100 bg-red-50/80 p-4">
              <p className="text-sm font-bold text-red-900">Penolakan akan langsung tercatat dan alasan akan dikirim ke pemohon.</p>
              <p className="text-sm text-red-800/90 mt-1">Isi alasan yang singkat, jelas, dan spesifik.</p>
            </div>
          )}

          {isReasonRequired && (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">{reasonLabel}</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={actionState.force ? 'Contoh: Jadwal bentrok dengan agenda prioritas kampus.' : 'Contoh: Dokumen tidak valid / informasi belum lengkap.'}
                className="w-full min-h-[120px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all resize-none"
              />
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-3 rounded-2xl border border-slate-200 bg-white text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || (isReasonRequired && !reason.trim())}
              className={`px-6 py-3 rounded-2xl font-black text-sm text-white shadow-lg transition-all active:scale-95 ${
                actionState.force
                  ? 'bg-amber-500 hover:bg-amber-600'
                  : actionState.actionType === 'rejected'
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-primary hover:bg-primary-container'
              } disabled:bg-slate-300 disabled:cursor-not-allowed`}
            >
              {isSubmitting ? 'Memproses...' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Day Detail Modal ─────────────────────────────────────────────────────────
function DayDetailModal({ isOpen, onClose, dateLabel, events, facilityMap, userMap, onActionRequest, canForceOverride }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden animate-slide-up flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-none">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <CalendarBlank size={20} weight="fill" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Detail Jadwal</p>
              <h2 className="text-lg font-black text-slate-800 leading-tight">{dateLabel}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-full transition-colors"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-3">
          {events.length === 0 ? (
            <div className="py-10 text-center text-slate-400">
              <CalendarBlank size={40} weight="light" className="mx-auto mb-3 opacity-50" />
              <p className="font-semibold text-sm">Tidak ada kegiatan pada hari ini.</p>
            </div>
          ) : (
            events
              .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))
              .map((ev, idx) => {
                const meta = getStatusMeta(ev.status);
                const statusLower = (ev.status || '').toLowerCase();
                const facilityName = facilityMap[ev.facility_id] || `Fasilitas #${ev.facility_id}`;
                const userName = userMap[ev.user_id] || `User #${ev.user_id}`;
                const startT = formatTime(ev.start_time) || '--:--';
                const endT   = formatTime(ev.end_time) || '--:--';

                return (
                  <div
                    key={idx}
                    className="group rounded-[1.3rem] border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md hover:-translate-y-[1px] transition-all"
                  >
                    {/* Status + Time */}
                    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full border ${meta.pill}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                        {meta.label}
                      </span>
                      <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
                        <Clock size={13} weight="bold" />
                        <span>{startT} – {endT}</span>
                      </div>
                    </div>

                    {/* Facility & Agenda */}
                    <div className="space-y-2.5">
                      <div className="flex items-start gap-2">
                        <MapPin size={14} weight="fill" className="text-primary mt-0.5 shrink-0" />
                        <p className="text-sm font-bold text-slate-700">{facilityName}</p>
                      </div>
                      {ev.purpose && (
                        <div className="flex items-start gap-2">
                          <Tag size={14} weight="fill" className="text-accent mt-0.5 shrink-0" />
                          <p className="text-sm font-semibold text-slate-600 leading-snug">{ev.purpose}</p>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <User size={14} weight="fill" className="text-slate-400 shrink-0" />
                        <p className="text-xs font-semibold text-slate-500">{userName}</p>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-2">
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">Peserta {ev.number_of_attendees || 0}</span>
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">ID #{ev.id}</span>
                        {ev.validated_by && (
                          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">Validasi: {ev.validated_by}</span>
                        )}
                      </div>

                      <div className="pt-3 flex flex-col sm:flex-row gap-2">
                        {statusLower === 'pending' && (
                          <>
                            <button
                              onClick={() => onActionRequest?.(ev, 'approved', false)}
                              className="px-4 py-2.5 text-sm font-bold rounded-2xl bg-primary text-white hover:bg-primary-container transition-colors shadow-sm"
                            >
                              Setujui
                            </button>
                            <button
                              onClick={() => onActionRequest?.(ev, 'rejected', false)}
                              className="px-4 py-2.5 text-sm font-bold rounded-2xl bg-red-50 text-red-700 hover:bg-red-100 transition-colors border border-red-100"
                            >
                              Tolak
                            </button>
                          </>
                        )}

                        {statusLower === 'approved' && canForceOverride && (
                          <button
                            onClick={() => onActionRequest?.(ev, 'canceled', true)}
                            className="px-4 py-2.5 text-sm font-black rounded-2xl bg-amber-500 text-white hover:bg-amber-600 transition-colors shadow-sm"
                          >
                            Batalkan Persetujuan
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 p-4 bg-slate-50/70 flex items-center justify-between flex-none">
          <span className="text-xs font-semibold text-slate-400">
            {events.length} kegiatan terjadwal
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-white border border-slate-200 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-50 transition-all active:scale-95"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminCalendarSchedule() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [eventsMap, setEventsMap] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null); // { dateStr, dateLabel, events }
  const [refreshKey, setRefreshKey] = useState(0);
  const [actionState, setActionState] = useState(null);

  const { facilityMap, userMap } = useValidationLookup();
  const { user } = useAuth();
  const isSuperAdmin = normalizeRole(user?.role) === 'SuperAdmin';

  const openActionDialog = (booking, actionType, force = false) => {
    setActionState({
      booking,
      actionType,
      force,
      facilityName: facilityMap[booking.facility_id] || `Fasilitas #${booking.facility_id}`,
      userName: userMap[booking.user_id] || `User #${booking.user_id}`,
    });
  };

  const handleActionConfirm = async ({ booking, actionType, force, reason }) => {
    try {
      await bookingService.updateBookingStatus(booking.id, {
        new_status: actionType,
        reason: reason || undefined,
        force,
      });
      const successLabel = force
        ? 'Force override berhasil diproses.'
        : actionType === 'rejected'
          ? 'Peminjaman ditolak.'
          : 'Peminjaman disetujui.';
      toast.success(successLabel);
      setSelectedDay(prev => prev ? { ...prev, events: prev.events.filter(event => event.id !== booking.id) } : prev);
      setRefreshKey(key => key + 1);
    } catch (error) {
      const apiMessage = error?.response?.data?.data?.error?.message || error?.response?.data?.detail || error?.message;
      toast.error(apiMessage || 'Gagal memperbarui status booking.');
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    const fetchBookings = async () => {
      try {
        setIsLoading(true);
        const res = await bookingService.getAllBookings();
        if (isMounted) {
          // apiClient interceptor already returns response.data
          const all = res?.data?.items ?? res?.items ?? (Array.isArray(res) ? res : []);
          
          // Group by date string YYYY-MM-DD based on date_of_booking (correct field)
          const grouped = {};
          all.forEach(b => {
            // Use date_of_booking as primary key since it's the actual booking date
            const dateStr = b.date_of_booking
              ? b.date_of_booking.slice(0, 10)  // 'YYYY-MM-DD'
              : null;
            if (!dateStr) return;
            if (!grouped[dateStr]) grouped[dateStr] = [];
            grouped[dateStr].push(b);
          });
          
          setEventsMap(grouped);
        }
      } catch (err) {
        if (isMounted) {
          console.error(err);
          toast.error("Gagal memuat jadwal peminjaman.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    
    fetchBookings();
    return () => { isMounted = false; };
  }, [refreshKey]);

  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "Januari","Februari","Maret","April","Mei","Juni",
    "Juli","Agustus","September","Oktober","November","Desember"
  ];
  const dayNamesShort = ["Min","Sen","Sel","Rab","Kam","Jum","Sab"];

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const handleGoToToday = () => setCurrentDate(new Date());

  // Build grid
  const daysInMonth      = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth  = new Date(year, month, 1).getDay();

  const calendarDays = [];

  // Prev month padding
  const prevMonthDate      = new Date(year, month, 0);
  const prevMonthDaysCount = prevMonthDate.getDate();
  const prevMonthVal       = prevMonthDate.getMonth();
  const prevYearVal        = prevMonthDate.getFullYear();

  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const d = prevMonthDaysCount - i;
    calendarDays.push({ dayNum: d, month: prevMonthVal, year: prevYearVal, isCurrentMonth: false, date: new Date(prevYearVal, prevMonthVal, d) });
  }

  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({ dayNum: i, month, year, isCurrentMonth: true, date: new Date(year, month, i) });
  }

  const nextMonthDate = new Date(year, month + 1, 1);
  const nextMonthVal  = nextMonthDate.getMonth();
  const nextYearVal   = nextMonthDate.getFullYear();
  const totalCells    = 42;
  const nextDaysNeeded = totalCells - calendarDays.length;
  for (let i = 1; i <= nextDaysNeeded; i++) {
    calendarDays.push({ dayNum: i, month: nextMonthVal, year: nextYearVal, isCurrentMonth: false, date: new Date(nextYearVal, nextMonthVal, i) });
  }

  const todayObj = new Date();
  const todayStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth()+1).padStart(2,'0')}-${String(todayObj.getDate()).padStart(2,'0')}`;

  const handleCellClick = (cell) => {
    const d   = cell.date;
    const ds  = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const evs = eventsMap[ds] || [];
    const label = d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    setSelectedDay({ dateStr: ds, dateLabel: label, events: evs });
  };

  return (
    <div className="flex-grow p-4 md:p-8 bg-[#F4F7FB] min-h-full">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-black text-primary mb-1">Kalender Jadwal</h1>
        <p className="text-slate-500 text-sm font-medium">
          Pantau pemanfaatan fasilitas harian. <strong className="text-slate-600">Klik tanggal</strong> untuk melihat detail kegiatan.
        </p>
      </div>

      {/* Calendar Header */}
      <div className="bg-white p-4 md:p-6 rounded-t-2xl border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={handleGoToToday}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-sm transition-colors border border-slate-200 shadow-sm active:scale-95"
          >
            <CalendarBlank size={18} weight="bold" />
            Bulan Ini
          </button>
        </div>

        <div className="flex items-center gap-6">
          <button 
            onClick={handlePrevMonth}
            className="p-2.5 bg-slate-50 hover:bg-primary hover:text-white text-slate-600 rounded-xl transition-all border border-slate-200 shadow-sm active:scale-90"
          >
            <CaretLeft size={18} weight="bold" />
          </button>
          
          <h2 className="text-xl font-black text-slate-800 tracking-wide w-56 text-center uppercase">
            {monthNames[month]} {year}
          </h2>

          <button 
            onClick={handleNextMonth}
            className="p-2.5 bg-slate-50 hover:bg-primary hover:text-white text-slate-600 rounded-xl transition-all border border-slate-200 shadow-sm active:scale-90"
          >
            <CaretRight size={18} weight="bold" />
          </button>
        </div>
        
        <div className="hidden md:block w-[120px]"></div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-b-2xl shadow-sm border border-t-0 border-slate-200 overflow-hidden">
        {/* Day name headers */}
        <div className="grid grid-cols-7 gap-px bg-slate-100">
          {dayNamesShort.map((day, idx) => (
            <div key={idx} className="bg-slate-50 py-3.5 text-center text-xs font-black text-slate-400 uppercase tracking-widest">
              {day}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-px bg-slate-100">
          {calendarDays.map((cell, idx) => {
            const ds = `${cell.date.getFullYear()}-${String(cell.date.getMonth()+1).padStart(2,'0')}-${String(cell.date.getDate()).padStart(2,'0')}`;
            const isToday = ds === todayStr && cell.isCurrentMonth;
            const cellEvents = eventsMap[ds] || [];
            const hasEvents  = cellEvents.length > 0;

            const MAX_PILLS = 3;
            const visibleEvents = cellEvents.slice(0, MAX_PILLS);
            const remaining     = cellEvents.length - MAX_PILLS;

            return (
              <div
                key={idx}
                onClick={() => handleCellClick(cell)}
                className={`
                  min-h-[110px] md:min-h-[140px] p-2 md:p-2.5 cursor-pointer transition-all duration-150 group
                  ${!cell.isCurrentMonth
                    ? 'bg-slate-50/60 opacity-50'
                    : 'bg-white hover:bg-blue-50/40'}
                  ${isToday ? '!bg-blue-50/70 ring-2 ring-inset ring-primary/20' : ''}
                `}
                title={`Klik untuk melihat detail — ${ds}`}
              >
                {/* Day number */}
                <div className="flex justify-end items-start mb-1.5">
                  <span className={`
                    w-7 h-7 flex items-center justify-center rounded-full text-xs font-black transition-all
                    ${isToday
                      ? 'bg-primary text-white shadow-md scale-105'
                      : cell.isCurrentMonth
                        ? 'text-slate-700 group-hover:bg-slate-100'
                        : 'text-slate-300'}
                  `}>
                    {cell.dayNum}
                  </span>
                </div>

                {/* Event pills */}
                <div className="space-y-1 overflow-hidden">
                  {visibleEvents.map((ev, i) => {
                    const pillCls = getPillStyle(ev.status);
                    const facilityName = facilityMap[ev.facility_id] || 'Ruangan';
                    const startT = formatTime(ev.start_time);
                    return (
                      <div
                        key={i}
                        className={`text-[10px] font-bold px-1.5 py-1 rounded-md truncate transition-colors ${pillCls}`}
                        title={`${startT} | ${facilityName} | ${ev.purpose || ''}`}
                      >
                        {startT && <span className="mr-1">{startT}</span>}
                        {facilityName}
                      </div>
                    );
                  })}
                  {remaining > 0 && (
                    <div className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md text-center">
                      +{remaining} lagi
                    </div>
                  )}
                </div>

                {/* Empty day prompt (hover) */}
                {!hasEvents && cell.isCurrentMonth && (
                  <div className="mt-2 text-[9px] font-semibold text-slate-300 text-center opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-wide">
                    Lihat Detail
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 text-xs font-bold text-slate-600 flex-wrap">
        {[
          { color: 'bg-emerald-100 border-emerald-200', label: 'Disetujui' },
          { color: 'bg-blue-100 border-blue-200',       label: 'Berlangsung / Check-In' },
          { color: 'bg-amber-100 border-amber-200',     label: 'Menunggu Validasi' },
          { color: 'bg-red-100 border-red-200',         label: 'Ditolak / Dibatalkan' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-2.5">
            <span className={`w-5 h-5 rounded-md border ${item.color} shadow-sm`} />
            <span className="uppercase tracking-wider">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Day Detail Modal */}
      <DayDetailModal
        isOpen={!!selectedDay}
        onClose={() => setSelectedDay(null)}
        dateLabel={selectedDay?.dateLabel || ''}
        events={selectedDay?.events || []}
        facilityMap={facilityMap}
        userMap={userMap}
        onActionRequest={openActionDialog}
        canForceOverride={isSuperAdmin}
      />

      <ActionReasonModal
        isOpen={!!actionState}
        actionState={actionState}
        onClose={() => setActionState(null)}
        onConfirm={handleActionConfirm}
      />
    </div>
  );
}
