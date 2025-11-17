import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { login as apiLogin, register as apiRegister, me as apiMe } from '../api/api';

// Thêm kiểu User (tùy chỉnh theo response BE nếu cần)
interface User {
  id: string;
  email: string;
  role?: string;
  is_active?: boolean;
  token?: string; // JWT hoặc token từ BE
}

interface AuthContextType {
  user: User | null;
  profile: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  remainingSearches: number;
  canSearch: boolean;
  incrementSearch: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'auth_user_v1';
const DEFAULT_SEARCHES = 5;

function getSearchKey(userId: string) {
  return `searches_${userId}`;
}

function getRemainingSearchesFromStorage(userId: string) {
  try {
    const v = localStorage.getItem(getSearchKey(userId));
    return v ? Number(v) : DEFAULT_SEARCHES;
  } catch {
    return DEFAULT_SEARCHES;
  }
}

function setRemainingSearchesToStorage(userId: string, val: number) {
  try {
    localStorage.setItem(getSearchKey(userId), String(val));
  } catch {}
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // loading while we validate stored token
  const [remainingSearches, setRemainingSearches] = useState(0);

  useEffect(() => {
    // On mount, try to restore and validate stored user/token
    (async () => {
      setLoading(true);
      try {
        const stored = localStorage.getItem(AUTH_STORAGE_KEY);
        if (!stored) {
          setLoading(false);
          return;
        }
        let parsed: User | null = null;
        try {
          parsed = JSON.parse(stored);
        } catch (e) {
          console.error('Invalid stored auth user, clearing storage', e);
          localStorage.removeItem(AUTH_STORAGE_KEY);
          setLoading(false);
          return;
        }

        if (parsed?.token) {
          // validate token with backend
          try {
            const res = await apiMe(parsed.token);
            if (!res.ok) {
              // invalid token -> clear
              console.warn('Stored token invalid, signing out');
              localStorage.removeItem(AUTH_STORAGE_KEY);
              setUser(null);
              setRemainingSearches(0);
              setLoading(false);
              return;
            }
            const data = res.data || {};
            const updatedUser: User = { ...parsed, ...data };
            setUser(updatedUser);
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
            setRemainingSearches(getRemainingSearchesFromStorage(updatedUser.id));
          } catch (err) {
            console.error('Error validating token on startup', err);
            // keep parsed user but be conservative: keep it for now
            setUser(parsed);
            setRemainingSearches(getRemainingSearchesFromStorage(parsed.id));
          }
        } else {
          setUser(parsed);
          setRemainingSearches(getRemainingSearchesFromStorage(parsed.id));
        }
      } catch (err) {
        console.error('Error restoring auth', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const refreshProfile = async () => {
    if (!user || !user.token) return;
    try {
      const res = await apiMe(user.token);
      if (!res.ok) {
        // token invalid -> sign out
        console.warn('Token invalid during refreshProfile, signing out');
        await signOut();
        return;
      }
      const data = res.data || {};
      const updatedUser: User = { ...user, ...data };
      setUser(updatedUser);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
      setRemainingSearches(getRemainingSearchesFromStorage(updatedUser.id));
    } catch (err) {
      console.error('refreshProfile error', err);
      // ignore network errors for now
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const res = await apiLogin(email, password);
      const data = res.data || {};
      if (!res.ok) {
        // normalize error to string
        const errMsg = (data && (data.error || data.message)) || 'Login failed';
        return { error: typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg) };
      }
      const loggedInUser: User = {
        ...(data.user || data),
        token: data.token || (data.user && data.user.token),
      };
      if (loggedInUser) {
        setUser(loggedInUser);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(loggedInUser));
        setRemainingSearches(getRemainingSearchesFromStorage(loggedInUser.id));
      }
      return { error: null };
    } catch (error) {
      console.error('signIn error', error);
      return { error: (error && (error as any).message) || String(error) };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const res = await apiRegister(email, password);
      const data = res.data || {};
      if (!res.ok) {
        const errMsg = (data && (data.error || data.message)) || 'Register failed';
        return { error: typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg) };
      }
      if (data.user || data.token) {
        const createdUser: User = {
          ...(data.user || {}),
          token: data.token || (data.user && data.user.token),
        };
        setUser(createdUser);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(createdUser));
        setRemainingSearches(getRemainingSearchesFromStorage(createdUser.id));
      }
      return { error: null };
    } catch (error) {
      console.error('signUp error', error);
      return { error: (error && (error as any).message) || String(error) };
    }
  };

  const signOut = async () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setRemainingSearches(0);
  };

  const incrementSearch = async () => {
    if (!user) return;
    const cur = getRemainingSearchesFromStorage(user.id);
    const next = Math.max(0, cur - 1);
    setRemainingSearchesToStorage(user.id, next);
    setRemainingSearches(next);
  };

  const isAdmin = user?.role === 'admin';
  const canSearch = user ? user.is_active !== false && remainingSearches > 0 : false;

  const value: AuthContextType = {
    user,
    profile: user,
    loading,
    signIn,
    signUp,
    signOut,
    isAdmin,
    remainingSearches,
    canSearch,
    incrementSearch,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
