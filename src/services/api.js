import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Config } from '../config/config';

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
  (error) => {
    if (__DEV__) {
      console.log('API Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        data: error.response?.data,
      });
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
