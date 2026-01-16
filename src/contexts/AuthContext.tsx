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
  originalUserType?: 'customer' | 'tasker' | 'admin'; // Track original registration type
  hasCustomerAccount?: boolean; // User has customer record
  hasTaskerAccount?: boolean; // User has tasker record
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
  switchRole: (role: 'customer' | 'tasker') => void;
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
          const parsedUser = JSON.parse(userData);
          // Set originalUserType if not already set (for existing users)
          if (!parsedUser.originalUserType) {
            parsedUser.originalUserType = parsedUser.userType;
            localStorage.setItem('user', JSON.stringify(parsedUser));
          }
          setUser(parsedUser);
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
    // Set originalUserType on login if not already set
    const userWithOriginalType = {
      ...userData,
      originalUserType: userData.originalUserType || userData.userType,
    };
    setUser(userWithOriginalType);
    localStorage.setItem('user', JSON.stringify(userWithOriginalType));
    localStorage.setItem('isLoggedIn', 'true');
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
  };

  const switchRole = (role: 'customer' | 'tasker') => {
    if (!user) return;
    
    // Update user type while keeping all other user data, including originalUserType
    const updatedUser = {
      ...user,
      userType: role,
      originalUserType: user.originalUserType || user.userType, // Preserve original registration type
    };
    
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    isLoggedIn: !!user,
    login,
    logout,
    switchRole,
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
