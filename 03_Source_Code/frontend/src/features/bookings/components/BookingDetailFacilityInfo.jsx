import React from 'react';
import { MapPin, ShieldCheck, Phone } from '@phosphor-icons/react';
import { getConditionLabel, getConditionClass } from '../../facilities/constants/facilityConstants';

export default function BookingDetailFacilityInfo({ facility }) {
  return (
    <div className="bg-white rounded-card shadow-ambient border border-gray-150 p-6 md:p-8 space-y-6">
      <div className="border-l-4 border-accent pl-3">
        <h3 className="text-sm font-black text-primary uppercase tracking-widest">Informasi Fasilitas</h3>
        <p className="text-xs text-gray-400 mt-0.5 font-semibold">Detail lengkap lokasi ruangan yang digunakan</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
        {facility?.image_url && (
          <img 
            src={facility.image_url} 
            alt={facility.name} 
            className="w-full md:w-40 aspect-[4/3] rounded-xl object-cover border border-gray-200 shrink-0 shadow-sm"
          />
        )}
        <div className="space-y-3 flex-1">
          <div>
            <h4 className="font-black text-lg text-gray-800">{facility?.name || 'Fasilitas IPB'}</h4>
            <p className="text-gray-500 text-sm font-semibold flex items-center gap-1 mt-0.5">
              <MapPin size={16} className="text-accent shrink-0" weight="fill" />
              <span>{facility?.location || '-'}</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
              <p className="text-[9px] uppercase font-black text-gray-400 tracking-wider leading-none">Kapasitas Maks</p>
              <p className="text-xs font-black text-primary mt-1">{facility?.capacity || 0} Orang</p>
            </div>
            <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
              <p className="text-[9px] uppercase font-black text-gray-400 tracking-wider leading-none">Kondisi Ruangan</p>
              <div className="mt-1">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black border ${getConditionClass(facility?.condition)}`}>
                  <ShieldCheck size={12} weight="fill" />
                  {getConditionLabel(facility?.condition)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dedicated Contact Person Info Block */}
      <div className="bg-accent/5 rounded-xl p-4 border border-accent/15 flex items-start gap-3">
        <div className="bg-accent text-white p-2.5 rounded-lg shadow-sm shrink-0">
          <Phone size={18} weight="fill" />
        </div>
        <div>
          <p className="text-[9px] uppercase font-black text-accent tracking-widest leading-none">Kontak Pengelola Ruangan</p>
          <p className="text-sm font-black text-primary mt-1.5 leading-none">
            {facility?.contact_person || 'Hubungi Bagian Sarana & Prasarana Kampus'}
          </p>
          <p className="text-[10px] text-gray-500 mt-1 font-semibold leading-normal">
            Silakan hubungi kontak di atas untuk koordinasi pengambilan kunci atau operasional fasilitas.
          </p>
        </div>
      </div>
    </div>
  );
}
