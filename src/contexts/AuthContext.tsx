'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  callingName?: string;
  email: string;
  phone: string;
  location: string;
  city?: string;
  district?: string;
  roadNameNumber?: string;
  addressLine2?: string;
  nicNumber?: string;
  userType: 'customer' | 'tasker' | 'admin';
  createdAt: string;
  isVerified: boolean;
  verificationStatus?: {
    submitted: boolean;
    approved: boolean;
    submittedAt?: string;
    approvedAt?: string;
    policeReportUrl?: string;
    idDocumentUrl?: string;
  };
  profile: {
    bio: string;
    skills: string[];
    rating: number;
    completedTasks: number;
    profileImage: string | null;
  };
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  login: (user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on app load
    const checkAuth = () => {
      try {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const userData = localStorage.getItem('user');
        
        if (isLoggedIn && userData) {
          setUser(JSON.parse(userData));
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        // Clear invalid data
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('isLoggedIn', 'true');
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
  };

  const value = {
    user,
    isLoggedIn: !!user,
    login,
    logout,
    isLoading,
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
