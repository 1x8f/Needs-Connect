import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { login as loginAPI } from '../services/api';

interface User {
  id: number;
  username: string;
  role: 'helper' | 'manager';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string) => Promise<{ success: boolean; user?: User; message?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  isManager: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing auth on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('needs_connect_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (err) {
        console.error('Error parsing stored user:', err);
        localStorage.removeItem('needs_connect_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username: string) => {
    try {
      const response = await loginAPI(username);
      console.log('AuthContext - Login response:', response);
      
      if (response.success && response.user) {
        const userData: User = {
          id: response.user.id,
          username: response.user.username,
          role: response.user.role
        };
        
        console.log('AuthContext - Setting user:', userData);
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

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    isManager: user?.role === 'manager'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

