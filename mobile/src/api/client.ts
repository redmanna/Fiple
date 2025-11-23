// API Client for Fiple Backend
import axios from 'axios';
import { Platform } from 'react-native';
import { getSecureItem, removeSecureItem, STORAGE_KEYS } from '../utils/secureStorage';

// API Base URL - configured via environment variables
const getApiUrl = () => {
  // Use environment variable if set
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Development fallbacks (only used if env var not set)
  if (__DEV__) {
    return Platform.select({
      ios: 'http://localhost:3000/api',
      android: 'http://10.0.2.2:3000/api', // Android emulator
      web: 'http://localhost:3000/api',
      default: 'http://localhost:3000/api',
    });
  }

  // Production fallback (should never be reached if properly configured)
  console.error('EXPO_PUBLIC_API_URL not configured! Using fallback.');
  return 'https://api.fiple.app';
};

const API_URL = getApiUrl();

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await getSecureItem(STORAGE_KEYS.AUTH_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Clear auth and redirect to login
      await removeSecureItem(STORAGE_KEYS.AUTH_TOKEN);
      await removeSecureItem(STORAGE_KEYS.USER);
      // You can trigger a navigation reset here
    }
    return Promise.reject(error);
  }
);

export default api;
