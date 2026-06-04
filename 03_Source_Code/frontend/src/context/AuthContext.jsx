import { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../shared/services/api/apiClient';
import { authService } from '../features/auth/services/authService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // -- Rehydrate session on mount ----------------------------------
  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem('access_token');

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await apiClient.get('/users/me');
        if (response?.success && response?.data?.user) {
          setUser(response.data.user);
          localStorage.setItem('user', JSON.stringify(response.data.user));
          setIsAuthenticated(true);
        } else {
          // Fall back to cached user data if the shape was unexpected
          const cachedUser = localStorage.getItem('user');
          if (cachedUser) {
            setUser(JSON.parse(cachedUser));
            setIsAuthenticated(true);
          } else {
            throw new Error('Invalid session response');
          }
        }
      } catch (error) {
        const status = error?.response?.status;
        if (status === 401 || status === 403) {
          // Token invalid / expired and refresh failed → clear everything
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          setUser(null);
          setIsAuthenticated(false);
        } else {
          // Network error etc — use cached user so the app stays usable offline
          const cachedUser = localStorage.getItem('user');
          if (cachedUser) {
            try {
              setUser(JSON.parse(cachedUser));
              setIsAuthenticated(true);
            } catch (_e) {
              // Corrupted cache — ignore
            }
          }
        }
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  // -- Actions ------------------------------------------------

  /**
   * Authenticate the user and store session data.
   * @param {string} email
   * @param {string} password
   * @returns {Object} user object
   */
  const login = async (email, password) => {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      if (response?.success) {
        const { user: userData, token } = response.data;
        localStorage.setItem('access_token', token.access_token);
        localStorage.setItem('refresh_token', token.refresh_token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        setIsAuthenticated(true);
        return userData;
      }
      throw new Error('Login gagal');
    } catch (error) {
      // Pastikan state tetap bersih kalau gagal
      setUser(null);
      setIsAuthenticated(false);
      throw error; // re-throw supaya LoginForm bisa handle toast-nya
    }
  };

  /**
   * Register a new Civitas account.
   */
  const register = async (userData) => {
    return await authService.register(userData);
  };

  /**
   * Revoke the session on the backend, then clear local state.
   * Always redirects to /login regardless of network outcome.
   */
  const logout = async () => {
    try {
      await authService.logout(); // hits POST /auth/logout
    } catch (_err) {
      // Best-effort — clear local state no matter what
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      window.location.href = '/login';
    }
  };

  /**
   * Update the authenticated user's profile.
   */
  const updateProfile = async (fullname, idnum, email) => {
    const response = await apiClient.put('/users/me', { fullname, idnum, email });
    if (response?.success) {
      const updatedUser = response.data.user;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      return updatedUser;
    }
    throw new Error('Gagal memperbarui profil');
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, login, register, logout, loading, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
};
