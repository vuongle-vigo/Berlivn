import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'user';
  daily_search_limit: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SearchLog {
  id: string;
  user_id: string;
  search_date: string;
  search_count: number;
  created_at: string;
  updated_at: string;
}
