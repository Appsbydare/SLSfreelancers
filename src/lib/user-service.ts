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
  createdAt: string;
  isVerified: boolean;
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

export function buildClientUser(user: DbUserRow, taskerProfile?: TaskerProfileRow | null): ClientUser {
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
    createdAt: user.created_at,
    isVerified: user.is_verified,
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

