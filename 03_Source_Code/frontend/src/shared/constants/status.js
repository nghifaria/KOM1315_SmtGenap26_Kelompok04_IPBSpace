export const STATUS_MAP = {
  pending: {
    bg: 'bg-warning/20',
    text: 'text-warning',
    label: 'Menunggu'
  },
  waiting: {
    bg: 'bg-warning/20',
    text: 'text-warning',
    label: 'Menunggu'
  },
  approved: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    label: 'Disetujui'
  },
  success: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    label: 'Berhasil'
  },
  rejected: {
    bg: 'bg-error-container',
    text: 'text-on-error-container',
    label: 'Ditolak'
  },
  canceled: {
    bg: 'bg-error-container',
    text: 'text-on-error-container',
    label: 'Dibatalkan'
  },
  cancelled: {
    bg: 'bg-error-container',
    text: 'text-on-error-container',
    label: 'Dibatalkan'
  },
  'checked-in': {
    bg: 'bg-green-50 text-green-700 border border-green-200',
    text: 'text-green-700',
    label: 'Checked In'
  }
};

export const DEFAULT_STATUS = {
  bg: 'bg-gray-100',
  text: 'text-gray-800',
  label: 'Unknown'
};

export const BOOKING_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELED: 'canceled',
  CHECKED_IN: 'checked-in',
};
