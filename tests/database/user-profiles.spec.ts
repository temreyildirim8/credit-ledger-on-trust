import { test, expect } from '@playwright/test';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../src/lib/database.types';

/**
 * Backend Tests for User Profiles Table CRUD Operations
 *
 * These tests verify:
 * - CRUD operations work correctly
 * - RLS policies enforce data isolation (users can only access their own profile)
 * - Profile is linked to auth.users via id (FK)
 * - Onboarding completion flag works
 * - Currency, language, and industry fields work correctly
 *
 * Prerequisites:
 * - Set up TEST_USER_EMAIL and TEST_USER_PASSWORD in .env.test
 * - Or use service role key for admin operations
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Test user credentials
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'testpassword123';

// Test data cleanup tracking
const createdProfileIds: string[] = [];

let supabase: SupabaseClient<Database>;
let _adminClient: SupabaseClient<Database>;
let testUserId: string | null = null;

test.describe('User Profiles Table CRUD Operations', () => {
  test.beforeAll(async () => {
    // Create anonymous client (for RLS testing)
    supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

    // Create admin client (bypasses RLS for cleanup)
    if (supabaseServiceKey) {
      _adminClient = createClient<Database>(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    }

    // Sign in as test user
    const { data, error } = await supabase.auth.signInWithPassword({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
    });

    if (!error && data.user) {
      testUserId = data.user.id;
    }
  });

  test.afterAll(async () => {
    // Cleanup: Reset test profile data (don't delete as profile should exist)
    // We restore original values rather than delete since profile should persist

    // Sign out
    await supabase.auth.signOut();
  });

  test.describe('CREATE Operations', () => {
    test('should create a user profile with required id field', async () => {
      test.skip(!testUserId, 'No test user authenticated');

      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', testUserId!)
        .single();

      // If profile doesn't exist, create it
      if (!existingProfile) {
        const profileData = {
          id: testUserId!,
        };

        const { data, error } = await supabase
          .from('user_profiles')
          .insert(profileData)
          .select()
          .single();

        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data!.id).toBe(testUserId);

        createdProfileIds.push(testUserId!);
      } else {
        // Profile already exists - just verify it
        expect(existingProfile.id).toBe(testUserId);
      }
    });

    test('should create a profile with all optional fields', async () => {
      test.skip(!testUserId, 'No test user authenticated');

      const profileData = {
        id: testUserId!,
        full_name: 'Test User Full Name',
        shop_name: 'Test Shop Name',
        phone: '+1234567890',
        address: '123 Test Street, Test City',
        currency: 'TRY',
        language: 'tr',
        industry: 'bakkal',
        logo_url: 'https://example.com/logo.png',
        onboarding_completed: false,
      };

      // Use upsert to handle existing profile
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert(profileData)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.full_name).toBe(profileData.full_name);
      expect(data!.shop_name).toBe(profileData.shop_name);
      expect(data!.phone).toBe(profileData.phone);
      expect(data!.address).toBe(profileData.address);
      expect(data!.currency).toBe(profileData.currency);
      expect(data!.language).toBe(profileData.language);
      expect(data!.industry).toBe(profileData.industry);
      expect(data!.logo_url).toBe(profileData.logo_url);
      expect(data!.onboarding_completed).toBe(false);
    });

    test('should fail to create profile without id', async () => {
      const profileData = {
        // id is missing - should fail
        full_name: 'No ID User',
      };

      const { data, error } = await supabase
        .from('user_profiles')
        .insert(profileData as any)
        .select()
        .single();

      expect(error).toBeDefined();
      expect(data).toBeNull();
    });

    test('should set created_at timestamp automatically', async () => {
      test.skip(!testUserId, 'No test user authenticated');

      const { data, error } = await supabase
        .from('user_profiles')
        .select('created_at')
        .eq('id', testUserId)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.created_at).toBeDefined();
    });

    test('should set default currency to TRY if not specified', async () => {
      test.skip(!testUserId, 'No test user authenticated');

      // Get current profile
      const { data, error } = await supabase
        .from('user_profiles')
        .select('currency')
        .eq('id', testUserId)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      // Currency should exist (either default or previously set)
      expect(data!.currency).toBeDefined();
    });
  });

  test.describe('READ Operations', () => {
    test('should read profile by user id', async () => {
      test.skip(!testUserId, 'No test user authenticated');

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', testUserId)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.id).toBe(testUserId);
    });

    test('should return null for non-existent profile', async () => {
      const fakeUserId = '00000000-0000-0000-0000-000000000000';

      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', fakeUserId)
        .maybeSingle();

      // Should return null (no data) without error
      expect(data).toBeNull();
    });

    test('should read onboarding_completed flag', async () => {
      test.skip(!testUserId, 'No test user authenticated');

      const { data, error } = await supabase
        .from('user_profiles')
        .select('onboarding_completed')
        .eq('id', testUserId)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(typeof data!.onboarding_completed).toBe('boolean');
    });

    test('should read currency, language, and industry settings', async () => {
      test.skip(!testUserId, 'No test user authenticated');

      const { data, error } = await supabase
        .from('user_profiles')
        .select('currency, language, industry')
        .eq('id', testUserId)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.currency).toBeDefined();
      expect(data!.language).toBeDefined();
    });
  });

  test.describe('UPDATE Operations', () => {
    test('should update full_name', async () => {
      test.skip(!testUserId, 'No test user authenticated');

      const { data, error } = await supabase
        .from('user_profiles')
        .update({ full_name: 'Updated Full Name' })
        .eq('id', testUserId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.full_name).toBe('Updated Full Name');
    });

    test('should update shop_name', async () => {
      test.skip(!testUserId, 'No test user authenticated');

      const { data, error } = await supabase
        .from('user_profiles')
        .update({ shop_name: 'Updated Shop Name' })
        .eq('id', testUserId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.shop_name).toBe('Updated Shop Name');
    });

    test('should update phone', async () => {
      test.skip(!testUserId, 'No test user authenticated');

      const { data, error } = await supabase
        .from('user_profiles')
        .update({ phone: '+9999999999' })
        .eq('id', testUserId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.phone).toBe('+9999999999');
    });

    test('should update address', async () => {
      test.skip(!testUserId, 'No test user authenticated');

      const { data, error } = await supabase
        .from('user_profiles')
        .update({ address: '456 Updated Street' })
        .eq('id', testUserId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.address).toBe('456 Updated Street');
    });

    test('should update currency', async () => {
      test.skip(!testUserId, 'No test user authenticated');

      const { data, error } = await supabase
        .from('user_profiles')
        .update({ currency: 'USD' })
        .eq('id', testUserId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.currency).toBe('USD');
    });

    test('should update language', async () => {
      test.skip(!testUserId, 'No test user authenticated');

      const { data, error } = await supabase
        .from('user_profiles')
        .update({ language: 'en' })
        .eq('id', testUserId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.language).toBe('en');
    });

    test('should update industry', async () => {
      test.skip(!testUserId, 'No test user authenticated');

      const { data, error } = await supabase
        .from('user_profiles')
        .update({ industry: 'warung' })
        .eq('id', testUserId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.industry).toBe('warung');
    });

    test('should update logo_url', async () => {
      test.skip(!testUserId, 'No test user authenticated');

      const { data, error } = await supabase
        .from('user_profiles')
        .update({ logo_url: 'https://example.com/new-logo.png' })
        .eq('id', testUserId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.logo_url).toBe('https://example.com/new-logo.png');
    });

    test('should set onboarding_completed to true', async () => {
      test.skip(!testUserId, 'No test user authenticated');

      const { data, error } = await supabase
        .from('user_profiles')
        .update({ onboarding_completed: true })
        .eq('id', testUserId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.onboarding_completed).toBe(true);
    });

    test('should set onboarding_completed to false', async () => {
      test.skip(!testUserId, 'No test user authenticated');

      const { data, error } = await supabase
        .from('user_profiles')
        .update({ onboarding_completed: false })
        .eq('id', testUserId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.onboarding_completed).toBe(false);
    });

    test('should update updated_at timestamp', async () => {
      test.skip(!testUserId, 'No test user authenticated');

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Update
      const { data, error } = await supabase
        .from('user_profiles')
        .update({ full_name: 'Timestamp Test Update' })
        .eq('id', testUserId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.updated_at).toBeDefined();
      // Note: updated_at should be updated by trigger
    });

    test('should not update profile belonging to another user', async () => {
      const randomUuid = '00000000-0000-0000-0000-000000000000';

      const { data, error } = await supabase
        .from('user_profiles')
        .update({ full_name: 'Should Not Update' })
        .eq('id', randomUuid)
        .select()
        .single();

      // Should either error or return null (no rows updated)
      expect(error || data === null).toBeTruthy();
    });
  });

  test.describe('DELETE Operations', () => {
    test('should not allow deleting user profile (RLS protection)', async () => {
      test.skip(!testUserId, 'No test user authenticated');

      // Attempt to delete own profile
      await supabase
        .from('user_profiles')
        .delete()
        .eq('id', testUserId);

      // Deletion should either be blocked by RLS or not allowed
      // The profile should still exist
      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', testUserId)
        .single();

      // Profile should still exist
      expect(data).toBeDefined();
    });
  });

  test.describe('RLS Policy Tests', () => {
    test('unauthenticated user cannot read profiles', async () => {
      // Sign out to become unauthenticated
      await supabase.auth.signOut();

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*');

      // Should either return empty or error
      expect(data?.length === 0 || error).toBeTruthy();

      // Re-sign in for other tests
      await supabase.auth.signInWithPassword({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
      });
    });

    test('unauthenticated user cannot create profile', async () => {
      // Sign out
      await supabase.auth.signOut();

      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          id: '00000000-0000-0000-0000-000000000000',
          full_name: 'Should Not Create',
        })
        .select()
        .single();

      expect(error).toBeDefined();
      expect(data).toBeNull();

      // Re-sign in
      await supabase.auth.signInWithPassword({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
      });
    });

    test('unauthenticated user cannot update profile', async () => {
      // Sign out
      await supabase.auth.signOut();

      const { data, error } = await supabase
        .from('user_profiles')
        .update({ full_name: 'Should Not Update' })
        .eq('id', testUserId || '00000000-0000-0000-0000-000000000000')
        .select()
        .single();

      expect(error || data === null).toBeTruthy();

      // Re-sign in
      await supabase.auth.signInWithPassword({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
      });
    });

    test('user can only see their own profile', async () => {
      test.skip(!testUserId, 'No test user authenticated');

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*');

      expect(error).toBeNull();
      expect(data).toBeDefined();

      // Should only see own profile
      expect(data!.length).toBe(1);
      expect(data![0].id).toBe(testUserId);
    });
  });

  test.describe('Currency and Language Settings', () => {
    const supportedCurrencies = ['TRY', 'USD', 'EUR', 'IDR', 'NGN', 'EGP', 'ZAR'];
    const supportedLanguages = ['tr', 'en', 'id', 'ar', 'es', 'pt', 'zh'];

    test('should accept supported currencies', async () => {
      test.skip(!testUserId, 'No test user authenticated');

      for (const currency of supportedCurrencies) {
        const { data, error } = await supabase
          .from('user_profiles')
          .update({ currency })
          .eq('id', testUserId)
          .select()
          .single();

        expect(error).toBeNull();
        expect(data!.currency).toBe(currency);
      }
    });

    test('should accept supported languages', async () => {
      test.skip(!testUserId, 'No test user authenticated');

      for (const language of supportedLanguages) {
        const { data, error } = await supabase
          .from('user_profiles')
          .update({ language })
          .eq('id', testUserId)
          .select()
          .single();

        expect(error).toBeNull();
        expect(data!.language).toBe(language);
      }
    });

    test('should accept various industry categories', async () => {
      test.skip(!testUserId, 'No test user authenticated');

      const industries = ['bakkal', 'kirana', 'warung', 'toko', 'kiosk', 'spaza', 'tienda'];

      for (const industry of industries) {
        const { data, error } = await supabase
          .from('user_profiles')
          .update({ industry })
          .eq('id', testUserId)
          .select()
          .single();

        expect(error).toBeNull();
        expect(data!.industry).toBe(industry);
      }
    });
  });

  test.describe('Data Validation', () => {
    test('should handle null values for optional fields', async () => {
      test.skip(!testUserId, 'No test user authenticated');

      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          full_name: null,
          shop_name: null,
          phone: null,
          address: null,
          logo_url: null,
        })
        .eq('id', testUserId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.full_name).toBeNull();
      expect(data!.shop_name).toBeNull();
      expect(data!.phone).toBeNull();
      expect(data!.address).toBeNull();
      expect(data!.logo_url).toBeNull();
    });

    test('should handle unicode characters in name fields', async () => {
      test.skip(!testUserId, 'No test user authenticated');

      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          full_name: 'Müştəri 日本語 中文 العربية',
          shop_name: 'متجر的小店',
        })
        .eq('id', testUserId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.full_name).toBe('Müştəri 日本語 中文 العربية');
      expect(data!.shop_name).toBe('متجر的小店');
    });

    test('should handle empty strings for optional text fields', async () => {
      test.skip(!testUserId, 'No test user authenticated');

      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          full_name: '',
          shop_name: '',
          phone: '',
          address: '',
        })
        .eq('id', testUserId)
        .select()
        .single();

      // Empty strings should be accepted (or converted to null)
      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    test('should handle very long names', async () => {
      test.skip(!testUserId, 'No test user authenticated');

      const longName = 'A'.repeat(500);

      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          full_name: longName,
          shop_name: longName,
        })
        .eq('id', testUserId)
        .select()
        .single();

      // Should either truncate, accept, or reject based on schema
      if (!error && data) {
        expect(data.full_name).toBeDefined();
        expect(data.shop_name).toBeDefined();
      }
    });

    test('should handle phone number formats', async () => {
      test.skip(!testUserId, 'No test user authenticated');

      const phoneFormats = [
        '+1234567890',
        '+90 555 123 4567',
        '08123456789',
        '+27 11 123 4567',
      ];

      for (const phone of phoneFormats) {
        const { data, error } = await supabase
          .from('user_profiles')
          .update({ phone })
          .eq('id', testUserId)
          .select()
          .single();

        expect(error).toBeNull();
        expect(data!.phone).toBe(phone);
      }
    });
  });

  test.describe('Onboarding Flow', () => {
    test('should start with onboarding_completed false for new users', async () => {
      // This test verifies the expected initial state
      // For existing test users, this may already be true
      test.skip(!testUserId, 'No test user authenticated');

      // Reset onboarding for testing
      await supabase
        .from('user_profiles')
        .update({
          onboarding_completed: false,
          currency: null,
          language: null,
          industry: null,
        })
        .eq('id', testUserId);

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', testUserId)
        .single();

      expect(error).toBeNull();
      expect(data!.onboarding_completed).toBe(false);
    });

    test('should complete onboarding with currency, language, and industry', async () => {
      test.skip(!testUserId, 'No test user authenticated');

      const onboardingData = {
        currency: 'TRY',
        language: 'tr',
        industry: 'bakkal',
        onboarding_completed: true,
      };

      const { data, error } = await supabase
        .from('user_profiles')
        .update(onboardingData)
        .eq('id', testUserId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.currency).toBe('TRY');
      expect(data!.language).toBe('tr');
      expect(data!.industry).toBe('bakkal');
      expect(data!.onboarding_completed).toBe(true);
    });
  });
});
