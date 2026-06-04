/**
 * Validates whether the user is within the allowed check-in time window.
 * Rule: Check-in can be done starting 2 hours before the reservation start time,
 * up to 30 minutes after the reservation start time.
 * 
 * @param {string|Date} startTime - Reservation start time
 * @param {string|Date} endTime - Reservation end time
 * @returns {{isValid: boolean, message: string}}
 */
export const validateCheckInTime = (startTime, endTime) => {
  if (!startTime || !endTime) {
    return { isValid: false, message: 'Waktu peminjaman tidak valid' };
  }

  const now = new Date();
  const start = new Date(startTime);
  const end = new Date(endTime);

  // Check-in opens 2 hours before start time
  const twoHoursBefore = new Date(start.getTime() - 2 * 60 * 60 * 1000);
  // Check-in closes 30 minutes after start time
  const thirtyMinsAfter = new Date(start.getTime() + 30 * 60 * 1000);

  if (now < twoHoursBefore) {
    const timeDiffMs = twoHoursBefore - now;
    const hours = Math.floor(timeDiffMs / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    let timeString = '';
    if (hours > 0) timeString += `${hours} jam `;
    timeString += `${minutes} menit`;
    
    return { 
      isValid: false, 
      message: `Check-in baru dibuka 2 jam sebelum mulai (Buka dalam ${timeString})` 
    };
  }

  if (now > thirtyMinsAfter) {
    if (now > end) {
      return { isValid: false, message: 'Waktu peminjaman telah selesai' };
    }
    return { 
      isValid: false, 
      message: 'Batas akhir check-in telah ditutup (maksimal 30 menit setelah waktu mulai)' 
    };
  }

  return { isValid: true, message: 'Silakan lakukan check-in' };
};
