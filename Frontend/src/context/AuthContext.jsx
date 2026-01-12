import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.user);
    } catch (error) {
      // ✅ 401 is expected when user is not logged in
      if (error.response?.status !== 401) {
        console.error('Auth check failed:', error.message);
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password) => {
    try {
      const res = await api.post('/auth/register', { name, email, password });
      setUser(res.data.user);
      return res.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      throw new Error(errorMessage);
    }
  };

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      setUser(res.data.user);
      return res.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      throw new Error(errorMessage);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // ✅ Always clear user and redirect
      setUser(null);
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout, api }}>
      {children}
    </AuthContext.Provider>
  );
};