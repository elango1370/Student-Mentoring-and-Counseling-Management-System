import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/endpoints.js';
import { clearStoredToken, getStoredToken, registerUnauthorizedHandler, setStoredToken } from '../api/client.js';
import { useToast } from './ToastContext.jsx';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [initialising, setInitialising] = useState(true);
  const toast = useToast();

  const signOutLocal = useCallback(() => {
    clearStoredToken();
    setUser(null);
  }, []);

  useEffect(() => {
    registerUnauthorizedHandler(() => {
      if (getStoredToken()) {
        signOutLocal();
        toast.error('Your session has expired. Please log in again.');
      }
    });
  }, [signOutLocal, toast]);

  useEffect(() => {
    const bootstrap = async () => {
      if (!getStoredToken()) {
        setInitialising(false);
        return;
      }
      try {
        const res = await authApi.me();
        setUser(res.user);
      } catch {
        clearStoredToken();
        setUser(null);
      } finally {
        setInitialising(false);
      }
    };
    bootstrap();
  }, []);

  const login = useCallback(async (credentials) => {
    const res = await authApi.login(credentials);
    setStoredToken(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  // Self-registered student accounts require email verification before they
  // can sign in, so — like faculty registration — this never returns a
  // token and never sets a logged-in user.
  const register = useCallback(async (payload) => {
    const res = await authApi.register(payload);
    return res;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // The local session is cleared regardless of the network result.
    }
    signOutLocal();
  }, [signOutLocal]);

  // Invalidates every JWT ever issued for this account (including the
  // current one) on the backend, then clears the local session so the user
  // is dropped back to the login screen.
  const logoutAllDevices = useCallback(async () => {
    try {
      await authApi.logoutAll();
    } finally {
      signOutLocal();
    }
  }, [signOutLocal]);

  const forgotPassword = useCallback((email) => authApi.forgotPassword({ email }), []);
  const resetPassword = useCallback((payload) => authApi.resetPassword(payload), []);
  const verifyEmail = useCallback((token) => authApi.verifyEmail({ token }), []);
  const resendVerification = useCallback((email) => authApi.resendVerification({ email }), []);

  const updateUser = useCallback((partial) => {
    setUser((prev) => (prev ? { ...prev, ...partial } : prev));
  }, []);

  const value = useMemo(
    () => ({
      user,
      role: user?.role || null,
      isAuthenticated: Boolean(user),
      initialising,
      login,
      register,
      logout,
      logoutAllDevices,
      forgotPassword,
      resetPassword,
      verifyEmail,
      resendVerification,
      updateUser,
    }),
    [
      user, initialising, login, register, logout, logoutAllDevices,
      forgotPassword, resetPassword, verifyEmail, resendVerification, updateUser,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
