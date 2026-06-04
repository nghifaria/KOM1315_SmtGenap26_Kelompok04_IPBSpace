import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import { facilityService } from '../services/facilityService';
import { isFacilityAvailable } from '@/shared/constants/facility';
import FacilityInfo from '../components/FacilityInfo';

export default function FacilityDetail() {
  const { facilityId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [facility, setFacility] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchFacility = async () => {
      try {
        setIsLoading(true);
        const res = await facilityService.getFacilityById(facilityId);
        const data = res?.data?.facility || res?.data || res;
        
        if (data && isMounted) {
          setFacility(data);
        } else if (isMounted) {
          setError('Data fasilitas tidak ditemukan.');
        }
      } catch (err) {
        if (isMounted) setError('Terjadi kesalahan saat memuat fasilitas.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchFacility();

    return () => {
      isMounted = false;
    };
  }, [facilityId]);

  const handleBookingRedirect = () => {
    if (!user) {
      toast.error('Silakan login terlebih dahulu untuk memesan ruangan.');
      navigate('/login');
      return;
    }
    navigate(`/civitas/booking/${facilityId}`);
  };

  const isAvailable = isFacilityAvailable(facility);

  return (
    <div className="min-h-screen bg-surface py-8 px-4 md:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <button 
          onClick={() => navigate('/facilities/explore')}
          className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors mb-2 font-semibold"
        >
          <ArrowLeft size={20} weight="bold" />
          Kembali ke Eksplorasi
        </button>

        {isLoading ? (
          <div className="space-y-6 animate-pulse">
            <div className="bg-white rounded-[2rem] p-5 md:p-7 border border-gray-100 grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
              <div className="md:col-span-5 aspect-[4/3] bg-gray-200 rounded-2xl w-full"></div>
              <div className="md:col-span-7 space-y-4 py-2">
                <div className="h-10 bg-gray-200 rounded-lg w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded-lg w-1/2"></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                  <div className="h-20 bg-gray-150 rounded-xl"></div>
                  <div className="h-20 bg-gray-150 rounded-xl"></div>
                  <div className="h-20 bg-gray-150 rounded-xl"></div>
                  <div className="h-20 bg-gray-150 rounded-xl"></div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-card p-6 md:p-8 h-24 border border-gray-100 flex items-center justify-between">
              <div className="space-y-2 w-1/2">
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-100 rounded w-1/2"></div>
              </div>
              <div className="h-12 bg-gray-200 rounded-xl w-32"></div>
            </div>
          </div>
        ) : error ? (
          <div className="bg-error-container text-on-error-container p-8 rounded-card text-center shadow-sm">
            <h2 className="text-xl font-bold mb-2">Oops!</h2>
            <p>{error}</p>
          </div>
        ) : (
          <div className="space-y-6">
            <FacilityInfo facility={facility} />
            
            {/* CTA Box */}
            <div className="bg-white rounded-card shadow-ambient p-6 md:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 border border-gray-100">
              <div className="space-y-1">
                <h3 className="text-xl font-black text-primary">Ingin meminjam ruangan ini?</h3>
                <p className="text-gray-500 text-sm">
                  Silakan klik tombol di samping untuk melanjutkan ke formulir pengajuan resmi peminjaman.
                </p>
              </div>
              <button
                onClick={handleBookingRedirect}
                disabled={!isAvailable}
                className={`px-8 py-4 font-black rounded-xl shadow-md transition-all uppercase tracking-wider text-sm whitespace-nowrap w-full sm:w-auto text-center ${
                  isAvailable
                    ? 'bg-accent hover:bg-accent-hover text-white active:scale-98'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isAvailable ? 'Pesan Sekarang' : 'Dalam Perbaikan'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
