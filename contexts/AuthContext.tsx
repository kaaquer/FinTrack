import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService, User as ApiUser } from '../services/api';

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'user' | 'accountant';
  businessId: number;
  businessName: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: { email: string; password: string; firstName: string; lastName: string; businessName: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user data on app start
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: { email: string; password: string }): Promise<void> => {
    try {
      setLoading(true);
      console.log('Attempting login with:', credentials.email);
      
      const response = await apiService.login(credentials);
      console.log('Login response received:', response);
      
      // Store user data and token
      await AsyncStorage.setItem('user', JSON.stringify(response.user));
      await AsyncStorage.setItem('authToken', response.token);
      
      setUser(response.user);
      console.log('Login successful for user:', response.user.email);
    } catch (error) {
      console.error('Login error:', error);
      throw error; // Re-throw to let LoginScreen handle the error
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      console.log('Logging out user:', user?.email);
      
      // Call API logout if user is logged in
      if (user) {
        await apiService.logout();
      }
      
      // Clear stored data
      await AsyncStorage.multiRemove(['user', 'authToken']);
      setUser(null);
      console.log('Logout successful');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if API logout fails, clear local data
      await AsyncStorage.multiRemove(['user', 'authToken']);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: { email: string; password: string; firstName: string; lastName: string; businessName: string }): Promise<void> => {
    try {
      setLoading(true);
      console.log('Attempting registration for:', userData.email);
      
      const response = await apiService.register(userData);
      console.log('Registration response received:', response);
      
      // Store user data and token
      await AsyncStorage.setItem('user', JSON.stringify(response.user));
      await AsyncStorage.setItem('authToken', response.token);
      
      setUser(response.user);
      console.log('Registration successful for user:', response.user.email);
    } catch (error) {
      console.error('Registration error:', error);
      throw error; // Re-throw to let SignUp screen handle the error
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    register,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};