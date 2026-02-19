import React, { createContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { loginRequest, registerRequest } from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rateLimit, setRateLimit] = useState({
    limit: 5,
    remaining: null,
    resetsIn: null,
    lastUpdated: null
  });


  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      console.log('Checking auth...');
      const storedToken = await SecureStore.getItemAsync('token');
      const storedUser = await SecureStore.getItemAsync('user');

      console.log('Stored token:', storedToken ? 'exists' : 'none');
      console.log('Stored user:', storedUser ? 'exists' : 'none');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        console.log('Auth restored');
      } else {
        console.log('No stored auth');
      }
    } catch (error) {
      console.log('Error checking auth:', error);
    } finally {
      setLoading(false);
      console.log('Auth check complete');
    }
  };

  const login = async (email, password, userType) => {
    const res = await loginRequest({ email, password, userType });

    await SecureStore.setItemAsync('token', res.data.token);
    await SecureStore.setItemAsync('user', JSON.stringify(res.data.user));

    setToken(res.data.token);
    setUser(res.data.user);
  };

  const register = async (data) => {
    const res = await registerRequest(data);

    await SecureStore.setItemAsync('token', res.data.token);
    await SecureStore.setItemAsync('user', JSON.stringify(res.data.user));

    setToken(res.data.token);
    setUser(res.data.user);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('user');
    setUser(null);
    setToken(null);
  
    setRateLimit({
      limit: 5,
      remaining: null,
      resetsIn: null,
      lastUpdated: null
    });
  };

  const updateRateLimit = (rateLimitData) => {
    setRateLimit({
      limit: rateLimitData.limit || 5,
      remaining: rateLimitData.remaining,
      resetsIn: rateLimitData.resets_in_seconds || rateLimitData.retry_after_seconds,
      lastUpdated: Date.now()
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, rateLimit, updateRateLimit }}>
      {children}
    </AuthContext.Provider>
  );
};
