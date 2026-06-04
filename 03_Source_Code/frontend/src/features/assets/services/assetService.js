import apiClient from '@/shared/services/api/apiClient';

/**
 * @typedef {Object} AssetCreate
 * @property {string} name - Name of the asset
 * @property {string} [description] - Description of the asset
 * @property {number} [quantity=1] - Quantity available
 */

export const assetService = {
  /**
   * Get all assets
   * @returns {Promise<any>}
   */
  getAllAssets: async () => {
    return await apiClient.get('/assets/');
  },

  /**
   * Create a new asset
   * @param {AssetCreate} data 
   * @returns {Promise<any>}
   */
  createAsset: async (data) => {
    return await apiClient.post('/assets/', data);
  },

  /**
   * Get a specific asset by ID
   * @param {string|number} id 
   * @returns {Promise<any>}
   */
  getAssetById: async (id) => {
    return await apiClient.get(`/assets/${id}`);
  },

  /**
   * Update an existing asset
   * @param {string|number} id 
   * @param {Partial<AssetCreate>} data 
   * @returns {Promise<any>}
   */
  updateAsset: async (id, data) => {
    return await apiClient.put(`/assets/${id}`, data);
  },

  /**
   * Delete an asset
   * @param {string|number} id 
   * @returns {Promise<any>}
   */
  deleteAsset: async (id) => {
    return await apiClient.delete(`/assets/${id}`);
  }
};
