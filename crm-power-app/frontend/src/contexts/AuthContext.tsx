import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig } from '../services/authConfig';

interface User {
  id: string;
  displayName: string;
  email: string;
  role: 'Admin' | 'Agent' | 'Customer';
  jobTitle?: string;
  department?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [msalInstance] = useState(() => new PublicClientApplication(msalConfig));

  useEffect(() => {
    // Check for existing session on app load
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const storedToken = localStorage.getItem('crm-token');
      const storedUser = localStorage.getItem('crm-user');

      if (storedToken && storedUser) {
        // Validate token with backend
        try {
          const response = await fetch('/api/auth/profile', {
            headers: {
              'Authorization': `Bearer ${storedToken}`
            }
          });

          if (response.ok) {
            const userData = await response.json();
            setUser({
              id: userData.data.id,
              displayName: userData.data.displayName,
              email: userData.data.email,
              role: storedUser ? JSON.parse(storedUser).role : 'Customer',
              jobTitle: userData.data.jobTitle,
              department: userData.data.department
            });
            setToken(storedToken);
          } else {
            // Token invalid, clear storage
            localStorage.removeItem('crm-token');
            localStorage.removeItem('crm-user');
          }
        } catch (error) {
          console.error('Token validation failed:', error);
          localStorage.removeItem('crm-token');
          localStorage.removeItem('crm-user');
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async () => {
    try {
      // Get Microsoft OAuth URL
      const response = await fetch('/api/auth/microsoft/url');
      const data = await response.json();

      if (data.success) {
        // Redirect to Microsoft for authentication
        window.location.href = data.data.authUrl;
      } else {
        throw new Error('Failed to get authentication URL');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const handleAuthCallback = async (code: string) => {
    try {
      const response = await fetch('/api/auth/microsoft/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (data.success) {
        const { token: newToken, user: userData } = data.data;

        setToken(newToken);
        setUser(userData);

        // Store in localStorage
        localStorage.setItem('crm-token', newToken);
        localStorage.setItem('crm-user', JSON.stringify({
          id: userData.id,
          displayName: userData.displayName,
          email: userData.email,
          role: userData.role
        }));

        return userData;
      } else {
        throw new Error(data.error || 'Authentication failed');
      }
    } catch (error) {
      console.error('Auth callback error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local state regardless of API call success
      setUser(null);
      setToken(null);
      localStorage.removeItem('crm-token');
      localStorage.removeItem('crm-user');
    }
  };

  const refreshToken = async () => {
    try {
      if (!token) return;

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (data.success) {
        const { token: newToken, user: userData } = data.data;

        setToken(newToken);
        setUser(userData);

        // Update localStorage
        localStorage.setItem('crm-token', newToken);
        localStorage.setItem('crm-user', JSON.stringify({
          id: userData.id,
          displayName: userData.displayName,
          email: userData.email,
          role: userData.role
        }));
      } else {
        // Refresh failed, logout
        await logout();
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      await logout();
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    logout,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;