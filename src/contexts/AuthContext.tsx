'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

// Extended User type to include profile data from public.users
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  callingName?: string;
  email: string;
  phone?: string;
  location?: string;
  userType: 'customer' | 'tasker' | 'admin';
  originalUserType?: 'customer' | 'tasker' | 'admin';
  profileImage?: string;
  hasTaskerAccount?: boolean;
  hasCustomerAccount?: boolean;
  isVerified?: boolean;
}

interface AuthContextType {
  user: User | null;
  session: any | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: () => void;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  switchRole: (role: 'customer' | 'tasker') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = async (authUser: SupabaseUser) => {
    try {
      // Check cache first for faster loads
      const cachedProfile = sessionStorage.getItem(`user_profile_${authUser.id}`);
      if (cachedProfile) {
        try {
          return JSON.parse(cachedProfile) as User;
        } catch (e) {
          sessionStorage.removeItem(`user_profile_${authUser.id}`);
        }
      }

      // Use auth_user_id to fetch the user profile from public.users table
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', authUser.id)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      // Check if user is a tasker to determine verified status and dual role capability
      // Use the public user id (profile.id) to query taskers table
      const { data: taskerProfile } = await supabase
        .from('taskers')
        .select('id, onboarding_completed')
        .eq('user_id', profile.id)
        .single();

      // Map DB fields to Context User type
      const mappedUser: User = {
        id: profile.id,
        firstName: profile.first_name,
        lastName: profile.last_name,
        callingName: profile.calling_name,
        email: authUser.email || '',
        phone: profile.phone,
        location: profile.location,
        userType: profile.user_type as 'customer' | 'tasker' | 'admin',
        originalUserType: profile.user_type, // Default to same initially
        profileImage: profile.profile_image,
        hasTaskerAccount: !!taskerProfile,
        hasCustomerAccount: true, // Assuming all users have a customer account
        isVerified: taskerProfile?.onboarding_completed || false,
      };

      // Cache for faster subsequent loads
      sessionStorage.setItem(`user_profile_${authUser.id}`, JSON.stringify(mappedUser));

      return mappedUser;
    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    // 1. Check active session
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (mounted) {
        setSession(session);
        if (session?.user) {
          const profile = await fetchUserProfile(session.user);
          setUser(profile);
        }
        setIsLoading(false);
      }
    };

    initAuth();

    // 2. Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (mounted) {
        setSession(session);
        if (session?.user) {
          // If we just logged in or signed up, fetch/refresh profile
          // But careful not to overwrite if we only refreshed token
          // For simplicity we refresh profile
          if (!user || user.id !== session.user.id) {
            // Don't set isLoading(true) here - it causes login button to hang
            // The profile fetch is fast enough and login page handles its own loading state
            const profile = await fetchUserProfile(session.user);
            setUser(profile);
          }
        } else {
          setUser(null);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // Remove dependency on user state to avoid infinite loop

  const logout = async () => {
    // Clear cache on logout
    if (user?.id) {
      sessionStorage.removeItem(`user_profile_${user.id}`);
    }
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const refreshProfile = async () => {
    if (session?.user) {
      // Clear cache to force fresh data
      sessionStorage.removeItem(`user_profile_${session.user.id}`);
      const profile = await fetchUserProfile(session.user);
      setUser(profile);
    }
  };

  // Legacy compatibility
  const login = () => {
    // No-op
  };

  const switchRole = (role: 'customer' | 'tasker') => {
    if (!user) return;

    // Clear cache so next fetch gets fresh data with correct role
    if (session?.user?.id) {
      sessionStorage.removeItem(`user_profile_${session.user.id}`);
    }

    setUser({ ...user, userType: role });
  };

  const value = {
    user,
    session,
    isLoggedIn: !!user,
    isLoading,
    login,
    logout,
    refreshProfile,
    switchRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
