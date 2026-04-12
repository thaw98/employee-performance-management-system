import axios from 'axios';
import { loadPersistedAuth } from '../features/auth/authStorage';

const baseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? '';

const axiosInstance = axios.create({
  baseURL: `${baseUrl}`,
});

axiosInstance.interceptors.request.use((config) => {
  const persisted = loadPersistedAuth();
  if (persisted?.token) {
    config.headers.Authorization = `Bearer ${persisted.token}`;
  }
  return config;
});

export default axiosInstance;
