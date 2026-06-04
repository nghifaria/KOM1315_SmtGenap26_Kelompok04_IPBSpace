import { useState, useEffect } from 'react';
import { facilityService } from '../services/facilityService';

export const useFacilities = () => {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        setLoading(true);
        const response = await facilityService.getAllFacilities();
        if (response.success) {
          setFacilities(response.data.items || []);
        } else {
          setError('Gagal memuat data fasilitas.');
        }
      } catch (err) {
        setError(err.message || 'Terjadi kesalahan saat memuat fasilitas.');
      } finally {
        setLoading(false);
      }
    };

    fetchFacilities();
  }, []);

  return { facilities, loading, error };
};
