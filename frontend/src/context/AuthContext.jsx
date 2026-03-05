import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/services';

const AuthContext = createContext(null);
const TOKEN_KEY = 'poker_trainer_token';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);

    authApi
      .me(token)
      .then((response) => {
        if (mounted) {
          setUser(response);
        }
      })
      .catch(() => {
        if (mounted) {
          setToken('');
          localStorage.removeItem(TOKEN_KEY);
          setUser(null);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [token]);

  const login = useCallback(async (identifier, password) => {
    const response = await authApi.login({ identifier, password });
    setToken(response.token);
    localStorage.setItem(TOKEN_KEY, response.token);
    setUser(response.user);
  }, []);

  const register = useCallback(async (username, email, password) => {
    const response = await authApi.register({ username, email, password });
    setToken(response.token);
    localStorage.setItem(TOKEN_KEY, response.token);
    setUser(response.user);
  }, []);

  const enterDemo = useCallback(async (nameHint) => {
    const response = await authApi.loginDemo(nameHint);
    setToken(response.token);
    localStorage.setItem(TOKEN_KEY, response.token);
    setUser(response.user);
  }, []);

  const logout = useCallback(() => {
    setToken('');
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
  }, []);

  const refreshMe = useCallback(async () => {
    if (!token) {
      return;
    }
    const response = await authApi.me(token);
    setUser(response);
  }, [token]);

  const value = useMemo(
    () => ({ token, user, loading, login, register, enterDemo, logout, refreshMe }),
    [token, user, loading, login, register, enterDemo, logout, refreshMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
