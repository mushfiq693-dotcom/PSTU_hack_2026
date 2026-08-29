import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserWithWallet } from '../types';
import { ApiService } from '../services/api';

interface AuthContextType {
  currentUser: UserWithWallet | null;
  allUsers: UserWithWallet[];
  isLoading: boolean;
  isAuthenticated: boolean;
  switchUser: (userId: string) => Promise<void>;
  refreshUserData: () => Promise<void>;
  resetDemoData: () => Promise<void>;
  logout: () => void;
  setAuthenticatedUser: (user: UserWithWallet) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserWithWallet | null>(null);
  const [allUsers, setAllUsers] = useState<UserWithWallet[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUserData = useCallback(async () => {
    try {
      const users = await ApiService.getUsers();
      setAllUsers(users);

      const savedToken = localStorage.getItem('fastpay_jwt_token');
      const savedUserId = localStorage.getItem('nexuspay_active_user_id');

      if (savedToken || savedUserId) {
        const active = users.find((u) => u.id === savedUserId) || users[0] || null;
        if (active) {
          setCurrentUser(active);
        }
      } else {
        setCurrentUser(null);
      }
    } catch (err) {
      console.error('Failed to load user session data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const switchUser = async (userId: string) => {
    setIsLoading(true);
    try {
      localStorage.setItem('nexuspay_active_user_id', userId);
      const userProfile = await ApiService.getMyWallet();
      setCurrentUser(userProfile);
      const users = await ApiService.getUsers();
      setAllUsers(users);
    } catch (err) {
      console.error('Failed to switch user:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const setAuthenticatedUser = (user: UserWithWallet) => {
    setCurrentUser(user);
    localStorage.setItem('nexuspay_active_user_id', user.id);
  };

  const logout = () => {
    localStorage.removeItem('fastpay_jwt_token');
    localStorage.removeItem('nexuspay_active_user_id');
    setCurrentUser(null);
  };

  const resetDemoData = async () => {
    setIsLoading(true);
    try {
      await ApiService.resetDemoData();
      await refreshUserData();
    } catch (err) {
      console.error('Failed to reset demo dataset:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUserData();
  }, [refreshUserData]);

  const isAuthenticated = currentUser !== null;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        allUsers,
        isLoading,
        isAuthenticated,
        switchUser,
        refreshUserData,
        resetDemoData,
        logout,
        setAuthenticatedUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
