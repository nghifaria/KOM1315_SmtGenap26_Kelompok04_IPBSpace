import apiClient from '@/shared/services/api/apiClient';

/**
 * @typedef {Object} ItemCreate
 * @property {string} name - Name of the item
 * @property {string} [description] - Description of the item
 * @property {boolean} [is_available=true] - Availability status
 */

/**
 * @typedef {Object} ExtraItemCreate
 * @property {string} name - Name of the extra item
 * @property {number} max_quantity - Maximum quantity available
 */

export const itemService = {
  /**
   * Get all regular items
   * @returns {Promise<any>}
   */
  getAllItems: async () => {
    return await apiClient.get('/items/');
  },

  /**
   * Create a new regular item
   * @param {ItemCreate} data 
   * @returns {Promise<any>}
   */
  createItem: async (data) => {
    return await apiClient.post('/items/', data);
  },

  /**
   * Get a specific regular item by ID
   * @param {string|number} id 
   * @returns {Promise<any>}
   */
  getItemById: async (id) => {
    return await apiClient.get(`/items/${id}`);
  },

  /**
   * Update a regular item
   * @param {string|number} id 
   * @param {Partial<ItemCreate>} data 
   * @returns {Promise<any>}
   */
  updateItem: async (id, data) => {
    return await apiClient.put(`/items/${id}`, data);
  },

  /**
   * Delete a regular item
   * @param {string|number} id 
   * @returns {Promise<any>}
   */
  deleteItem: async (id) => {
    return await apiClient.delete(`/items/${id}`);
  },

  /**
   * Get all extra items
   * @returns {Promise<any>}
   */
  getAllExtraItems: async (params = {}) => {
    return await apiClient.get('/items/extra/all', { params });
  },

  /**
   * Create an extra item
   * @param {ExtraItemCreate} data 
   * @returns {Promise<any>}
   */
  createExtraItem: async (data) => {
    return await apiClient.post('/items/extra/', data);
  },

  /**
   * Delete an extra item
   * @param {string|number} id 
   * @returns {Promise<any>}
   */
  deleteExtraItem: async (id) => {
    return await apiClient.delete(`/items/extra/${id}`);
  }
};
