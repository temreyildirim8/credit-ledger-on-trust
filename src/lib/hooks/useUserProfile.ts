'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { userProfilesService, UserProfile } from '@/lib/services/user-profiles.service';

interface UseUserProfileReturn {
  profile: UserProfile | null;
  currency: string;
  language: string;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to access the current user's profile data
 * Returns currency, language, and other profile information
 */
export function useUserProfile(): UseUserProfileReturn {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await userProfilesService.getProfile(user.id);
      setProfile(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load profile'));
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    currency: profile?.currency ?? 'TRY',
    language: profile?.language ?? 'en',
    loading,
    error,
    refetch: fetchProfile,
  };
}
