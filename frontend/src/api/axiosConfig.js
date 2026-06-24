import axios from 'axios';
import { storage } from '../utils/storage';
import { updateToken, logout } from '../redux/slices/authSlice';

// Use LAN IP address for testing on physical devices
// PC WiFi IP: 192.168.32.104 (update this if IP changes)
const API_BASE_URL = 'http://192.168.32.104:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Inject JWT token
api.interceptors.request.use(
  async (config) => {
    const token = await storage.getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Auto-retry on 401 with Refresh Token
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Avoid infinite loop and check for 401
    const isAuthRoute = originalRequest.url.includes('/auth/login-password') || 
                        originalRequest.url.includes('/auth/verify-otp') ||
                        originalRequest.url.includes('/auth/send-otp');

    if (error.response && error.response.status === 401 && !originalRequest._retry && !isAuthRoute) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await storage.getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token found');
        }

        // Call silent refresh endpoint
        const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
          refreshToken,
        });

        const { token: newAccessToken, refreshToken: newRefreshToken } = response.data;

        // Save tokens
        await storage.saveToken(newAccessToken);
        if (newRefreshToken) {
          await storage.saveRefreshToken(newRefreshToken);
        }

        // Update Redux
        const { store } = require('../redux/store');
        store.dispatch(
          updateToken({
            token: newAccessToken,
            refreshToken: newRefreshToken,
          })
        );

        processQueue(null, newAccessToken);
        originalRequest.headers['Authorization'] = 'Bearer ' + newAccessToken;
        
        isRefreshing = false;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        
        // Refresh token failed, force logout
        const { store } = require('../redux/store');
        store.dispatch(logout());
        await storage.clearAll();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
