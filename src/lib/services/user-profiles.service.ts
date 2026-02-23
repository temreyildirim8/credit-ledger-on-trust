import { supabase } from '@/lib/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/lib/database.types';

export type UserProfile = Tables<'user_profiles'>;
export type UserProfileInsert = TablesInsert<'user_profiles'>;
export type UserProfileUpdate = TablesUpdate<'user_profiles'>;

export interface OnboardingData {
  currency: string;
  language: string;
  industry: string;
}

export const userProfilesService = {
  /**
   * Get user profile by user ID
   */
  async getProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - profile doesn't exist
        return null;
      }
      throw error;
    }

    return data;
  },

  /**
   * Create a new user profile
   */
  async createProfile(userId: string, profile: Partial<UserProfileInsert>): Promise<UserProfile> {
    const insertData: UserProfileInsert = {
      id: userId,
      full_name: profile.full_name ?? null,
      shop_name: profile.shop_name ?? null,
      phone: profile.phone ?? null,
      address: profile.address ?? null,
      currency: profile.currency ?? 'TRY',
      language: profile.language ?? 'en',
      industry: profile.industry ?? null,
      logo_url: profile.logo_url ?? null,
      onboarding_completed: profile.onboarding_completed ?? false,
    };

    const { data, error } = await supabase
      .from('user_profiles')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update user profile
   */
  async updateProfile(userId: string, profile: UserProfileUpdate): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(profile)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Complete onboarding - save currency, language, industry and mark as completed
   */
  async completeOnboarding(userId: string, onboardingData: OnboardingData): Promise<UserProfile> {
    // First check if profile exists
    const existingProfile = await this.getProfile(userId);

    if (existingProfile) {
      // Update existing profile
      return this.updateProfile(userId, {
        currency: onboardingData.currency,
        language: onboardingData.language,
        industry: onboardingData.industry,
        onboarding_completed: true,
      });
    } else {
      // Create new profile
      return this.createProfile(userId, {
        currency: onboardingData.currency,
        language: onboardingData.language,
        industry: onboardingData.industry,
        onboarding_completed: true,
      });
    }
  },

  /**
   * Check if user has completed onboarding
   */
  async hasCompletedOnboarding(userId: string): Promise<boolean> {
    const profile = await this.getProfile(userId);
    return profile?.onboarding_completed ?? false;
  },
};
