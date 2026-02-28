import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { userProfilesService, type OnboardingData } from './user-profiles.service';

describe('userProfilesService', () => {
  const mockUserId = 'user-123';

  // Store original fetch
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('getProfile', () => {
    it('should return null when profile not found', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ profile: null }),
      });

      const result = await userProfilesService.getProfile(mockUserId);

      expect(result).toBeNull();
    });

    it('should return profile when found', async () => {
      const mockProfile = {
        id: mockUserId,
        full_name: 'John Doe',
        shop_name: 'John Shop',
        phone: '+1234567890',
        address: '123 Main St',
        currency: 'TRY',
        language: 'tr',
        industry: 'bakkal',
        logo_url: null,
        onboarding_completed: true,
        created_at: '2024-01-01',
        updated_at: '2024-01-02',
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ profile: mockProfile }),
      });

      const result = await userProfilesService.getProfile(mockUserId);

      expect(result).toEqual(mockProfile);
    });

    it('should throw error for server errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Database connection failed' }),
      });

      await expect(
        userProfilesService.getProfile(mockUserId)
      ).rejects.toThrow('Database connection failed');
    });
  });

  describe('createProfile', () => {
    it('should create profile with all fields', async () => {
      const mockProfile = {
        id: mockUserId,
        full_name: 'Jane Doe',
        shop_name: 'Jane Store',
        phone: '+9999999999',
        address: '456 Oak Ave',
        currency: 'USD',
        language: 'en',
        industry: 'retail',
        logo_url: 'https://example.com/logo.png',
        onboarding_completed: false,
        created_at: '2024-01-01',
        updated_at: null,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({ profile: mockProfile }),
      });

      const result = await userProfilesService.createProfile(mockUserId, {
        full_name: 'Jane Doe',
        shop_name: 'Jane Store',
        phone: '+9999999999',
        address: '456 Oak Ave',
        currency: 'USD',
        language: 'en',
        industry: 'retail',
        logo_url: 'https://example.com/logo.png',
      });

      expect(result.full_name).toBe('Jane Doe');
      expect(result.currency).toBe('USD');
    });

    it('should use default values when not provided', async () => {
      const mockProfile = {
        id: mockUserId,
        full_name: null,
        shop_name: null,
        phone: null,
        address: null,
        currency: 'TRY',
        language: 'en',
        industry: null,
        logo_url: null,
        onboarding_completed: false,
        created_at: '2024-01-01',
        updated_at: null,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({ profile: mockProfile }),
      });

      const result = await userProfilesService.createProfile(mockUserId, {});

      expect(result.currency).toBe('TRY');
      expect(result.language).toBe('en');
      expect(result.onboarding_completed).toBe(false);
    });

    it('should throw error when creation fails', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Insert failed' }),
      });

      await expect(
        userProfilesService.createProfile(mockUserId, {})
      ).rejects.toThrow('Insert failed');
    });
  });

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      const mockUpdated = {
        id: mockUserId,
        full_name: 'Updated Name',
        shop_name: 'Updated Shop',
        phone: '+1111111111',
        address: 'Updated Address',
        currency: 'EUR',
        language: 'en',
        industry: 'kirana',
        logo_url: null,
        onboarding_completed: true,
        created_at: '2024-01-01',
        updated_at: '2024-01-03',
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ profile: mockUpdated }),
      });

      const result = await userProfilesService.updateProfile(mockUserId, {
        full_name: 'Updated Name',
        shop_name: 'Updated Shop',
      });

      expect(result.full_name).toBe('Updated Name');
      expect(result.shop_name).toBe('Updated Shop');
    });

    it('should throw error when update fails', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Update failed' }),
      });

      await expect(
        userProfilesService.updateProfile(mockUserId, { full_name: 'Test' })
      ).rejects.toThrow('Update failed');
    });

    it('should throw error when profile not found', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Not found' }),
      });

      await expect(
        userProfilesService.updateProfile(mockUserId, { full_name: 'Test' })
      ).rejects.toThrow('Profile not found');
    });
  });

  describe('completeOnboarding', () => {
    const onboardingData: OnboardingData = {
      currency: 'IDR',
      language: 'id',
      industry: 'warung',
    };

    it('should update existing profile', async () => {
      const mockExistingProfile = {
        id: mockUserId,
        full_name: 'Existing User',
        shop_name: null,
        phone: null,
        address: null,
        currency: 'TRY',
        language: 'en',
        industry: null,
        logo_url: null,
        onboarding_completed: false,
        created_at: '2024-01-01',
        updated_at: null,
      };

      const mockUpdatedProfile = {
        ...mockExistingProfile,
        currency: 'IDR',
        language: 'id',
        industry: 'warung',
        onboarding_completed: true,
      };

      // First call: getProfile
      // Second call: updateProfile
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ profile: mockExistingProfile }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ profile: mockUpdatedProfile }),
        });

      const result = await userProfilesService.completeOnboarding(mockUserId, onboardingData);

      expect(result.currency).toBe('IDR');
      expect(result.language).toBe('id');
      expect(result.industry).toBe('warung');
      expect(result.onboarding_completed).toBe(true);
    });

    it('should create new profile if not exists', async () => {
      const mockNewProfile = {
        id: mockUserId,
        full_name: null,
        shop_name: null,
        phone: null,
        address: null,
        currency: 'IDR',
        language: 'id',
        industry: 'warung',
        logo_url: null,
        onboarding_completed: true,
        created_at: '2024-01-01',
        updated_at: null,
      };

      // First call: getProfile returns null
      // Second call: createProfile
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ profile: null }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: async () => ({ profile: mockNewProfile }),
        });

      const result = await userProfilesService.completeOnboarding(mockUserId, onboardingData);

      expect(result.currency).toBe('IDR');
      expect(result.onboarding_completed).toBe(true);
    });
  });

  describe('hasCompletedOnboarding', () => {
    it('should return true when onboarding is completed', async () => {
      const mockProfile = {
        id: mockUserId,
        full_name: 'Test User',
        shop_name: null,
        phone: null,
        address: null,
        currency: 'TRY',
        language: 'tr',
        industry: 'bakkal',
        logo_url: null,
        onboarding_completed: true,
        created_at: '2024-01-01',
        updated_at: null,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ profile: mockProfile }),
      });

      const result = await userProfilesService.hasCompletedOnboarding(mockUserId);

      expect(result).toBe(true);
    });

    it('should return false when onboarding is not completed', async () => {
      const mockProfile = {
        id: mockUserId,
        full_name: 'Test User',
        shop_name: null,
        phone: null,
        address: null,
        currency: 'TRY',
        language: 'tr',
        industry: null,
        logo_url: null,
        onboarding_completed: false,
        created_at: '2024-01-01',
        updated_at: null,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ profile: mockProfile }),
      });

      const result = await userProfilesService.hasCompletedOnboarding(mockUserId);

      expect(result).toBe(false);
    });

    it('should return false when profile does not exist', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ profile: null }),
      });

      const result = await userProfilesService.hasCompletedOnboarding(mockUserId);

      expect(result).toBe(false);
    });
  });
});
