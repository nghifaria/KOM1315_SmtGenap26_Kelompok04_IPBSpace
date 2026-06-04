import { useState, useEffect } from 'react';
import { bookingService } from '../services/bookingService';
import { facilityService } from '../../facilities/services/facilityService';

export function useBookingDetail(bookingId) {
  const [booking, setBooking] = useState(null);
  const [facility, setFacility] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchBookingDetails = async () => {
      try {
        setIsLoading(true);
        const bookingRes = await bookingService.getBookingById(bookingId);
        const bookingData = bookingRes?.data?.booking || bookingRes?.data || bookingRes;

        if (bookingData && isMounted) {
          setBooking(bookingData);
          if (bookingData.facility_id) {
            const facRes = await facilityService.getFacilityById(bookingData.facility_id);
            const facData = facRes?.data?.facility || facRes?.data || facRes;
            if (isMounted) setFacility(facData);
          }
        } else if (isMounted) {
          setError('Data peminjaman tidak ditemukan.');
        }
      } catch (err) {
        if (isMounted) setError('Gagal memuat detail peminjaman.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    if (bookingId) {
      fetchBookingDetails();
    }

    return () => {
      isMounted = false;
    };
  }, [bookingId]);

  return { booking, facility, isLoading, error, setBooking };
}
