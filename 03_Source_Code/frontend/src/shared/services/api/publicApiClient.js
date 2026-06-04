import axios from 'axios';

const publicApiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

publicApiClient.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(error)
);

export default publicApiClient;
