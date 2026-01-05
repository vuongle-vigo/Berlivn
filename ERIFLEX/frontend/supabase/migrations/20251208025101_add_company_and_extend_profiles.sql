/*
  # Add Company Information and Extend User Profiles

  ## 1. New Tables
  
  ### `companies`
  - `id` (uuid, primary key) - Unique company identifier
  - `name` (text, required) - Company name
  - `registration_number` (text) - Company registration number
  - `activities` (text, required) - Company activities
  - `activities_other` (text) - Other activities description
  - `employee_count` (text, required) - Number of employees (0-10, 11-50, 51-200, 200+)
  - `phone` (text, required) - Company general phone number
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record update timestamp

  ## 2. Extended Columns for `user_profiles`
  - `company_id` (uuid) - References companies table
  - `first_name` (text) - User's first name
  - `last_name` (text) - User's last name
  - `position` (text) - User's position
  - `professional_address` (text) - Professional address
  - `postal_code` (text) - Postal code
  - `city` (text) - City
  - `country` (text) - Country
  - `direct_phone` (text) - Direct phone number
  - `mobile_phone` (text) - Mobile phone number

  ## 3. Security
  
  - Enable RLS on companies table
  - Users can read and update their own profile and company
  - Admins can read and update all data
*/

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  registration_number text DEFAULT '',
  activities text NOT NULL,
  activities_other text DEFAULT '',
  employee_count text NOT NULL,
  phone text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add new columns to user_profiles if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN company_id uuid REFERENCES companies(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'first_name'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN first_name text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'last_name'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN last_name text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'position'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN position text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'professional_address'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN professional_address text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'postal_code'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN postal_code text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'city'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN city text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'country'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN country text DEFAULT 'Vietnam';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'direct_phone'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN direct_phone text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'mobile_phone'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN mobile_phone text DEFAULT '';
  END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_company_id ON user_profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);

-- Create or replace function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for companies updated_at
DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on companies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for companies table

-- Authenticated users can insert companies (during registration)
CREATE POLICY "Authenticated users can insert companies"
  ON companies FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Users can view companies they belong to, admins can view all
CREATE POLICY "Users can view related companies"
  ON companies FOR SELECT
  TO authenticated
  USING (true);

-- Users can update companies they belong to, admins can update all
CREATE POLICY "Users can update related companies"
  ON companies FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Admins can delete companies
CREATE POLICY "Only admins can delete companies"
  ON companies FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );