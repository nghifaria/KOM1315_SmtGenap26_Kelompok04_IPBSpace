import React from 'react';
import { CalendarBlank, Clock, TextAa, Ticket, XCircle } from '@phosphor-icons/react';
import StatusBadge from '../../../shared/components/ui/Badge/StatusBadge';
import { BOOKING_STATUS } from '../constants/bookingConstants';

export default function BookingHistoryCard({ booking, facilityName, onCancel, onViewTicket, onViewDetail }) {
  const status = booking.status?.toLowerCase();
  
  // Parse dates
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

  return (
    <div className="bg-white rounded-2xl shadow-ambient p-5 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border border-gray-100 transition-all hover:shadow-md mb-4">
      <div className="flex-1 space-y-3.5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-[10px] font-black text-accent bg-accent/5 border border-accent/15 px-2 py-0.5 rounded-md select-all">
              #{booking.id.toString().padStart(6, '0')}
            </span>
            <h3 className="text-xl font-black text-primary leading-tight">{facilityName || 'Memuat fasilitas...'}</h3>
          </div>
          <p className="text-sm font-medium text-gray-500 flex items-center gap-1.5">
            <TextAa size={16} weight="bold" />
            {booking.purpose}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-1.5">
            <CalendarBlank size={18} weight="duotone" className="text-accent" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={18} weight="duotone" className="text-accent" />
            <span>{startTime} - {endTime} WIB</span>
          </div>
        </div>
        
        {status === BOOKING_STATUS.REJECTED && booking.rejection_reason && (
          <div className="mt-2 text-sm bg-red-50 text-red-600 p-3 rounded-lg border border-red-100">
            <strong>Alasan Penolakan:</strong> {booking.rejection_reason}
          </div>
        )}
      </div>

      {/* Kanan: Badge Status dan Aksi */}
      <div className="flex flex-col items-start md:items-end gap-3 w-full md:w-auto mt-2 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100">
        <StatusBadge status={status} />
        
        <div className="flex flex-wrap items-center gap-2 mt-1 w-full md:w-auto justify-end">
          <button
            onClick={() => onViewDetail(booking.id)}
            className="flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl text-sm font-bold border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors flex-1 md:flex-none"
          >
            Detail
          </button>

          {status === BOOKING_STATUS.PENDING && (
            <button
              onClick={() => onCancel(booking.id)}
              className="flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl text-sm font-bold border border-red-500 text-red-600 hover:bg-red-50 transition-colors w-full md:w-auto"
            >
              <XCircle size={18} weight="bold" />
              Batalkan
            </button>
          )}

          {status === BOOKING_STATUS.APPROVED && (
            <>
              <button
                onClick={() => onCancel(booking.id)}
                className="flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl text-sm font-bold border border-red-500 text-red-600 hover:bg-red-50 transition-colors flex-1 md:flex-none"
              >
                Batalkan
              </button>
              <button
                onClick={() => onViewTicket(booking.id)}
                className="flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl text-sm font-bold bg-accent text-white hover:bg-accent-hover transition-colors shadow-sm flex-1 md:flex-none"
              >
                <Ticket size={18} weight="fill" />
                Lihat Tiket
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
