export interface UserProfile {
  id: string;
  full_name: string | null;
  shop_name: string | null;
  phone: string | null;
  address: string | null;
  currency: string;
  language: string;
  industry: string | null;
  logo_url: string | null;
  onboarding_completed: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface OnboardingData {
  currency: string;
  language: string;
  industry: string;
}

export const userProfilesService = {
  /**
   * Get user profile by user ID
   * Uses secure API route (server-side JWT validation)
   */
  async getProfile(_userId: string): Promise<UserProfile | null> {
    const response = await fetch("/api/user-profiles", {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Unauthorized. Please sign in to continue.");
      }
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch profile");
    }

    const data = await response.json();
    return data.profile;
  },

  /**
   * Create a new user profile
   * Uses secure API route (server-side JWT validation)
   */
  async createProfile(
    _userId: string,
    profile: Partial<{
      full_name: string | null;
      shop_name: string | null;
      phone: string | null;
      address: string | null;
      currency: string;
      language: string;
      industry: string | null;
      logo_url: string | null;
      onboarding_completed: boolean;
    }>,
  ): Promise<UserProfile> {
    const response = await fetch("/api/user-profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        full_name: profile.full_name ?? null,
        shop_name: profile.shop_name ?? null,
        phone: profile.phone ?? null,
        address: profile.address ?? null,
        currency: profile.currency ?? "TRY",
        language: profile.language ?? "en",
        industry: profile.industry ?? null,
        logo_url: profile.logo_url ?? null,
        onboarding_completed: profile.onboarding_completed ?? false,
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Unauthorized. Please sign in to continue.");
      }
      const error = await response.json();
      throw new Error(error.error || "Failed to create profile");
    }

    const data = await response.json();
    return data.profile;
  },

  /**
   * Update user profile
   * Uses secure API route (server-side JWT validation)
   */
  async updateProfile(
    _userId: string,
    profile: Partial<{
      full_name: string | null;
      shop_name: string | null;
      phone: string | null;
      address: string | null;
      currency: string;
      language: string;
      industry: string | null;
      logo_url: string | null;
      onboarding_completed: boolean;
    }>,
  ): Promise<UserProfile> {
    const response = await fetch("/api/user-profiles", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(profile),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Unauthorized. Please sign in to continue.");
      }
      if (response.status === 404) {
        throw new Error("Profile not found");
      }
      const error = await response.json();
      throw new Error(error.error || "Failed to update profile");
    }

    const data = await response.json();
    return data.profile;
  },

  /**
   * Complete onboarding - save currency, language, industry and mark as completed
   * Uses secure API route (server-side JWT validation)
   */
  async completeOnboarding(
    userId: string,
    onboardingData: OnboardingData,
  ): Promise<UserProfile> {
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
   * Uses secure API route (server-side JWT validation)
   */
  async hasCompletedOnboarding(userId: string): Promise<boolean> {
    const profile = await this.getProfile(userId);
    return profile?.onboarding_completed ?? false;
  },
};
