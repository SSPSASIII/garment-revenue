// src/context/AuthContext.tsx
'use client';

import type { ReactNode, Dispatch, SetStateAction } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { type User, onAuthStateChanged, signOut as firebaseSignOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, type AuthError } from 'firebase/auth';
import { auth } from '@/lib/firebase'; // Your Firebase auth instance
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: AuthError | null;
  setError: Dispatch<SetStateAction<AuthError | null>>;
  signIn: typeof signInWithEmailAndPassword;
  signUp: typeof createUserWithEmailAndPassword;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      setError(null);
    });
    return () => unsubscribe();
  }, []);

  const signOutUser = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setError(null);
      router.push('/login'); // Redirect to login after sign out
    } catch (e) {
      setError(e as AuthError);
      console.error("Sign out error:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, setError, signIn: signInWithEmailAndPassword, signUp: createUserWithEmailAndPassword, signOut: signOutUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
