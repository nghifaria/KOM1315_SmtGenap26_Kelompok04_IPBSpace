import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Users, ChalkboardTeacher, MapPin } from '@phosphor-icons/react';

export default function RoomCard({ id, name, location, capacity, status, imageUrl }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const isAvailable = status === 'Tersedia';

  const handleBookingRedirect = () => {
    navigate(`/facilities/explore/${id}`);
  };

  return (
    <div className="bg-white rounded-3xl shadow-ambient overflow-hidden flex flex-col transition-[transform,box-shadow] duration-300 hover:shadow-xl hover:-translate-y-1.5 will-change-transform transform-gpu border border-gray-100/60 select-none">
      <div className="w-full aspect-[4/3] bg-gray-100 relative overflow-hidden shrink-0">
        <img 
          src={imageUrl || "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80"} 
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105 will-change-transform transform-gpu"
        />
        {/* Badge Status */}
        <div className={`absolute top-4 right-4 px-3.5 py-1.5 rounded-full text-xs font-black shadow-sm backdrop-blur-md border ${
          isAvailable 
            ? "bg-emerald-800 text-white border-emerald-700/20" 
            : "bg-red-600 text-white border-red-500/20"
        }`}>
          {isAvailable ? "Tersedia" : "Dalam Perbaikan"}
        </div>
      </div>

      {/* Konten Kartu */}
      <div className="p-6 flex flex-col flex-grow">
        

        <h3 className="text-xl font-black text-primary leading-tight mb-2 tracking-tight line-clamp-1">{name}</h3>
        
        {/* Info Detail */}
        <div className="flex items-center text-sm font-semibold text-gray-500 mt-2 mb-6">
          <Users size={20} className="mr-2 text-accent" weight="duotone" />
          <span>Kapasitas: {capacity} Orang</span>
        </div>

        {location && (
          <div className="flex items-center text-xs font-black text-accent mb-2 tracking-wider uppercase">
            <MapPin size={16} className="mr-1.5" weight="duotone" />
            <span className="line-clamp-1">{location}</span>
          </div>
        )}
        
        {/* Tombol Booking */}
        <div className="mt-auto pt-4 border-t border-gray-50">
          <button 
            onClick={handleBookingRedirect}
            className="w-full py-3 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-sm hover:shadow active:scale-[0.97] focus:outline-none focus:ring-0 outline-none border-0"
          >
            <ChalkboardTeacher size={20} weight="fill" />
            Lihat Detail
          </button>
        </div>
      </div>
    </div>
  );
}

