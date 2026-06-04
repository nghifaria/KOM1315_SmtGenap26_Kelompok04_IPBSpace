import React from 'react';
import { CalendarBlank, Clock, Users, TextAa } from '@phosphor-icons/react';

export default function BookingDetailMainInfo({ booking, formattedDate, startTime, endTime }) {
  return (
    <div className="bg-white rounded-card shadow-ambient border border-gray-150 p-6 md:p-8 space-y-6">
      <div className="border-b border-gray-100 pb-4">
        <p className="text-[10px] font-black text-accent uppercase tracking-widest leading-none">ID Peminjaman</p>
        <h1 className="text-2xl font-black text-primary mt-2 select-all">
          #{booking.id.toString().padStart(6, '0')}
        </h1>
      </div>

      {/* Grid detail for Waktu/Tanggal and Jumlah Peserta */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-3">Waktu & Tanggal</p>
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 text-gray-700 bg-gray-50/50 px-3.5 py-2.5 rounded-xl border border-gray-100 shadow-inner">
              <CalendarBlank size={18} className="text-accent" weight="fill" />
              <span className="font-semibold text-sm">{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2.5 text-gray-700 bg-gray-50/50 px-3.5 py-2.5 rounded-xl border border-gray-100 shadow-inner">
              <Clock size={18} className="text-accent" weight="fill" />
              <span className="font-semibold text-sm">{startTime} - {endTime} WIB</span>
            </div>
          </div>
        </div>

        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-3">Jumlah Peserta</p>
          <div className="flex items-center gap-2.5 text-gray-700 bg-gray-50/50 px-3.5 py-2.5 rounded-xl border border-gray-100 shadow-inner h-[94px]">
            <Users size={18} className="text-accent" weight="fill" />
            <span className="font-semibold text-sm">{booking.number_of_attendees} Orang Terdaftar</span>
          </div>
        </div>
      </div>

      {/* Full Width Block for Tujuan Kegiatan */}
      <div className="pt-4 border-t border-gray-100/50">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-3">Tujuan Kegiatan</p>
        <div className="flex items-start gap-3 text-gray-700 bg-gray-50/50 px-4 py-3.5 rounded-xl border border-gray-100 shadow-inner w-full min-h-[60px]">
          <TextAa size={20} className="text-accent shrink-0 mt-0.5" weight="fill" />
          <span className="font-semibold text-sm leading-relaxed">{booking.purpose}</span>
        </div>
      </div>
    </div>
  );
}
