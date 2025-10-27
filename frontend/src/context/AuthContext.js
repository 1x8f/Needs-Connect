import React, { createContext, useState, useContext, useEffect } from 'react';
import { login as loginAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing auth on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('needs_connect_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error('Error parsing stored user:', err);
        localStorage.removeItem('needs_connect_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username) => {
    try {
      const response = await loginAPI(username);
      
      if (response.success) {
        const userData = {
          id: response.user.id,
          username: response.user.username,
          role: response.user.role
        };
        
        setUser(userData);
        localStorage.setItem('needs_connect_user', JSON.stringify(userData));
        
        return { success: true, user: userData };
      } else {
        return { success: false, message: response.message || 'Login failed' };
      }
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, message: 'Error connecting to server' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('needs_connect_user');
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    isManager: user?.role === 'manager'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

