import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('cloudvault_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('cloudvault_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('cloudvault_token');
      if (storedToken) {
        try {
          const userData = await authApi.getMe();
          setUser(userData);
          localStorage.setItem('cloudvault_user', JSON.stringify(userData));
        } catch {
          // Token is invalid/expired
          localStorage.removeItem('cloudvault_token');
          localStorage.removeItem('cloudvault_user');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const data = await authApi.login(email, password);
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem('cloudvault_token', data.access_token);
    localStorage.setItem('cloudvault_user', JSON.stringify(data.user));
    return data;
  };

  const register = async (fullName, email, password) => {
    const data = await authApi.register(fullName, email, password);
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem('cloudvault_token', data.access_token);
    localStorage.setItem('cloudvault_user', JSON.stringify(data.user));
    return data;
  };

  const logout = async () => {
    await authApi.logout();
    setToken(null);
    setUser(null);
    localStorage.removeItem('cloudvault_token');
    localStorage.removeItem('cloudvault_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
