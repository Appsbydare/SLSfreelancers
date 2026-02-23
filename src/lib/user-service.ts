import { supabaseServer } from '@/lib/supabase-server';

export type UserType = 'customer' | 'tasker' | 'admin';

export const USER_BASE_SELECT = `
  id,
  first_name,
  last_name,
  calling_name,
  email,
  phone,
  location,
  city,
  district,
  user_type,
  preferred_language,
  is_verified,
  is_super_admin,
  created_at
`;

export interface DbUserRow {
  id: string;
  first_name: string;
  last_name: string;
  calling_name: string | null;
  email: string;
  phone: string;
  location: string | null;
  city: string | null;
  district: string | null;
  user_type: UserType;
  preferred_language: string | null;
  is_verified: boolean;
  is_super_admin: boolean;
  created_at: string;
}

export interface TaskerProfileRow {
  bio: string | null;
  skills: string[] | null;
  rating: number | null;
  completed_tasks: number | null;
  profile_image_url: string | null;
}

export interface ClientUser {
  id: string;
  firstName: string;
  lastName: string;
  callingName?: string;
  email: string;
  phone: string;
  location: string;
  city?: string;
  district?: string;
  userType: UserType;
  originalUserType?: UserType; // Track the user's registration type
  hasCustomerAccount?: boolean; // User has customer record
  hasTaskerAccount?: boolean; // User has tasker record
  createdAt: string;
  isVerified: boolean;
  isSuperAdmin: boolean;
  profile: {
    bio: string;
    skills: string[];
    rating: number;
    completedTasks: number;
    profileImage: string | null;
  };
}

export async function fetchTaskerProfile(userId: string) {
  const { data, error } = await supabaseServer
    .from('taskers')
    .select('bio, skills, rating, completed_tasks, profile_image_url')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Check if user has both customer and tasker accounts
 */
export async function checkDualRoles(userId: string) {
  const [customerResult, taskerResult] = await Promise.all([
    supabaseServer.from('customers').select('id').eq('user_id', userId).maybeSingle(),
    supabaseServer.from('taskers').select('id').eq('user_id', userId).maybeSingle()
  ]);

  return {
    hasCustomerAccount: !!customerResult.data,
    hasTaskerAccount: !!taskerResult.data
  };
}

export async function buildClientUser(user: DbUserRow, taskerProfile?: TaskerProfileRow | null): Promise<ClientUser> {
  // Check if user has both roles
  const dualRoles = await checkDualRoles(user.id);

  // Determine original user type
  let originalUserType = user.user_type;
  if (dualRoles.hasCustomerAccount && dualRoles.hasTaskerAccount) {
    // User has both - set original to tasker (they upgraded)
    originalUserType = 'tasker';
  }

  return {
    id: user.id,
    firstName: user.first_name,
    lastName: user.last_name,
    callingName: user.calling_name ?? undefined,
    email: user.email,
    phone: user.phone,
    location: user.location ?? '',
    city: user.city ?? undefined,
    district: user.district ?? undefined,
    userType: user.user_type,
    originalUserType,
    hasCustomerAccount: dualRoles.hasCustomerAccount,
    hasTaskerAccount: dualRoles.hasTaskerAccount,
    createdAt: user.created_at,
    isVerified: user.is_verified,
    isSuperAdmin: user.is_super_admin,
    profile: {
      bio: taskerProfile?.bio ?? '',
      skills: taskerProfile?.skills ?? [],
      rating: taskerProfile?.rating ?? 0,
      completedTasks: taskerProfile?.completed_tasks ?? 0,
      profileImage: taskerProfile?.profile_image_url ?? null,
    },
  };
}

export async function fetchUserWithProfileByEmail(email: string) {
  const { data, error } = await supabaseServer
    .from('users')
    .select(`${USER_BASE_SELECT}`)
    .ilike('email', email)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    throw new Error(error.message);
  }

  if (!data) return null;

  const taskerProfile = data.user_type === 'tasker' ? await fetchTaskerProfile(data.id) : null;
  return buildClientUser(data, taskerProfile);
}

