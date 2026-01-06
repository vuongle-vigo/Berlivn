import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface User {
  id: string;
  email?: string;
  registration_number?: string;
}

interface Profile {
  id: string;
  email: string;
  registration_number?: string;
  full_name: string;
  role: 'admin' | 'user';
  is_active: boolean;
  searches_count: number;
  max_searches: number;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (registrationNumber: string, password: string) => Promise<{ error: any }>;
  signUp: (registrationNumber: string, email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  remainingSearches: number;
  canSearch: boolean;
  incrementSearch: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  const refreshProfile = async () => {
    // TODO: Implement
  };

  const signIn = async (registrationNumber: string, password: string) => {
    // TODO: Implement
    return { error: null };
  };

  const signUp = async (registrationNumber: string, email: string, password: string, fullName: string) => {
    // TODO: Implement
    return { error: null };
  };

  const signOut = async () => {
    setUser(null);
    setProfile(null);
  };

  const incrementSearch = async () => {
    // TODO: Implement
  };

  const isAdmin = profile?.role === 'admin';
  
  const remainingSearches = profile 
    ? Math.max(0, profile.max_searches - profile.searches_count) 
    : 0;

  const canSearch = profile 
    ? profile.is_active && (isAdmin || remainingSearches > 0) 
    : false;

  const value = {
    user,
    profile,
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
