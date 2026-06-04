import axios from 'axios';

/**
 * Axios instance for authenticated requests to the IPB Space API.
 *
 * Handles:
 *  - Attaching Bearer token to every request
 *  - Automatic access-token refresh on 401 (using stored refresh token)
 *  - Clearing session and redirecting to /login on unrecoverable auth failure
 *
 * NOTE: 403 Forbidden is intentionally NOT handled here — that means the user
 *       IS authenticated but lacks role permission for the resource.
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
});

// -- Request interceptor --------------------------------------------------
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// -- Response interceptor --------------------------------------------------
apiClient.interceptors.response.use(
  // Unwrap the standard { success, data } envelope
  (response) => response.data,

  async (error) => {
    const originalRequest = error.config;
    // CRITICAL FIX: Only treat 401 (Unauthorized) as a token/auth error.
    // 403 (Forbidden) means the user IS authenticated but lacks ROLE permissions —
    // this must NOT trigger a logout or token refresh cycle.
    const isTokenExpired = error.response?.status === 401;
    const isAuthRoute = originalRequest?.url?.includes('/auth/login') || originalRequest?.url?.includes('/auth/register');

    if (isTokenExpired && !isAuthRoute && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          // Send refresh token as JSON body (POST /auth/refresh)
          const res = await axios.post(
            `${apiClient.defaults.baseURL}/auth/refresh`,
            { refresh_token: refreshToken },
            { headers: { 'Content-Type': 'application/json' } }
          );

          const newAccessToken = res.data?.data?.token?.access_token;
          if (newAccessToken) {
            localStorage.setItem('access_token', newAccessToken);
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
            originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
            return apiClient(originalRequest);
          }
        }
      } catch (_refreshError) {
        // Refresh failed — fall through to session clear
      }

      // Unrecoverable: clear session and send user to login
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default apiClient;
