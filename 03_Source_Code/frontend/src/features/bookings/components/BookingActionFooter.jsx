import React from 'react';
import { XCircle, Ticket } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { BOOKING_STATUS } from '../../../shared/constants/status';

export default function BookingActionFooter({ status, bookingId, onCancel }) {
  const navigate = useNavigate();

  return (
    <div className="pt-6 border-t border-gray-100 space-y-3">
      {status === BOOKING_STATUS.PENDING && (
        <button
          onClick={onCancel}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-sm uppercase tracking-wider text-red-600 border-2 border-red-500 hover:bg-red-50 transition-all active:scale-95 cursor-pointer shadow-sm"
        >
          <XCircle size={20} weight="bold" />
          Batalkan Pengajuan
        </button>
      )}

      {status === BOOKING_STATUS.APPROVED && (
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3.5 rounded-xl font-black text-sm uppercase tracking-wider text-red-600 border-2 border-red-500 hover:bg-red-50 transition-all active:scale-95 cursor-pointer shadow-sm text-center"
          >
            Batalkan
          </button>
          <button
            onClick={() => navigate(`/civitas/ticket/${bookingId}`)}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-sm uppercase tracking-wider text-white bg-accent hover:bg-accent-hover transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Ticket size={20} weight="fill" />
            Lihat Tiket
          </button>
        </div>
      )}
    </div>
  );
}
