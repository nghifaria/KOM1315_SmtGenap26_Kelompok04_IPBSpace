import React, { useState, useEffect } from 'react';
import { X, CalendarBlank, Clock, Users, FilePdf, Eye, WarningCircle, FileDashed, Info, ArrowSquareOut } from '@phosphor-icons/react';
import { formatDate, formatTime } from '../../../shared/utils/format';
import { bookingService } from '../services/bookingService';

export default function ValidationActionModal({
  isOpen,
  onClose,
  booking,
  onSubmit,
  onViewPDF,    // kept for compat, but we now inline-load the doc
  userMap = {},
  facilityMap = {}
}) {
  const [showRejectPrompt, setShowRejectPrompt] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Document viewer state
  const [docBlobUrl, setDocBlobUrl] = useState(null);
  const [isDocLoading, setIsDocLoading] = useState(false);
  const [docError, setDocError] = useState(null);
  const [isDownloadingRaw, setIsDownloadingRaw] = useState(false);

  // Reset every time a new booking is opened
  useEffect(() => {
    if (isOpen && booking) {
      setShowRejectPrompt(false);
      setRejectionReason('');
      setIsSubmitting(false);
      setDocBlobUrl(null);
      setDocError(false);

      // Auto-load document if it exists
      if (booking.document_url) {
        loadDocument(booking.id);
      }
    }
    // Cleanup blob URL on close
    return () => {
      if (docBlobUrl) {
        URL.revokeObjectURL(docBlobUrl);
        setDocBlobUrl(null);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, booking?.id]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const loadDocument = async (bookingId) => {
    try {
      setIsDocLoading(true);
      setDocError(null);

      const blob = await bookingService.getBookingDocument(bookingId);

      if (blob instanceof Blob) {
        const url = URL.createObjectURL(blob);
        setDocBlobUrl(url);
      } else {
        setDocError('Dokumen yang diterima tidak valid.');
      }
    } catch (err) {
      let message = 'Gagal memuat dokumen';

      try {
        const text = await err.response.data.text();
        const json = JSON.parse(text);

        message =
          json?.data?.error?.message ||
          json?.detail ||
          message;
      } catch (e) {
        console.error(e);
      }

      setDocError(message);


      // setDocError(
      //   err?.response?.data?.detail ||
      //   err?.message ||
      //   'Terjadi kesalahan saat memuat dokumen.'
      // );
    } finally {
      setIsDocLoading(false);
    }
  };

  const handleOpenInNewTab = () => {
    if (docBlobUrl) {
      window.open(docBlobUrl, '_blank');
    } else if (onViewPDF) {
      onViewPDF(booking.id);
    }
  };

  const handleDownloadRaw = async () => {
    if (!booking?.document_url) return;
    try {
      setIsDownloadingRaw(true);
      const blob = await bookingService.getRawSecuredDocument(booking.document_url);
      const filename = booking.document_url.split('/').pop() || 'document.secured';
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Gagal mengunduh raw ciphertext: ' + err.message);
    } finally {
      setIsDownloadingRaw(false);
    }
  };

  if (!isOpen || !booking) return null;

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(booking.id, 'approved', '');
    } catch {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(booking.id, 'rejected', rejectionReason);
    } catch {
      setIsSubmitting(false);
    }
  };

  const userName = userMap[booking.user_id] || `User ID: ${booking.user_id}`;
  const facilityName = facilityMap[booking.facility_id] || `Fasilitas ID: ${booking.facility_id}`;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
      <div
        className="fixed inset-0 bg-[#02275D]/45 backdrop-blur-[5px] animate-fade-in cursor-default"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden animate-slide-up z-10 my-auto border border-slate-100">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Info size={20} weight="bold" />
            </div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Tinjauan Peminjaman</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-full transition-colors"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Body — Grid Layout */}
        <div className="p-6 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left Column: Info (1/3) */}
            <div className="space-y-6 lg:pr-6 lg:border-r border-slate-100">

              {/* Peminjam */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 mb-3 tracking-wider uppercase">Informasi Peminjam</h3>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <p className="font-bold text-slate-800 text-base">{userName}</p>
                  <p className="text-sm text-slate-500 mt-0.5">Civitas Akademika IPB</p>
                </div>
              </div>

              {/* Reservasi */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 mb-3 tracking-wider uppercase">Detail Reservasi</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-1">Ruangan / Fasilitas</p>
                    <p className="font-bold text-primary text-sm bg-primary/5 inline-block px-2.5 py-1 rounded-md">{facilityName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-1">Tujuan Penggunaan</p>
                    <p className="font-medium text-slate-700 text-sm leading-relaxed">{booking.purpose}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div className="flex items-start gap-2">
                      <CalendarBlank size={18} className="text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Tanggal</p>
                        <p className="font-semibold text-slate-700 text-sm mt-0.5">{formatDate(booking.date_of_booking)}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock size={18} className="text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Waktu</p>
                        <p className="font-semibold text-slate-700 text-sm mt-0.5">{formatTime(booking.start_time)} – {formatTime(booking.end_time)}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Users size={18} className="text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Peserta</p>
                        <p className="font-semibold text-slate-700 text-sm mt-0.5">{booking.number_of_attendees} Orang</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Extra Items */}
              {booking.extra_items && booking.extra_items.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-slate-400 mb-3 tracking-wider uppercase">Kebutuhan Tambahan</h3>
                  <ul className="space-y-2 bg-slate-50 rounded-xl p-4 border border-slate-100">
                    {booking.extra_items.map((ei, idx) => (
                      <li key={idx} className="text-sm text-slate-700 flex justify-between items-center border-b border-slate-200/50 last:border-0 pb-2 last:pb-0">
                        <span className="font-medium">{ei.item?.name || `Item #${ei.item_id}`}</span>
                        <span className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded text-xs">{ei.quantity} Unit</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Storage Security & Integrity Audit */}
              {booking.document_url && (
                <div className="bg-slate-900 text-slate-100 rounded-xl p-4 border border-blue-500/20 space-y-3 shadow-md shadow-blue-950/20">
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                    <span className="text-xs">🔒</span>
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-blue-400">Storage Security & Integrity Audit</h4>
                  </div>
                  <div className="space-y-2 text-[10px] font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Storage Mode:</span>
                      <span className="text-slate-200 font-bold">LOCAL_DISK (Encrypted)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Cipher:</span>
                      <span className="text-emerald-400 font-bold">AES-256-GCM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Signature:</span>
                      <span className="text-blue-300 font-bold">RSASSA-PSS (2048)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Integrity:</span>
                      <span className="text-amber-400 font-bold">SHA-256 Digest</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
                    {docBlobUrl && (
                      <a
                        href={docBlobUrl}
                        download={booking.document_url.split('/').pop().replace('.secured', '')}
                        className="w-full py-2 bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-95 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 text-center"
                      >
                        📄 Download PDF Asli (Didekripsi)
                      </a>
                    )}
                    <button
                      onClick={handleDownloadRaw}
                      disabled={isDownloadingRaw}
                      className="w-full py-2 bg-amber-500/10 hover:bg-amber-500/20 active:scale-95 text-amber-400 border border-amber-500/20 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {isDownloadingRaw ? 'Downloading...' : '📥 Download Raw Ciphertext (.secured)'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Document Viewer (2/3) */}
            <div className="lg:col-span-2 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase">Dokumen Pendukung</h3>
                {docBlobUrl && (
                  <button
                    onClick={handleOpenInNewTab}
                    className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline transition-all"
                  >
                    <ArrowSquareOut size={14} weight="bold" />
                    Buka di Tab Baru
                  </button>
                )}
              </div>

              <div className="flex-1 min-h-[340px] rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex flex-col items-center justify-center relative">
                {/* Loading */}
                {isDocLoading && (
                  <div className="flex flex-col items-center gap-3 text-slate-400">
                    <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
                    <p className="text-sm font-semibold">Memuat dokumen...</p>
                  </div>
                )}

                {/* PDF Inline Viewer */}
                {!isDocLoading && docBlobUrl && (
                  <iframe
                    src={docBlobUrl}
                    title="Dokumen Pendukung"
                    className="w-full h-full min-h-[340px] border-0 rounded-xl"
                  />
                )}

                {/* Error / No Doc states */}
                {!isDocLoading && !docBlobUrl && (
                  <div className="flex flex-col items-center text-center p-8 group">
                    {booking.document_url && !docError ? null : (
                      <>
                        {docError ? (
                          <>
                            <FilePdf size={48} className="text-red-300 mb-4" weight="light" />
                            <p className="text-slate-600 font-bold mb-1">
                              Gagal memuat dokumen
                            </p>
                            <p className="text-sm text-slate-500 mb-4">
                              {docError}
                            </p>
                            <button
                              onClick={() => loadDocument(booking.id)}
                              className="px-4 py-2 bg-white border border-slate-200 shadow-sm rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all"
                            >
                              Coba Lagi
                            </button>
                          </>
                        ) : (
                          <>
                            <FileDashed size={48} className="text-slate-300 mb-4" weight="light" />
                            <p className="text-slate-500 font-medium">Pemohon tidak melampirkan dokumen pendukung.</p>
                          </>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-slate-100">
                <button
                  onClick={() => setShowRejectPrompt(true)}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 text-sm font-bold text-danger bg-red-50 hover:bg-red-100 rounded-btn transition-colors"
                >
                  Tolak Permohonan
                </button>
                <button
                  onClick={handleApprove}
                  disabled={isSubmitting}
                  className="px-8 py-2.5 text-sm font-bold text-white bg-primary hover:bg-primary-container rounded-btn shadow-md shadow-primary/20 transition-all active:scale-95"
                >
                  {isSubmitting ? 'Memproses...' : 'Setujui Permohonan'}
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Rejection Overlay */}
        {showRejectPrompt && (
          <div className="absolute inset-0 z-10 flex items-center justify-center p-4 bg-white/90 backdrop-blur-sm animate-slide-up">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <WarningCircle size={24} className="text-danger" weight="fill" />
                  Tolak Permohonan?
                </h3>
                <button
                  onClick={() => setShowRejectPrompt(false)}
                  disabled={isSubmitting}
                  className="text-slate-400 hover:text-slate-600 bg-slate-50 p-1.5 rounded-full"
                >
                  <X size={18} weight="bold" />
                </button>
              </div>

              <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                Anda akan menolak permohonan peminjaman ini secara permanen. Mohon berikan <strong>alasan penolakan</strong> untuk dikirimkan kepada peminjam.
              </p>

              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full p-4 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-danger focus:border-danger outline-none transition-all resize-none h-32 text-sm mb-6"
                placeholder="Tuliskan alasan penolakan secara spesifik..."
                required
              />

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowRejectPrompt(false)}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-btn transition-colors"
                >
                  Batalkan
                </button>
                <button
                  onClick={handleReject}
                  disabled={isSubmitting || !rejectionReason.trim()}
                  className="px-6 py-2.5 text-sm font-bold text-white bg-danger hover:bg-red-600 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-btn shadow-md transition-all active:scale-95 flex items-center justify-center min-w-[140px]"
                >
                  {isSubmitting ? 'Memproses...' : 'Konfirmasi Tolak'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
