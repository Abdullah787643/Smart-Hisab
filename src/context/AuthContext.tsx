/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthUser, SavedAccount, AuthMode } from '../types/auth';
import { api } from '../services/api';

interface AuthContextType {
  currentUser: AuthUser | null;
  savedAccounts: SavedAccount[];
  activeAccount: SavedAccount | null;
  isLoadingAuth: boolean;
  isAuthModalOpen: boolean;
  authMode: AuthMode;

  openAuthModal: (mode?: AuthMode) => void;
  closeAuthModal: () => void;
  setAuthMode: (mode: AuthMode) => void;

  // Direct Authentication Operations
  register: (
    fullName: string,
    mobileNumber: string,
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  loginWithIdentifier: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  switchToAccount: (account: SavedAccount) => Promise<void>;
  removeAccountFromDevice: (id: string) => void;
  logoutCurrent: () => Promise<void>;
  logoutAll: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);

  // Modal and Form States
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  const refreshSavedAccounts = useCallback(() => {
    setSavedAccounts(api.getSavedAccounts());
  }, []);

  // Initialize session on startup
  useEffect(() => {
    const initSession = async () => {
      refreshSavedAccounts();
      const token = api.getToken();
      if (!token) {
        setIsLoadingAuth(false);
        return;
      }

      try {
        const res = await api.getMe();
        if (res.success && res.user) {
          setCurrentUser(res.user);
          api.saveAccount(res.user, token);
          refreshSavedAccounts();
        } else {
          setCurrentUser(null);
          api.setToken(null);
        }
      } catch (err) {
        console.warn('Session verification failed:', err);
        setCurrentUser(null);
        api.setToken(null);
      } finally {
        setIsLoadingAuth(false);
      }
    };

    initSession();
  }, [refreshSavedAccounts]);

  const activeAccount =
    savedAccounts.find((a) => a.id === currentUser?.id) ||
    (currentUser
      ? {
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          phone: currentUser.phone,
          avatarUrl: currentUser.avatarUrl,
          token: api.getToken() || '',
          lastActive: Date.now(),
        }
      : null);

  const openAuthModal = (mode: AuthMode = 'login') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  // 1. Direct Register without OTP
  const register = async (
    fullName: string,
    mobileNumber: string,
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await api.register({
        fullName,
        mobileNumber,
        email,
        password,
      });

      if (res.success && res.user && res.token) {
        setCurrentUser(res.user);
        api.saveAccount(res.user, res.token);
        refreshSavedAccounts();
        setIsAuthModalOpen(false);
        return { success: true };
      }
      return { success: false, error: 'Registration failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration failed' };
    }
  };

  // 2. Login with Mobile Number OR Gmail + Password
  const loginWithIdentifier = async (
    identifier: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await api.login(identifier, password);
      if (res.success && res.user && res.token) {
        setCurrentUser(res.user);
        api.saveAccount(res.user, res.token);
        refreshSavedAccounts();
        setIsAuthModalOpen(false);
        return { success: true };
      }
      return { success: false, error: 'Login failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed' };
    }
  };

  // 3. Update Password in Settings
  const updatePassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await api.changePassword(currentPassword, newPassword);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to change password' };
    }
  };

  // 4. Instant Switch to Another Remembered Account
  const switchToAccount = async (account: SavedAccount): Promise<void> => {
    api.setToken(account.token);
    try {
      const res = await api.getMe();
      if (res.success && res.user) {
        setCurrentUser(res.user);
        api.saveAccount(res.user, account.token);
        refreshSavedAccounts();
        setIsAuthModalOpen(false);
        return;
      }
    } catch (e) {
      console.warn('Account session expired, prompting login:', e);
    }

    // If session is expired, prompt password login with their identifier pre-filled
    setAuthMode('login');
    setIsAuthModalOpen(true);
  };

  // 5. Remove Account from Saved Device List
  const removeAccountFromDevice = (id: string) => {
    api.removeSavedAccount(id);
    refreshSavedAccounts();
    if (currentUser?.id === id) {
      const remaining = api.getSavedAccounts()[0];
      if (remaining) {
        switchToAccount(remaining);
      } else {
        setCurrentUser(null);
      }
    }
  };

  // 6. Logout Current Account
  const logoutCurrent = async () => {
    await api.logout();
    api.setToken(null);
    setCurrentUser(null);
    refreshSavedAccounts();
  };

  // 7. Logout All Accounts from this Device
  const logoutAll = async () => {
    await api.logoutAll();
    api.clearSavedAccounts();
    setCurrentUser(null);
    refreshSavedAccounts();
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        savedAccounts,
        activeAccount,
        isLoadingAuth,
        isAuthModalOpen,
        authMode,
        openAuthModal,
        closeAuthModal,
        setAuthMode,
        register,
        loginWithIdentifier,
        updatePassword,
        switchToAccount,
        removeAccountFromDevice,
        logoutCurrent,
        logoutAll,
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
