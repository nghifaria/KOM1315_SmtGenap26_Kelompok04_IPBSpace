import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BookingFormWidget from '../components/BookingFormWidget';
import { facilityService } from '../../facilities/services/facilityService';
import { ArrowLeft } from '@phosphor-icons/react';

export default function BookingForm() {
  const { facilityId } = useParams();
  const navigate = useNavigate();
  const [facility, setFacility] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  useEffect(() => {
    const fetchFacility = async () => {
      try {
        const response = await facilityService.getFacilityById(facilityId);
        const data = response?.data?.facility || response?.data || response;
        if (data) {
          setFacility(data);
        }
      } catch (err) {
        console.error('Failed to fetch facility details:', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (facilityId) {
      fetchFacility();
    }
  }, [facilityId]);

  return (
    <div className="bg-surface min-h-screen py-8 px-4 md:px-8 flex-1">
      <div className="max-w-6xl mx-auto">
        <button 
          onClick={() => navigate(`/facilities/explore/${facilityId}`)}
          className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors mb-6 font-semibold animate-slide-up"
        >
          <ArrowLeft size={20} weight="bold" />
          Kembali ke Detail Fasilitas
        </button>

        <div className="animate-slide-up" style={{ animationDelay: '0.08s' }}>
          {loading ? (
            <div className="bg-white rounded-2xl shadow-ambient p-6 md:p-8 animate-pulse">
              <div className="h-8 bg-gray-200 rounded-md w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded-md w-1/2 mb-10"></div>
              <div className="space-y-6">
                <div className="h-12 bg-gray-100 rounded-xl"></div>
                <div className="h-12 bg-gray-100 rounded-xl"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="h-12 bg-gray-100 rounded-xl"></div>
                  <div className="h-12 bg-gray-100 rounded-xl"></div>
                  <div className="h-12 bg-gray-100 rounded-xl"></div>
                </div>
                <div className="h-32 bg-gray-100 rounded-xl"></div>
                <div className="h-14 bg-gray-200 rounded-xl mt-6"></div>
              </div>
            </div>
          ) : (
            <BookingFormWidget 
              facilityId={facilityId} 
              facilityName={facility?.name || 'Fasilitas Tidak Diketahui'} 
              facility={facility}
            />
          )}
        </div>
      </div>
    </div>
  );
}
