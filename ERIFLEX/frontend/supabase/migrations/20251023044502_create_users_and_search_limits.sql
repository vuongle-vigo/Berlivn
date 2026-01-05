/*
  # Create Users and Search Limits Schema

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text, unique)
      - `full_name` (text)
      - `role` (text, either 'admin' or 'user')
      - `daily_search_limit` (integer, default 10)
      - `is_active` (boolean, default true)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `search_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `search_date` (date)
      - `search_count` (integer, default 0)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Policies for users to read own data
    - Policies for admins to manage all users
    - Policies for search logs

  3. Functions
    - Function to check daily search limit
    - Function to increment search count
    - Trigger to create user profile on auth signup
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  daily_search_limit integer NOT NULL DEFAULT 10,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create search_logs table
CREATE TABLE IF NOT EXISTS search_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  search_date date NOT NULL DEFAULT CURRENT_DATE,
  search_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, search_date)
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_logs ENABLE ROW LEVEL SECURITY;

-- Policies for user_profiles
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can insert users"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all users"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete users"
  ON user_profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policies for search_logs
CREATE POLICY "Users can view own search logs"
  ON search_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all search logs"
  ON search_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can insert own search logs"
  ON search_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own search logs"
  ON search_logs FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Function to check if user can search
CREATE OR REPLACE FUNCTION can_user_search(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_limit integer;
  v_count integer;
  v_is_active boolean;
BEGIN
  -- Get user limit and active status
  SELECT daily_search_limit, is_active
  INTO v_limit, v_is_active
  FROM user_profiles
  WHERE id = p_user_id;

  -- Check if user is active
  IF NOT v_is_active THEN
    RETURN false;
  END IF;

  -- Get today's search count
  SELECT COALESCE(search_count, 0)
  INTO v_count
  FROM search_logs
  WHERE user_id = p_user_id AND search_date = CURRENT_DATE;

  -- Return true if under limit
  RETURN v_count < v_limit;
END;
$$;

-- Function to increment search count
CREATE OR REPLACE FUNCTION increment_search_count(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_count integer;
BEGIN
  -- Insert or update search log
  INSERT INTO search_logs (user_id, search_date, search_count)
  VALUES (p_user_id, CURRENT_DATE, 1)
  ON CONFLICT (user_id, search_date)
  DO UPDATE SET
    search_count = search_logs.search_count + 1,
    updated_at = now()
  RETURNING search_count INTO v_new_count;

  RETURN v_new_count;
END;
$$;

-- Function to get remaining searches
CREATE OR REPLACE FUNCTION get_remaining_searches(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_limit integer;
  v_count integer;
BEGIN
  -- Get user limit
  SELECT daily_search_limit
  INTO v_limit
  FROM user_profiles
  WHERE id = p_user_id;

  -- Get today's search count
  SELECT COALESCE(search_count, 0)
  INTO v_count
  FROM search_logs
  WHERE user_id = p_user_id AND search_date = CURRENT_DATE;

  -- Return remaining searches
  RETURN GREATEST(0, v_limit - v_count);
END;
$$;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_search_logs_updated_at
  BEFORE UPDATE ON search_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
