import React from 'react';
import { Cube, FilePdf } from '@phosphor-icons/react';
import { getConditionLabel, getConditionClass } from '../../facilities/constants/facilityConstants';
import BookingActionFooter from './BookingActionFooter';
import { bookingService } from '../services/bookingService';
import { toast } from 'react-hot-toast';

export default function BookingDetailSidebar({ booking, status, onCancel }) {
  const handleViewDocument = async () => {
    try {
      await bookingService.viewDocument(booking.id);
    } catch (error) {
      toast.error('Gagal membuka dokumen pendukung.');
    }
  };

  return (
    <div className="bg-white rounded-card shadow-ambient border border-gray-150 p-6 md:p-8 space-y-6">
      
      {/* Extra Items List */}
      <div>
        <div className="border-l-4 border-accent pl-3 mb-4">
          <h3 className="text-sm font-black text-primary uppercase tracking-widest">Item Tambahan</h3>
          <p className="text-xs text-gray-400 mt-0.5 font-semibold">Peralatan pendukung yang dipinjam</p>
        </div>

        {booking.extra_items && booking.extra_items.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
            {booking.extra_items.map((entry, idx) => (
              <div 
                key={idx}
                className="flex items-center justify-between bg-gray-50/50 p-4 rounded-xl border border-gray-150 shadow-sm hover:bg-gray-50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-accent/10 text-accent p-2.5 rounded-xl border border-accent/10 group-hover:scale-105 transition-transform">
                    <Cube size={20} weight="fill" />
                  </div>
                  <div>
                    <p className="font-black text-gray-800 text-sm leading-tight">{entry.item?.name || 'Item Inventaris'}</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="text-[9px] text-gray-400 font-black uppercase tracking-wider">Kondisi:</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black border ${getConditionClass(entry.item?.condition)}`}>
                        {getConditionLabel(entry.item?.condition)}
                      </span>
                    </div>
                  </div>
                </div>
                <span className="font-black text-accent text-xs px-3 py-1.5 bg-accent/5 border border-accent/15 rounded-lg shrink-0">
                  {entry.quantity} Unit
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 bg-gray-50/50 rounded-xl border border-dashed border-gray-200 text-gray-400 text-xs italic">
            Tidak ada peralatan tambahan yang dipinjam.
          </div>
        )}
      </div>

      {/* Support Document */}
      <div className="pt-6 border-t border-gray-100">
        <div className="border-l-4 border-accent pl-3 mb-4">
          <h3 className="text-sm font-black text-primary uppercase tracking-widest">Dokumen Pendukung</h3>
          <p className="text-xs text-gray-400 mt-0.5 font-semibold">Surat Permohonan resmi peminjaman</p>
        </div>

        {booking.document_url ? (
          <button 
            onClick={handleViewDocument}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl transition-all font-black text-sm border border-blue-200/60 shadow-sm active:scale-99 cursor-pointer"
          >
            <FilePdf size={20} weight="fill" />
            Buka Surat Permohonan
          </button>
        ) : (
          <div className="text-center py-4 bg-gray-50/50 rounded-xl border border-dashed border-gray-200 text-gray-400 text-xs italic">
            Tidak ada dokumen pendukung terlampir.
          </div>
        )}
      </div>

      {/* Action Footer */}
      <BookingActionFooter 
        status={status}
        bookingId={booking.id}
        onCancel={onCancel}
      />

    </div>
  );
}
