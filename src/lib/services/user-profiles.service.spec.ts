import { describe, it, expect, vi, beforeEach } from 'vitest';
import { userProfilesService, type OnboardingData } from './user-profiles.service';
import { supabase } from '@/lib/supabase/client';

// Type the mocked supabase
const mockSupabase = vi.mocked(supabase);

describe('userProfilesService', () => {
  const mockUserId = 'user-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should return null when profile not found (PGRST116)', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116', message: 'No rows found' },
          }),
        }),
      });
      mockSupabase.from = vi.fn().mockReturnValue({
        select: mockSelect,
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

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
        }),
      });
      mockSupabase.from = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      const result = await userProfilesService.getProfile(mockUserId);

      expect(result).toEqual(mockProfile);
    });

    it('should throw error for other database errors', async () => {
      const mockError = new Error('Database connection failed');
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'OTHER', message: 'Database connection failed' },
          }),
        }),
      });
      mockSupabase.from = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      await expect(
        userProfilesService.getProfile(mockUserId)
      ).rejects.toThrow();
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

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
        }),
      });
      mockSupabase.from = vi.fn().mockReturnValue({
        insert: mockInsert,
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

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
        }),
      });
      mockSupabase.from = vi.fn().mockReturnValue({
        insert: mockInsert,
      });

      const result = await userProfilesService.createProfile(mockUserId, {});

      expect(result.currency).toBe('TRY');
      expect(result.language).toBe('en');
      expect(result.onboarding_completed).toBe(false);
    });

    it('should throw error when creation fails', async () => {
      const mockError = new Error('Insert failed');
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
        }),
      });
      mockSupabase.from = vi.fn().mockReturnValue({
        insert: mockInsert,
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

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockUpdated, error: null }),
          }),
        }),
      });
      mockSupabase.from = vi.fn().mockReturnValue({
        update: mockUpdate,
      });

      const result = await userProfilesService.updateProfile(mockUserId, {
        full_name: 'Updated Name',
        shop_name: 'Updated Shop',
      });

      expect(result.full_name).toBe('Updated Name');
      expect(result.shop_name).toBe('Updated Shop');
    });

    it('should throw error when update fails', async () => {
      const mockError = new Error('Update failed');
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
          }),
        }),
      });
      mockSupabase.from = vi.fn().mockReturnValue({
        update: mockUpdate,
      });

      await expect(
        userProfilesService.updateProfile(mockUserId, { full_name: 'Test' })
      ).rejects.toThrow('Update failed');
    });
  });

  describe('completeOnboarding', () => {
    const onboardingData: OnboardingData = {
      currency: 'IDR',
      language: 'id',
      industry: 'warung',
    };

    it('should update existing profile', async () => {
      // Mock getProfile to return existing profile
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

      // Setup getProfile mock
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockExistingProfile, error: null }),
        }),
      });

      // Setup updateProfile mock
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockUpdatedProfile, error: null }),
          }),
        }),
      });

      mockSupabase.from = vi.fn()
        .mockReturnValueOnce({ select: mockSelect })
        .mockReturnValueOnce({ update: mockUpdate });

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

      // Setup getProfile mock to return null (no existing profile)
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' },
          }),
        }),
      });

      // Setup createProfile mock
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockNewProfile, error: null }),
        }),
      });

      mockSupabase.from = vi.fn()
        .mockReturnValueOnce({ select: mockSelect })
        .mockReturnValueOnce({ insert: mockInsert });

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

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
        }),
      });
      mockSupabase.from = vi.fn().mockReturnValue({
        select: mockSelect,
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

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
        }),
      });
      mockSupabase.from = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      const result = await userProfilesService.hasCompletedOnboarding(mockUserId);

      expect(result).toBe(false);
    });

    it('should return false when profile does not exist', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' },
          }),
        }),
      });
      mockSupabase.from = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      const result = await userProfilesService.hasCompletedOnboarding(mockUserId);

      expect(result).toBe(false);
    });
  });
});
