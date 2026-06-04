import { useState, useEffect } from 'react';
import publicApiClient from '../../../shared/services/api/publicApiClient';
import { BOOKING_STATUS } from '../../../shared/constants/status';

export const useFacilityBookings = (facilityId) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!facilityId) return;

    const fetchBookings = async () => {
      setLoading(true);
      try {
        const res = await publicApiClient.get(`/bookings/facility/${facilityId}`);
        if (res.success && res.data && res.data.items) {
          const activeBookings = res.data.items.filter(b => {
            const status = b.status?.toLowerCase();
            return status === BOOKING_STATUS.APPROVED || status === 'ongoing' || status === BOOKING_STATUS.PENDING;
          });
          setBookings(activeBookings);
        } else {
          setBookings([]);
        }
      } catch (err) {
        console.error('Error fetching facility bookings:', err);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [facilityId]);

  return { bookings, loading };
};
