'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User } from '@/types/pocketbase';
import {
  signInWithGoogle,
  signOut as pbSignOut,
  getCurrentUser,
  onAuthStateChange,
  isCurrentUserAdmin,
} from '@/lib/pocketbase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: () => Promise<User>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Initialize auth state
  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    setIsAdmin(isCurrentUserAdmin());
    setLoading(false);

    // Subscribe to auth state changes
    const unsubscribe = onAuthStateChange((newUser) => {
      setUser(newUser);
      setIsAdmin(isCurrentUserAdmin());
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (): Promise<User> => {
    setLoading(true);
    try {
      const { record } = await signInWithGoogle();
      setUser(record || null);
      setIsAdmin(isCurrentUserAdmin());
      return record!;
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(() => {
    pbSignOut();
    setUser(null);
    setIsAdmin(false);
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    isAdmin,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
