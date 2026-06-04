import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";
import { MapPin, Users, ChalkboardTeacher, ShieldWarning } from "@phosphor-icons/react";
import { isFacilityAvailable } from "../shared/constants/facility";

const FacilityCard = ({ facility }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAvailable = isFacilityAvailable(facility);

  const handleBookingRedirect = () => {
    navigate(`/facilities/explore/${facility.id}`);
  };

  return (
    <div className="bg-white rounded-3xl shadow-ambient hover:shadow-xl transition-all duration-300 border border-gray-100/60 overflow-hidden flex flex-col h-full">
      {/* Gambar */}
      <div className="h-52 bg-gray-100 relative overflow-hidden shrink-0">
        <img 
          src={facility.image_url || "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80"} 
          alt={facility.name}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
        />
        {/* Badge Status */}
        <div className={`absolute top-4 right-4 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-sm backdrop-blur-md ${
          isAvailable ? "bg-green-500/90 text-white" : "bg-red-500/90 text-white"
        }`}>
          {isAvailable ? "Tersedia" : "Dalam Perbaikan"}
        </div>
      </div>

      {/* Konten Kartu */}
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-xl font-black text-primary leading-tight mb-2 tracking-tight line-clamp-1">{facility.name}</h3>
        <p className="text-gray-500 text-sm mb-4 line-clamp-2">{facility.description}</p>

        {/* Info Detail */}
        <div className="flex items-center gap-4 text-sm font-semibold text-gray-600 mb-6 mt-auto">
          <div className="flex items-center gap-1.5">
            <MapPin size={18} weight="duotone" className="text-accent" />
            <span>{facility.location}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users size={18} weight="duotone" className="text-accent" />
            <span>{facility.capacity} Org</span>
          </div>
        </div>

        {/* Tombol Booking */}
        <div className="mt-auto pt-4 border-t border-gray-50">
          {isAvailable ? (
            <button 
              onClick={handleBookingRedirect}
              className="w-full py-3 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-sm hover:shadow active:scale-98"
            >
              <ChalkboardTeacher size={20} weight="fill" />
              Pesan Sekarang
            </button>
          ) : (
            <button 
              disabled
              className="w-full py-3 bg-gray-100 text-gray-400 font-bold rounded-xl flex items-center justify-center gap-2 cursor-not-allowed border border-gray-200/50"
            >
              <ShieldWarning size={20} weight="bold" />
              Tidak Tersedia
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FacilityCard;