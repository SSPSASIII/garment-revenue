// src/context/AuthContext.tsx
'use client';

import type { ReactNode, Dispatch, SetStateAction } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { type User, onAuthStateChanged, signOut as firebaseSignOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, type AuthError, type Auth } from 'firebase/auth';
import { auth as firebaseAuthInstance } from '@/lib/firebase'; // Your Firebase auth instance
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: AuthError | null;
  setError: Dispatch<SetStateAction<AuthError | null>>;
  signIn: (auth: Auth, email: string, pass: string) => Promise<any>; // Adjusted for direct auth passing
  signUp: (auth: Auth, email: string, pass: string) => Promise<any>; // Adjusted for direct auth passing
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuthInstance, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      setError(null); // Clear error on auth state change
    });
    return () => unsubscribe();
  }, []);

  const signOutUser = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(firebaseAuthInstance); // Use the imported auth instance
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
  
  // Wrapper for signIn to match expected signature if needed, or use directly
  const handleSignIn = async (authInstance: Auth, email: string, pass: string) => {
    setLoading(true);
    setError(null);
    try {
      return await signInWithEmailAndPassword(authInstance, email, pass);
    } catch (e) {
      setError(e as AuthError);
      throw e; // Re-throw to be caught by the calling component
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (authInstance: Auth, email: string, pass: string) => {
    setLoading(true);
    setError(null);
    try {
      return await createUserWithEmailAndPassword(authInstance, email, pass);
    } catch (e) {
      setError(e as AuthError);
      throw e; // Re-throw
    } finally {
      setLoading(false);
    }
  };


  return (
    <AuthContext.Provider value={{ 
        user, 
        loading, 
        error, 
        setError, 
        signIn: handleSignIn, 
        signUp: handleSignUp, 
        signOut: signOutUser 
    }}>
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
