import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AccountSetupDTO, CurrencyCode, Language, LoginBody, RegisterBody, UserPublicDTO } from '@immo/shared-types';
import { authApi, getApiErrorMessage, refreshAccessToken, setUnauthorizedHandler } from '../lib/api';
import { clearTokens, getRefreshToken, setTokens } from '../lib/tokenStore';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  status: AuthStatus;
  user: UserPublicDTO | null;
  isAuthenticated: boolean;
  login: (body: LoginBody) => Promise<UserPublicDTO>;
  register: (body: RegisterBody & { confirmPassword?: string }) => Promise<UserPublicDTO>;
  getSetupAccount: (token: string) => Promise<AccountSetupDTO>;
  activateAccount: (token: string, password: string) => Promise<UserPublicDTO>;
  googleLogin: (accessToken: string, role?: string) => Promise<UserPublicDTO>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  updateUser: (partial: Partial<UserPublicDTO>) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<UserPublicDTO | null>(null);

  const applyUser = useCallback((u: UserPublicDTO | null) => {
    setUser(u);
    setStatus(u ? 'authenticated' : 'unauthenticated');
  }, []);

  const handleResult = useCallback(
    (result: { user: UserPublicDTO; accessToken: string; refreshToken: string }) => {
      setTokens(result.accessToken, result.refreshToken);
      applyUser(result.user);
      return result.user;
    },
    [applyUser],
  );

  const login = useCallback(
    async (body: LoginBody): Promise<UserPublicDTO> => {
      const result = await authApi.login(body);
      return handleResult(result);
    },
    [handleResult],
  );

  const register = useCallback(
    async (body: RegisterBody & { confirmPassword?: string }): Promise<UserPublicDTO> => {
      const result = await authApi.register(body);
      return handleResult(result);
    },
    [handleResult],
  );

  const getSetupAccount = useCallback(
    async (token: string): Promise<AccountSetupDTO> => authApi.getSetupAccount(token),
    [],
  );

  const activateAccount = useCallback(
    async (token: string, password: string): Promise<UserPublicDTO> => {
      const result = await authApi.activateAccount(token, password);
      return handleResult(result);
    },
    [handleResult],
  );

  const googleLogin = useCallback(
    async (accessToken: string, role?: string): Promise<UserPublicDTO> => {
      const result = await authApi.googleLogin(accessToken, role);
      return handleResult(result);
    },
    [handleResult],
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      await authApi.logout(localStorage.getItem('immo_refresh_token'));
    } catch {
      /* proceed with local logout even if the server call fails */
    } finally {
      clearTokens();
      applyUser(null);
      setStatus('unauthenticated');
    }
  }, [applyUser]);

  const refresh = useCallback(async (): Promise<void> => {
    if (!getRefreshToken()) {
      clearTokens();
      applyUser(null);
      return;
    }
    try {
      const accessToken = await refreshAccessToken();
      if (!accessToken) throw new Error('Refresh failed');
      const me = await authApi.me();
      applyUser(me);
    } catch {
      clearTokens();
      applyUser(null);
    }
  }, [applyUser]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      applyUser(null);
    });
  }, [applyUser]);

  const updateUser = useCallback((partial: Partial<UserPublicDTO>): void => {
    setUser((prev) => (prev ? { ...prev, ...partial } : prev));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      isAuthenticated: status === 'authenticated',
      login,
      register,
      getSetupAccount,
      activateAccount,
      googleLogin,
      logout,
      refresh,
      updateUser,
    }),
    [status, user, login, register, getSetupAccount, activateAccount, googleLogin, logout, refresh, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

export { getApiErrorMessage };