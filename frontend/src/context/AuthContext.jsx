import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
} from 'react';

import { authApi } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const normalizeUser = useCallback((userData) => (
    userData?.role === 'processor' ? { ...userData, role: 'buyer' } : userData
  ), []);
  const [user, setUser] = useState(null);

  const [token, setToken] = useState(() => {
    return localStorage.getItem('m2m_token') || null;
  });

  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('m2m_token');
    localStorage.removeItem('m2m_user');

    setToken(null);
    setUser(null);
  }, []);

  const login = useCallback((userData, userToken) => {
    // Token hamesha string hona chahiye
    const cleanToken =
      typeof userToken === 'string'
        ? userToken
        : userToken?.access_token || userToken?.token || null;

    if (!cleanToken) {
      console.error('Login failed: token missing', userToken);
      return;
    }

    localStorage.setItem('m2m_token', cleanToken);
    const normalizedUser = normalizeUser(userData);
    localStorage.setItem('m2m_user', JSON.stringify(normalizedUser));

    setToken(cleanToken);
    setUser(normalizedUser);
  }, [normalizeUser]);

  const updateUser = useCallback((userData) => {
    localStorage.setItem('m2m_user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const verifyToken = async () => {
      if (!token || typeof token !== 'string') {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      try {
        const response = await authApi.me();

        if (isMounted) {
          // /me returns the user as its data payload, while login responses
          // wrap it in a `user` property.
          setUser(normalizeUser(response.user || response));
        }
      } catch (error) {
        console.error(
          'Token verification failed:',
          error.response?.data || error.message
        );

        if (isMounted) {
          logout();
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    verifyToken();

    return () => {
      isMounted = false;
    };
  }, [token, logout, normalizeUser]);

  const isAuthenticated = Boolean(token && user);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        updateUser,
        logout,
        isAuthenticated,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};