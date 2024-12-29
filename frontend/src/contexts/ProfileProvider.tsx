import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import {FirebaseDatabaseService, UserProfile} from 'shared';
import { AuthStatus, useAuth } from './AuthenticationProvider';

export enum ProfileStatus {
  LOADING = 'LOADING',
  COMPLETE = 'COMPLETE',
  NEEDS_ONBOARDING = 'NEEDS_ONBOARDING',
  NO_PROFILE = 'NO_PROFILE'
}

interface ProfileContextProps {
  status: ProfileStatus;
  profile: UserProfile | null;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  completeOnboarding: (data: Partial<UserProfile>) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextProps | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { authState } = useAuth();
  const [status, setStatus] = useState<ProfileStatus>(ProfileStatus.LOADING);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Load profile when auth state changes
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const loadProfile = async () => {
      switch (authState.status) {
        case AuthStatus.AUTHENTICATED:
          unsubscribe = FirebaseDatabaseService.listenToDocument<UserProfile>(
            'users',
            authState.user?.uid || '',
            (data) => {
              if (data) {
                setProfile(data);
                setStatus(ProfileStatus.COMPLETE);
              } else {
                setProfile(null);
                setStatus(ProfileStatus.NEEDS_ONBOARDING);
              }
            },
            (error) => {
              console.error('Error loading profile:', error);
              setStatus(ProfileStatus.NO_PROFILE);
            }
          );
          break;
        case AuthStatus.UNAUTHENTICATED:
          setStatus(ProfileStatus.NO_PROFILE);
          break;
        case AuthStatus.LOADING:
          break;
      }
    };

    loadProfile();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [authState]);

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!authState.user?.uid || !profile) {
      throw new Error('No authenticated user or profile');
    }

    const updateData = {
      ...data,
      updatedAt: Date.now(),
    };

    return new Promise<void>((resolve, reject) => {
      FirebaseDatabaseService.updateDocument(
        'users',
        authState.user!.uid,
        updateData,
        () => resolve(),
        (error) => reject(error)
      );
    });
  };

  const completeOnboarding = async (data: Partial<UserProfile>) => {
    if (!authState.user?.uid) {
      throw new Error('No authenticated user');
    }

    const profileData = {
      ...data,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    return new Promise<void>((resolve, reject) => {
      FirebaseDatabaseService.updateDocument(
        'users',
        authState.user!.uid,
        profileData,
        () => {
          setStatus(ProfileStatus.COMPLETE);
          resolve();
        },
        (error) => reject(error)
      );
    });
  };

  return (
    <ProfileContext.Provider
      value={{
        status,
        profile,
        updateProfile,
        completeOnboarding,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};