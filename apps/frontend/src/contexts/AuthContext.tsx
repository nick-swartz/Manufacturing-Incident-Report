import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@incident-system/shared';
import * as authApi from '../api/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, jiraApiToken: string) => Promise<void>;
  logout: () => void;
  setUserFromResponse?: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in on mount
    const token = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('auth_user');

    if (token && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Failed to parse saved user', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    }

    setIsLoading(false);
  }, []);

  const login = async (email: string, jiraApiToken: string) => {
    try {
      const response = await authApi.login(email, jiraApiToken);

      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('auth_user', JSON.stringify(response.user));

      setUser(response.user);
    } catch (error: any) {
      console.error('Login failed', error);
      throw error;
    }
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
  };

  const setUserFromResponse = (userData: User) => {
    setUser(userData);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        setUserFromResponse
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
