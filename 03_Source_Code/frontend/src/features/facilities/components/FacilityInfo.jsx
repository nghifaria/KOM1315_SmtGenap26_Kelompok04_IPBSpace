import React from 'react';
import { 
  MapPin, 
  Users, 
  Info, 
  Phone, 
  ShieldCheck,
  ProjectorScreen, 
  Chalkboard, 
  Wind, 
  SpeakerHigh, 
  Television, 
  WifiHigh, 
  Microphone, 
  Chair, 
  Desktop, 
  Plug, 
  Steps,
  VideoCamera,
  Camera,
  Laptop,
  Printer,
  Lightbulb,
  BookOpen,
  Archive,
  Sidebar,
  List
} from '@phosphor-icons/react';
import { isFacilityAvailable } from '@/shared/constants/facility';
import DescriptionItem from '@/shared/components/data-display/DescriptionItem';
import AssetBadge from './ui/AssetBadge';
import { getAssetIcon, getConditionLabel, getConditionColor } from '../constants/facilityConstants';

export default function FacilityInfo({ facility }) {
  if (!facility) return null;

  const isAvailable = isFacilityAvailable(facility);

  const conditionElement = (
    <div className="mt-1">
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black border ${getConditionColor(facility.condition)}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
        {getConditionLabel(facility.condition)}
      </span>
    </div>
  );

  return (
    <div className="bg-white rounded-[2rem] shadow-ambient p-5 md:p-7 border border-gray-100">
      
      {/* Top Panel: Side-by-Side Horizontal Layout */}
      <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start pt-3">
        
        {/* Left Column: Premium Framed 4:3 Horizontal Image Container */}
        <div className="w-full md:w-[45%] aspect-[4/3] relative bg-gray-50 overflow-hidden shrink-0 rounded-2xl border border-gray-200/80 shadow-sm p-1.5">
          <img
            src={facility.image_url || 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80'}
            alt={facility.name}
            className="w-full h-full object-cover rounded-[10px] block animate-fade-in"
          />
          
          <div className="absolute top-5 left-5 px-4 py-2 bg-white/95 backdrop-blur-md rounded-full text-xs font-black shadow-sm tracking-wide uppercase border border-gray-200/50 z-20">
            {isAvailable ? (
              <span className="text-emerald-800">Tersedia</span>
            ) : (
              <span className="text-danger">Dalam Perbaikan</span>
            )}
          </div>
        </div>

        {/* Right Column: Dashboard Information Layout */}
        <div className="w-full md:w-[55%] flex flex-col justify-start">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-primary tracking-tight mb-6">
              {facility.name}
            </h1>
            
            {/* Info Parameters Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <DescriptionItem 
                icon={MapPin}
                label="Lokasi Ruangan"
                value={facility.location || '-'}
                subValue="Fakultas / Unit Kerja Kampus IPB Dramaga, Bogor, Jawa Barat"
                className="sm:col-span-2 p-5"
              />

              <DescriptionItem 
                icon={Users}
                label="Daya Tampung"
                value={<div className="flex items-baseline gap-1"><span className="font-black text-on-surface text-xl leading-none">{facility.capacity || 0}</span><span className="text-sm text-on-surface-variant font-bold">Orang</span></div>}
                subValue="Kapasitas maksimum"
              />

              <DescriptionItem 
                icon={ShieldCheck}
                label="Batas Min. Pengisian"
                value={<div className="flex items-baseline gap-1"><span className="font-black text-on-surface text-xl leading-none">{facility.threshold || 0}</span><span className="text-sm text-on-surface-variant font-bold">Orang</span></div>}
                subValue="Minimal peserta pengajuan"
              />

              <DescriptionItem 
                icon={Info}
                label="Kelayakan Fisik"
                value={conditionElement}
              />

              {/* DescriptionItem for Kontak Person */}
              <DescriptionItem 
                icon={Phone}
                label="Kontak Person"
                value={<p className="font-extrabold text-on-surface text-sm leading-snug">{facility.contact_person || 'Hubungi Admin'}</p>}
              />

            </div>

          </div>
        </div>

      </div>

      {/* Premium Full-Width Assets Bar */}
      {facility.assets && facility.assets.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100/80">
          <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">
            Aset Bawaan Ruangan
          </h4>
          <div className="flex flex-wrap gap-3">
            {facility.assets.map((asset, idx) => (
              <AssetBadge 
                key={idx}
                icon={getAssetIcon(asset.name)}
                name={asset.name}
              />
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
