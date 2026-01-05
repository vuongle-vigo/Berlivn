import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { fakeAuth, FakeUser } from '@/lib/fakeAuth';

interface AuthContextType {
  user: FakeUser | null;
  profile: FakeUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  remainingSearches: number;
  canSearch: boolean;
  incrementSearch: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'fake_auth_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FakeUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [remainingSearches, setRemainingSearches] = useState(0);

  useEffect(() => {
    const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setRemainingSearches(fakeAuth.getRemainingSearches(parsedUser.id));
      } catch (error) {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  const refreshProfile = async () => {
    if (user) {
      const users = fakeAuth.getUsers();
      const updatedUser = users.find(u => u.id === user.id);
      if (updatedUser) {
        setUser(updatedUser);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
        setRemainingSearches(fakeAuth.getRemainingSearches(updatedUser.id));
      }
    }
  };

  const signIn = async (email: string, password: string) => {
    const { user: loggedInUser, error } = await fakeAuth.login(email, password);

    if (error) {
      return { error };
    }

    if (loggedInUser) {
      setUser(loggedInUser);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(loggedInUser));
      setRemainingSearches(fakeAuth.getRemainingSearches(loggedInUser.id));
    }

    return { error: null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await fakeAuth.register(email, password, fullName);
    return { error };
  };

  const signOut = async () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setRemainingSearches(0);
  };

  const incrementSearch = async () => {
    if (!user) return;

    fakeAuth.incrementSearch(user.id);
    setRemainingSearches(fakeAuth.getRemainingSearches(user.id));
  };

  const isAdmin = user?.role === 'admin';
  const canSearch = user ? user.is_active && fakeAuth.canSearch(user.id) : false;

  const value = {
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
