import apiClient from '../../../shared/services/api/apiClient';

export const authService = {
  /**
   * Register a new user account.
   * @param {{ fullname: string, idnum: string, email: string, password: string, role?: string }} data
   */
  register: async (data) => {
    return await apiClient.post('/auth/register', data);
  },

  /**
   * Authenticate with email + password.
   * Returns { success, data: { user, token: { access_token, refresh_token } } }
   * @param {{ email: string, password: string }} credentials
   */
  login: async (credentials) => {
    return await apiClient.post('/auth/login', credentials);
  },

  /**
   * Exchange a refresh token for a new access token.
   * Sends the token as a JSON body, matching POST /auth/refresh.
   * @param {string} refreshToken
   */
  refresh: async (refreshToken) => {
    return await apiClient.post('/auth/refresh', { refresh_token: refreshToken });
  },

  /**
   * Revoke the current session on the backend, then clear local storage.
   * Always clears local state even if the network call fails.
   */
  logout: async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      try {
        await apiClient.post('/auth/logout', { refresh_token: refreshToken });
      } catch (_err) {
        // Best-effort: even if the network call fails, clear local state
      }
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },
};
