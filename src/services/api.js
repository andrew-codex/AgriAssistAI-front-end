import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Config } from '../config/config';
import { emitAuthExpired } from '../utils/authEvents';

const api = axios.create({
  baseURL: Config.API_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});


api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (__DEV__) {
      console.log('API Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        data: error.response?.data,
      });
    }

    // Handle 401 token expiration — clear stored token and signal logout
    if (error.response?.status === 401) {
      try {
        await SecureStore.deleteItemAsync('token');
        await SecureStore.deleteItemAsync('user');
      } catch (e) {
        // Ignore SecureStore cleanup errors
      }
      emitAuthExpired();
    }

    return Promise.reject(error);
  }
);


export const forgotPasswordRequest = (email) => 
  api.post('/password/otp/request', { email });

export const resetPasswordRequest = (email, otp, password, password_confirmation) =>
  api.post('/password/otp/reset', { 
    email, 
    otp, 
    password, 
    password_confirmation 
  });
export default api;
