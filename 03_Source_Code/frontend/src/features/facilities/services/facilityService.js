import apiClient from '../../../shared/services/api/apiClient';

/**
 * @typedef {Object} Body_create_facility_facilities__post
 * @property {string} name - The name of the facility
 * @property {string} [description] - Description of the facility
 * @property {number} capacity - Maximum capacity of the facility
 * @property {string} [location] - Location details
 * @property {string} [type] - Type of facility (e.g., Room, Lab, Studio)
 * @property {boolean} [is_active=true] - Is the facility currently active/available
 */

export const facilityService = {
  /**
   * Get all facilities
   * @returns {Promise<any>}
   */
  getAllFacilities: async () => {
    return await apiClient.get('/facilities/');
  },

  /**
   * Get a facility by ID
   * @param {string|number} id 
   * @returns {Promise<any>}
   */
  getFacilityById: async (id) => {
    return await apiClient.get(`/facilities/${id}`);
  },

  /**
   * Create a new facility
   * @param {Body_create_facility_facilities__post} data 
   * @returns {Promise<any>}
   */
  createFacility: async (data) => {
    if (data instanceof FormData) {
      return await apiClient.post('/facilities/', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return await apiClient.post('/facilities/', data);
  },

  /**
   * Update an existing facility
   * @param {string|number} id 
   * @param {Partial<Body_create_facility_facilities__post>} data 
   * @returns {Promise<any>}
   */
  updateFacility: async (id, data) => {
    // Backend endpoints expect form fields (Form/UploadFile). Send as FormData.
    if (data instanceof FormData) {
      return await apiClient.put(`/facilities/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }

    const form = new FormData();
    Object.entries(data || {}).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
      if (Array.isArray(v)) {
        form.append(k, JSON.stringify(v));
      } else {
        form.append(k, String(v));
      }
    });

    return await apiClient.put(`/facilities/${id}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /**
   * Delete a facility
   * @param {string|number} id 
   * @returns {Promise<any>}
   */
  deleteFacility: async (id) => {
    return await apiClient.delete(`/facilities/${id}`);
  }
};
