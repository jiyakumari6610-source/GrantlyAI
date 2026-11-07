import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import {
  auth,
  fetchUserProfile,
  persistUserProfile,
  logoutUser,
  resendVerification,
  testFirestoreConnection,
} from '../services/firebase';
import { StudentProfile } from '../types';
import { BLANK_STUDENT_PROFILE } from '../services/storageService';

interface AuthContextType {
  user: FirebaseUser | null;
  profile: StudentProfile | null;
  loading: boolean;
  isFirestoreOnline: boolean;
  emailVerified: boolean;
  refreshProfile: () => Promise<void>;
  updateProfileData: (updates: Partial<StudentProfile>) => Promise<void>;
  logout: () => Promise<void>;
  resendEmailVerification: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFirestoreOnline, setIsFirestoreOnline] = useState(true);

  const loadUserProfile = async (firebaseUser: FirebaseUser) => {
    try {
      let userProfile = await fetchUserProfile(firebaseUser.uid);
      if (!userProfile) {
        // Initialize clean student profile in Firestore
        userProfile = {
          ...BLANK_STUDENT_PROFILE,
          id: firebaseUser.uid,
          fullName: firebaseUser.displayName || '',
          email: firebaseUser.email || '',
          onboardingCompleted: false,
        };
        await persistUserProfile(firebaseUser.uid, userProfile);
      }
      setProfile(userProfile);
    } catch (err) {
      console.error('Failed to load user profile from Firestore:', err);
      // Fallback local state if network or initial setup is pending
      setProfile({
        ...BLANK_STUDENT_PROFILE,
        id: firebaseUser.uid,
        fullName: firebaseUser.displayName || '',
        email: firebaseUser.email || '',
      });
    }
  };

  useEffect(() => {
    // Test connection on app load
    testFirestoreConnection().then(setIsFirestoreOnline);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await loadUserProfile(currentUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (user) {
      await loadUserProfile(user);
    }
  };

  const updateProfileData = async (updates: Partial<StudentProfile>) => {
    if (!user || !profile) return;
    const merged: StudentProfile = {
      ...profile,
      ...updates,
      id: user.uid,
      email: user.email || profile.email,
    };
    setProfile(merged);
    await persistUserProfile(user.uid, merged);
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
    setProfile(null);
  };

  const resendEmailVerification = async () => {
    await resendVerification();
  };

  const getIdToken = async (): Promise<string | null> => {
    if (auth.currentUser) {
      return auth.currentUser.getIdToken();
    }
    return null;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isFirestoreOnline,
        emailVerified: user?.emailVerified || false,
        refreshProfile,
        updateProfileData,
        logout,
        resendEmailVerification,
        getIdToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
