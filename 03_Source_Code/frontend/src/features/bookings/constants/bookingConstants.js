export const BOOKING_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELED: 'canceled',
  CHECKED_IN: 'checked-in'
};

export const BOOKING_FILTER_TABS = [
  { id: 'all', label: 'Semua' },
  { id: BOOKING_STATUS.PENDING, label: 'Menunggu Validasi' },
  { id: BOOKING_STATUS.APPROVED, label: 'Disetujui' },
  { id: BOOKING_STATUS.CHECKED_IN, label: 'Checked In' },
  { id: BOOKING_STATUS.REJECTED, label: 'Ditolak' },
  { id: BOOKING_STATUS.CANCELED, label: 'Dibatalkan' }
];

export const INITIAL_BOOKING_FORM_STATE = {
  date_of_booking: '',
  start_time: '',
  end_time: '',
  purpose: '',
  number_of_attendees: '',
  extra_items: []
};

export const BOOKING_MESSAGES = {
  SUCCESS_CREATE: 'Pengajuan berhasil dikirim!',
  ERROR_CREATE: 'Gagal mengirim pengajuan',
  ERROR_CONFLICT: 'Jadwal bentrok dengan peminjaman lain.',
  ERROR_SYSTEM: 'Terjadi kesalahan sistem.',
  VALIDATION_REQUIRED: 'Gagal mengirim: Silakan lengkapi kolom formulir yang wajib diisi.',
  LOGIN_REQUIRED: 'Silakan login terlebih dahulu untuk mengajukan peminjaman.',
  SUCCESS_CANCEL: 'Peminjaman dibatalkan.',
  ERROR_CANCEL: 'Gagal membatalkan peminjaman.',
  ERROR_CANCEL_SYSTEM: 'Terjadi kesalahan saat membatalkan peminjaman.',
  ERROR_FETCH_HISTORY: 'Gagal memuat riwayat peminjaman.'
};

export const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB in bytes
