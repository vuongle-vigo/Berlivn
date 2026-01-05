import { supabase } from './supabase';

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
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });

    if (authError) {
      throw authError;
    }

    if (!authData.user) {
      throw new Error('User creation failed');
    }

    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .insert([{
        name: data.company.name,
        registration_number: data.company.registration_number,
        activities: data.company.activities,
        activities_other: data.company.activities_other,
        employee_count: data.company.employee_count,
        phone: data.company.phone,
      }])
      .select()
      .single();

    if (companyError) {
      throw companyError;
    }

    const fullName = `${data.profile.last_name} ${data.profile.first_name}`.trim();

    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert([{
        id: authData.user.id,
        email: data.email,
        full_name: fullName,
        company_id: companyData.id,
        first_name: data.profile.first_name,
        last_name: data.profile.last_name,
        position: data.profile.position,
        professional_address: data.profile.professional_address,
        postal_code: data.profile.postal_code,
        city: data.profile.city,
        country: data.profile.country,
        direct_phone: data.profile.direct_phone,
        mobile_phone: data.profile.mobile_phone,
        role: 'user',
        daily_search_limit: 10,
        is_active: true,
      }]);

    if (profileError) {
      throw profileError;
    }

    return { data: authData, error: null };
  } catch (error: any) {
    return { data: null, error };
  }
}

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select(`
      *,
      company:companies(*)
    `)
    .eq('id', userId)
    .maybeSingle();

  return { data, error };
}

export async function updateUserProfile(userId: string, profile: Partial<UserProfileData>) {
  const { data, error } = await supabase
    .from('user_profiles')
    .update({
      first_name: profile.first_name,
      last_name: profile.last_name,
      position: profile.position,
      professional_address: profile.professional_address,
      postal_code: profile.postal_code,
      city: profile.city,
      country: profile.country,
      direct_phone: profile.direct_phone,
      mobile_phone: profile.mobile_phone,
    })
    .eq('id', userId)
    .select()
    .single();

  return { data, error };
}

export async function updateCompany(companyId: string, company: Partial<CompanyData>) {
  const { data, error } = await supabase
    .from('companies')
    .update({
      name: company.name,
      registration_number: company.registration_number,
      activities: company.activities,
      activities_other: company.activities_other,
      employee_count: company.employee_count,
      phone: company.phone,
    })
    .eq('id', companyId)
    .select()
    .single();

  return { data, error };
}

export async function getAllUsers() {
  const { data, error } = await supabase
    .from('user_profiles')
    .select(`
      *,
      company:companies(*)
    `)
    .order('created_at', { ascending: false });

  return { data, error };
}

export async function updateUserAdmin(
  userId: string,
  updates: {
    role?: string;
    daily_search_limit?: number;
    is_active?: boolean;
  }
) {
  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  return { data, error };
}

export async function deleteUserProfile(userId: string) {
  const { error } = await supabase
    .from('user_profiles')
    .delete()
    .eq('id', userId);

  return { error };
}
