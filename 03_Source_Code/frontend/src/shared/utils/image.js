/**
 * Helper to get absolute image URL pointing to backend if path is relative
 * Uses VITE_API_BASE_URL injected at build time by Vite.
 * @param {string} url
 * @returns {string}
 */
export const getImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
  const cleanBase = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${cleanBase}${cleanPath}`;
};
