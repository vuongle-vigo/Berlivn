export interface CompanyData {
  name: string;
  registration_number: string;
  activities: string;
  activities_other: string;
  employee_count: string;
  phone: string;
}

export interface UserProfileData {
  first_name: string;
  last_name: string;
  position: string;
  professional_address: string;
  postal_code: string;
  city: string;
  country: string;
  direct_phone: string;
  mobile_phone: string;
}

export interface RegistrationData {
  email: string;
  password: string;
  company: CompanyData;
  profile: UserProfileData;
}

export async function registerWithProfile(data: RegistrationData) {
  // TODO: Implement without Supabase
  return { data: { user: { id: 'mock-id' } }, error: null };
}

export async function getUserProfile(userId: string) {
  // TODO: Implement without Supabase
  return { data: null, error: null };
}

export async function updateUserProfile(userId: string, profile: Partial<UserProfileData>) {
  // TODO: Implement without Supabase
  return { data: null, error: null };
}

export async function updateCompany(companyId: string, company: Partial<CompanyData>) {
  // TODO: Implement without Supabase
  return { data: null, error: null };
}

export async function getAllUsers() {
  // TODO: Implement without Supabase
  return { data: [], error: null };
}

export async function updateUserAdmin(
  userId: string,
  updates: {
    role?: string;
    daily_search_limit?: number;
    is_active?: boolean;
  }
) {
  // TODO: Implement without Supabase
  return { data: null, error: null };
}

export async function deleteUserProfile(userId: string) {
  // TODO: Implement without Supabase
  return { error: null };
}
