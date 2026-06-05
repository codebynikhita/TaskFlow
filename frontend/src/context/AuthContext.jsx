import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem('accessToken'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Verifies user session on startup or token changes
  const verifySession = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        const response = await api.get('/auth/me');
        setUser(response.data.data.user);
      } else {
        // No local access token, try refreshing session via httpOnly cookies
        const refreshResponse = await api.post('/auth/refresh');
        const newToken = refreshResponse.data.data.accessToken;
        localStorage.setItem('accessToken', newToken);
        setAccessToken(newToken);
        const meResponse = await api.get('/auth/me');
        setUser(meResponse.data.data.user);
      }
    } catch (err) {
      // Session expired or no cookies
      setUser(null);
      localStorage.removeItem('accessToken');
      setAccessToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    verifySession();

    // Listen for session expiry events triggered by Axios interceptor
    const handleExpired = () => {
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem('accessToken');
    };

    window.addEventListener('auth_session_expired', handleExpired);
    return () => {
      window.removeEventListener('auth_session_expired', handleExpired);
    };
  }, []);

  const loginUser = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { accessToken: token, user: userData } = response.data.data;

      localStorage.setItem('accessToken', token);
      setAccessToken(token);
      setUser(userData);
      return userData;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Login failed';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const registerUser = async (name, email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/register', { name, email, password });
      const { accessToken: token, user: userData } = response.data.data;

      localStorage.setItem('accessToken', token);
      setAccessToken(token);
      setUser(userData);
      return userData;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Registration failed';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const logoutUser = async () => {
    setLoading(true);
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout error on backend:', err);
    } finally {
      localStorage.removeItem('accessToken');
      setAccessToken(null);
      setUser(null);
      setLoading(false);
    }
  };

  const updateAvatar = async (base64Image) => {
    try {
      const response = await api.post('/auth/avatar', { image: base64Image });
      const newAvatarUrl = response.data.data.avatar;
      setUser(prev => prev ? { ...prev, avatar: newAvatarUrl } : null);
      return newAvatarUrl;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to upload avatar';
      throw new Error(errMsg);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        loading,
        error,
        loginUser,
        registerUser,
        logoutUser,
        updateAvatar,
        verifySession
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
