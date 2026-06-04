import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { facilityService } from '../services/facilityService';
import { userService } from '../../users/services/userService';

/**
 * Hook untuk mengambil data Master (Facilities & Users) secara konkuren 
 * dan memetakannya menjadi Dictionary { id: name } untuk Data Binding.
 */
export function useValidationLookup() {
  const [facilityMap, setFacilityMap] = useState({});
  const [userMap, setUserMap] = useState({});
  const [userIdnumMap, setUserIdnumMap] = useState({});
  const [isLookupLoading, setIsLookupLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchLookups = async () => {
      try {
        setIsLookupLoading(true);
        
        // Use allSettled so one failing endpoint doesn't crash the other
        const [facilitiesResult, usersResult] = await Promise.allSettled([
          facilityService.getAllFacilities(),
          userService.getAllUsers()
        ]);

        if (isMounted) {
          // apiClient interceptor already returns response.data
          // so value = { success, data: { items: [] } } or similar shapes
          const extractArray = (v) => {
            if (Array.isArray(v?.data?.items)) return v.data.items;
            if (Array.isArray(v?.items)) return v.items;
            if (Array.isArray(v?.data)) return v.data;
            if (Array.isArray(v)) return v;
            return [];
          };

          // Process facilities
          if (facilitiesResult.status === 'fulfilled') {
            const fMap = {};
            const facilities = extractArray(facilitiesResult.value);
            facilities.forEach(f => { fMap[f.id] = f.name; });
            setFacilityMap(fMap);
          } else {
            console.error('Failed to fetch facilities:', facilitiesResult.reason);
          }

          // Process users
          if (usersResult.status === 'fulfilled') {
            const uMap = {};
            const uIdnumMap = {};
            const users = extractArray(usersResult.value);
            users.forEach(u => {
              uMap[u.id] = u.fullname || u.name;
              uIdnumMap[u.id] = u.idnum;
            });
            setUserMap(uMap);
            setUserIdnumMap(uIdnumMap);
          } else {
            console.error('Failed to fetch users:', usersResult.reason);
            // Non-fatal: user names will show as ID fallbacks
          }
        }
      } catch (error) {
        if (isMounted) {
          console.error('Failed to fetch lookup data:', error);
          toast.error('Gagal memuat data referensi.');
        }
      } finally {
        if (isMounted) {
          setIsLookupLoading(false);
        }
      }
    };

    fetchLookups();

    return () => {
      isMounted = false;
    };
  }, []);

  return { facilityMap, userMap, userIdnumMap, isLookupLoading };
}
