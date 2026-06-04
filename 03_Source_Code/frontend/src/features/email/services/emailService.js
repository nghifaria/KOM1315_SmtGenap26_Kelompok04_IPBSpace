import apiClient from '@/shared/services/api/apiClient';

/**
 * @typedef {Object} EmailRequest
 * @property {string} to_email - Recipient email address
 * @property {string} subject - Email subject line
 * @property {string} body - Email body content
 */

export const emailService = {
  /**
   * Send a test email
   * @param {EmailRequest} data 
   * @returns {Promise<any>}
   */
  testEmail: async (data) => {
    return await apiClient.post('/test/email', data);
  }
};
