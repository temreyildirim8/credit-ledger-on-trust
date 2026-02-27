"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useAuth } from "./useAuth";
import {
  userProfilesService,
  UserProfile,
} from "@/lib/services/user-profiles.service";
import { queryKeys } from "@/lib/query-keys";

interface UseUserProfileReturn {
  profile: UserProfile | null;
  currency: string;
  language: string;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  invalidateProfile: () => void;
}

/**
 * Hook to access the current user's profile data
 * Uses React Query for caching and automatic refetching
 * Returns currency, language, and other profile information
 */
export function useUserProfile(): UseUserProfileReturn {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: profile,
    isLoading: loading,
    error,
    refetch,
  } = useQuery<UserProfile | null>({
    queryKey: queryKeys.userProfile.current(),
    queryFn: async () => {
      if (!user?.id) return null;
      return userProfilesService.getProfile(user.id);
    },
    enabled: !!user?.id,
    staleTime: 60 * 1000, // 1 minute - profile doesn't change often
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });

  // Manual refetch function (for backward compatibility)
  const handleRefetch = useCallback(async () => {
    await refetch();
  }, [refetch]);

  // Invalidate profile cache (useful after profile updates)
  const invalidateProfile = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.userProfile.all });
  }, [queryClient]);

  return {
    profile: profile ?? null,
    currency: profile?.currency ?? "TRY",
    language: profile?.language ?? "en",
    loading,
    error: error ?? null,
    refetch: handleRefetch,
    // Additional utility
    invalidateProfile,
  };
}

/**
 * Hook to update user profile with React Query mutation
 */
export function useUpdateUserProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>) => {
      if (!user?.id) throw new Error("User not authenticated");

      // Optimistic update
      queryClient.setQueryData<UserProfile | null>(
        queryKeys.userProfile.current(),
        (old) => (old ? { ...old, ...updates } : null),
      );

      try {
        const updated = await userProfilesService.updateProfile(
          user.id,
          updates,
        );

        // Update cache with server response
        queryClient.setQueryData<UserProfile>(
          queryKeys.userProfile.current(),
          updated,
        );

        return updated;
      } catch (error) {
        // Refetch on error to restore correct state
        queryClient.invalidateQueries({ queryKey: queryKeys.userProfile.all });
        throw error;
      }
    },
    [user, queryClient],
  );

  return { updateProfile };
}

// Re-export UserProfile type
export type { UserProfile };
