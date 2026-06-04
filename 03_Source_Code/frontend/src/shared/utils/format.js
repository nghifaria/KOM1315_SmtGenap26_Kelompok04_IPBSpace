/**
 * Format date string to Indonesian locale long format
 * @param {string} dateString 
 * @returns {string}
 */
export const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  } catch (e) {
    return dateString;
  }
};

/**
 * Format datetime string to Indonesian locale time (HH:mm)
 * @param {string} dateString 
 * @returns {string}
 */
export const formatTime = (dateString) => {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return '';
  }
};
