import apiClient from '../../../shared/services/api/apiClient';

/**
 * @typedef {Object} UserProfile
 * @property {string|number} id - User ID
 * @property {string} email - User email
 * @property {string} full_name - User full name
 * @property {string} role - User role (civitas, facility_admin, super_admin)
 */

export const userService = {
  /**
   * Get the current authenticated user's profile
   * @returns {Promise<any>}
   */
  getCurrentUser: async () => {
    return await apiClient.get('/users/me');
  },

  /**
   * Get all users
   * @returns {Promise<any>}
   */
  getAllUsers: async () => {
    return await apiClient.get('/users/');
  },

  /**
   * Get a specific user by ID
   * @param {string|number} id 
   * @returns {Promise<any>}
   */
  getUserById: async (id) => {
    return await apiClient.get(`/users/${id}`);
  },

  /**
   * Get all facility managers
   * @param {number} skip 
   * @param {number} limit 
   * @returns {Promise<any>}
   */
  getAllManagers: async (skip = 0, limit = 100) => {
    return await apiClient.get(`/users/managers?skip=${skip}&limit=${limit}`);
  },

  /**
   * Create a new facility manager
   * @param {Object} data 
   * @returns {Promise<any>}
   */
  createManager: async (data) => {
    return await apiClient.post('/users/managers', data);
  },

  /**
   * Update an existing facility manager
   * @param {number} id 
   * @param {Object} data 
   * @returns {Promise<any>}
   */
  updateManager: async (id, data) => {
    return await apiClient.put(`/users/managers/${id}`, data);
  },

  /**
   * Delete a facility manager
   * @param {number} id 
   * @returns {Promise<any>}
   */
  deleteManager: async (id) => {
    return await apiClient.delete(`/users/managers/${id}`);
  }
};
