'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
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
  const userRef = useRef<User | null>(null);

  // Keep ref up to date so event listeners don't use stale closures
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const fetchUserProfile = async (authUser: SupabaseUser, forceRefresh = false) => {
    try {
      // Check cache first for faster loads
      const cacheKey = `user_profile_v2_${authUser.id}`;
      if (!forceRefresh) {
        const cachedProfile = sessionStorage.getItem(cacheKey);
        if (cachedProfile) {
          try {
            return JSON.parse(cachedProfile) as User;
          } catch (e) {
            sessionStorage.removeItem(cacheKey);
          }
        }
      }

      // Use auth_user_id to fetch the user profile from public.users table
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', authUser.id)
        .maybeSingle();

      if (error) {
        console.error('[AuthContext] Error fetching user profile:', error);
        return null;
      }

      if (!profile) {
        console.error('[AuthContext] No user profile found for auth_user_id:', authUser.id);
        return null;
      }

      // Check if user is a tasker to determine verified status and dual role capability
      // Use the public user id (profile.id) to query taskers table
      const { data: taskerProfile } = await supabase
        .from('taskers')
        .select('id, onboarding_completed')
        .eq('user_id', profile.id)
        .maybeSingle();

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
        profileImage: profile.profile_image_url || authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || null,
        hasTaskerAccount: !!taskerProfile,
        hasCustomerAccount: true, // Assuming all users have a customer account
        isVerified: profile.is_verified || false,
      };

      // Cache for faster subsequent loads
      sessionStorage.setItem(`user_profile_v2_${authUser.id}`, JSON.stringify(mappedUser));

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
      console.log('[AuthContext] Initializing auth...');
      const { data: { session } } = await supabase.auth.getSession();
      console.log('[AuthContext] Session:', session?.user?.id || 'No session');

      if (mounted) {
        setSession(session);
        if (session?.user) {
          console.log('[AuthContext] Fetching profile for user:', session.user.id);
          const profile = await fetchUserProfile(session.user);
          console.log('[AuthContext] Profile fetched:', profile?.id || 'No profile');
          setUser(profile);
        } else {
          console.log('[AuthContext] No session user');
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
          const currentUser = userRef.current;
          if (!currentUser || currentUser.email !== session.user.email) {
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
    if (session?.user?.id) {
      sessionStorage.removeItem(`user_profile_v2_${session.user.id}`);
    }
    // Deep wipe to ensure no stale sessions
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('user_profile_')) {
        sessionStorage.removeItem(key);
      }
    });

    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const refreshProfile = async () => {
    if (session?.user) {
      // Clear cache to force fresh data
      sessionStorage.removeItem(`user_profile_v2_${session.user.id}`);
      const profile = await fetchUserProfile(session.user, true);
      setUser(profile);
    }
  };

  // Legacy compatibility
  const login = () => {
    // No-op
  };

  const switchRole = (role: 'customer' | 'tasker') => {
    if (!user) return;

    // Update in-memory user
    const updatedUser = { ...user, userType: role };
    setUser(updatedUser);

    // Update session storage so refreshes persist the chosen role immediately instead of clearing it
    if (session?.user?.id) {
      sessionStorage.setItem(`user_profile_v2_${session.user.id}`, JSON.stringify(updatedUser));
    }
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
