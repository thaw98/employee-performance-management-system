// frontend/src/app/axiosInstance.ts

import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor - Add token to headers
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('epms_token') || sessionStorage.getItem('epms_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle 401 unauthorized
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth data
      localStorage.removeItem('epms_token');
      localStorage.removeItem('epms_user');
      sessionStorage.removeItem('epms_token');
      sessionStorage.removeItem('epms_user');

      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;