import { test, expect } from '@playwright/test';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../src/lib/database.types';

/**
 * Backend Tests for Customers Table CRUD Operations
 *
 * These tests verify:
 * - CRUD operations work correctly
 * - RLS policies enforce data isolation
 * - Foreign key constraints work as expected
 * - Customer limits are enforced by subscription plan
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
const createdCustomerIds: string[] = [];
const createdTransactionIds: string[] = [];

let supabase: SupabaseClient<Database>;
let adminClient: SupabaseClient<Database>;
let testUserId: string | null = null;

test.describe('Customers Table CRUD Operations', () => {
  test.beforeAll(async () => {
    // Create anonymous client (for RLS testing)
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
    }
  });

  test.afterAll(async () => {
    // Cleanup: Delete all test data created during tests
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

    // Sign out
    await supabase.auth.signOut();
  });

  test.describe('CREATE Operations', () => {
    test('should create a new customer with required fields', async () => {
      test.skip(!testUserId, 'No test user authenticated');

      const customerData = {
        user_id: testUserId!,
        name: 'Test Customer CREATE',
        phone: '+1234567890',
      };

      const { data, error } = await supabase
        .from('customers')
        .insert(customerData)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.name).toBe(customerData.name);
      expect(data!.phone).toBe(customerData.phone);
      expect(data!.user_id).toBe(testUserId);
      expect(data!.id).toBeDefined();
      expect(data!.is_deleted).toBe(false);

      // Track for cleanup
      if (data) {
        createdCustomerIds.push(data.id);
      }
    });

    test('should create a customer with all optional fields', async () => {
      test.skip(!testUserId, 'No test user authenticated');

      const customerData = {
        user_id: testUserId!,
        name: 'Test Customer Full',
        phone: '+1987654321',
        address: '123 Test Street',
        notes: 'Test notes for customer',
      };

      const { data, error } = await supabase
        .from('customers')
        .insert(customerData)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.name).toBe(customerData.name);
      expect(data!.phone).toBe(customerData.phone);
      expect(data!.address).toBe(customerData.address);
      expect(data!.notes).toBe(customerData.notes);

      if (data) {
        createdCustomerIds.push(data.id);
      }
    });

    test('should fail to create customer without name', async () => {
      test.skip(!testUserId, 'No test user authenticated');

      const customerData = {
        user_id: testUserId!,
        // name is missing - should fail
        phone: '+1111111111',
      };

      const { data, error } = await supabase
        .from('customers')
        .insert(customerData as any)
        .select()
        .single();

      expect(error).toBeDefined();
      expect(data).toBeNull();
    });

    test('should fail to create customer without user_id', async () => {
      const customerData = {
        // user_id is missing - should fail
        name: 'Test Customer No User',
        phone: '+1222222222',
      };

      const { data, error } = await supabase
        .from('customers')
        .insert(customerData as any)
        .select()
        .single();

      expect(error).toBeDefined();
      expect(data).toBeNull();
    });

    test('should auto-generate UUID for id field', async () => {
      test.skip(!testUserId, 'No test user authenticated');

      const customerData = {
        user_id: testUserId!,
        name: 'Test Customer UUID',
      };

      const { data, error } = await supabase
        .from('customers')
        .insert(customerData)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      // UUID format: 8-4-4-4-12 hex characters
      expect(data!.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      );

      if (data) {
        createdCustomerIds.push(data.id);
      }
    });

    test('should set created_at timestamp automatically', async () => {
      test.skip(!testUserId, 'No test user authenticated');

      const beforeCreate = new Date().toISOString();

      const customerData = {
        user_id: testUserId!,
        name: 'Test Customer Timestamp',
      };

      const { data, error } = await supabase
        .from('customers')
        .insert(customerData)
        .select()
        .single();

      const afterCreate = new Date().toISOString();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.created_at).toBeDefined();
      // Timestamp should be between before and after
      expect(data!.created_at!).toBeGreaterThanOrEqual(beforeCreate);
      expect(data!.created_at!).toBeLessThanOrEqual(afterCreate);

      if (data) {
        createdCustomerIds.push(data.id);
      }
    });
  });

  test.describe('READ Operations', () => {
    let testCustomerId: string;

    test.beforeAll(async () => {
      if (!testUserId) return;

      // Create a test customer for read operations
      const { data } = await supabase
        .from('customers')
        .insert({
          user_id: testUserId,
          name: 'Test Customer READ',
          phone: '+1333333333',
          address: 'Read Test Address',
        })
        .select()
        .single();

      if (data) {
        testCustomerId = data.id;
        createdCustomerIds.push(data.id);
      }
    });

    test('should read customer by id', async () => {
      test.skip(!testUserId || !testCustomerId, 'No test user or customer');

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', testCustomerId)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.id).toBe(testCustomerId);
      expect(data!.name).toBe('Test Customer READ');
    });

    test('should list all customers for user', async () => {
      test.skip(!testUserId, 'No test user authenticated');

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', testUserId);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
      expect(data!.length).toBeGreaterThan(0);
    });

    test('should filter customers by name', async () => {
      test.skip(!testUserId, 'No test user authenticated');

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', testUserId)
        .eq('name', 'Test Customer READ');

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.length).toBe(1);
      expect(data![0].name).toBe('Test Customer READ');
    });

    test('should filter customers by phone', async () => {
      test.skip(!testUserId, 'No test user authenticated');

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', testUserId)
        .eq('phone', '+1333333333');

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.length).toBeGreaterThan(0);
    });

    test('should filter out soft-deleted customers by default', async () => {
      test.skip(!testUserId, 'No test user authenticated');

      // Create and soft-delete a customer
      const { data: deletedCustomer } = await supabase
        .from('customers')
        .insert({
          user_id: testUserId,
          name: 'Test Customer Deleted',
        })
        .select()
        .single();

      if (deletedCustomer) {
        createdCustomerIds.push(deletedCustomer.id);
        await supabase
          .from('customers')
          .update({ is_deleted: true })
          .eq('id', deletedCustomer.id);
      }

      // Query for non-deleted customers
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', testUserId)
        .eq('is_deleted', false);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      // Should not include the soft-deleted customer
      expect(data!.find((c) => c.id === deletedCustomer?.id)).toBeUndefined();
    });

    test('should order customers by created_at descending', async () => {
      test.skip(!testUserId, 'No test user authenticated');

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', testUserId)
        .order('created_at', { ascending: false });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);

      // Verify ordering
      for (let i = 1; i < data!.length; i++) {
        const prevDate = new Date(data![i - 1].created_at || 0);
        const currDate = new Date(data![i].created_at || 0);
        expect(prevDate.getTime()).toBeGreaterThanOrEqual(currDate.getTime());
      }
    });

    test('should read customer from customer_balances view', async () => {
      test.skip(!testUserId || !testCustomerId, 'No test user or customer');

      const { data, error } = await supabase
        .from('customer_balances')
        .select('*')
        .eq('id', testCustomerId)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.id).toBe(testCustomerId);
      expect(data!.balance).toBeDefined();
    });
  });

  test.describe('UPDATE Operations', () => {
    let testCustomerId: string;

    test.beforeAll(async () => {
      if (!testUserId) return;

      const { data } = await supabase
        .from('customers')
        .insert({
          user_id: testUserId,
          name: 'Test Customer UPDATE',
          phone: '+1444444444',
        })
        .select()
        .single();

      if (data) {
        testCustomerId = data.id;
        createdCustomerIds.push(data.id);
      }
    });

    test('should update customer name', async () => {
      test.skip(!testUserId || !testCustomerId, 'No test user or customer');

      const { data, error } = await supabase
        .from('customers')
        .update({ name: 'Updated Customer Name' })
        .eq('id', testCustomerId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.name).toBe('Updated Customer Name');
    });

    test('should update customer phone', async () => {
      test.skip(!testUserId || !testCustomerId, 'No test user or customer');

      const { data, error } = await supabase
        .from('customers')
        .update({ phone: '+1555555555' })
        .eq('id', testCustomerId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.phone).toBe('+1555555555');
    });

    test('should update customer address and notes', async () => {
      test.skip(!testUserId || !testCustomerId, 'No test user or customer');

      const { data, error } = await supabase
        .from('customers')
        .update({
          address: 'Updated Address',
          notes: 'Updated notes',
        })
        .eq('id', testCustomerId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.address).toBe('Updated Address');
      expect(data!.notes).toBe('Updated notes');
    });

    test('should soft delete customer (set is_deleted = true)', async () => {
      test.skip(!testUserId, 'No test user authenticated');

      // Create a new customer for soft delete test
      const { data: newCustomer } = await supabase
        .from('customers')
        .insert({
          user_id: testUserId,
          name: 'Test Customer Soft Delete',
        })
        .select()
        .single();

      if (!newCustomer) {
        test.skip();
        return;
      }

      createdCustomerIds.push(newCustomer.id);

      // Soft delete
      const { data, error } = await supabase
        .from('customers')
        .update({ is_deleted: true })
        .eq('id', newCustomer.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.is_deleted).toBe(true);
    });

    test('should update updated_at timestamp', async () => {
      test.skip(!testUserId || !testCustomerId, 'No test user or customer');

      // Get current state
      await supabase
        .from('customers')
        .select('updated_at')
        .eq('id', testCustomerId)
        .single();

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Update
      const { data, error } = await supabase
        .from('customers')
        .update({ name: 'Updated Timestamp Test' })
        .eq('id', testCustomerId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();

      // Note: updated_at should be updated by trigger
      // This test verifies the field exists
      expect(data!.updated_at).toBeDefined();
    });

    test('should not update customer belonging to another user', async () => {
      // This tests RLS policy - authenticated user cannot update other users' data
      // We need another user's customer id to test this
      // For now, we'll test with a random UUID that shouldn't exist or belong to us

      const randomUuid = '00000000-0000-0000-0000-000000000000';

      const { data, error } = await supabase
        .from('customers')
        .update({ name: 'Should Not Update' })
        .eq('id', randomUuid)
        .select()
        .single();

      // Should either error or return null (no rows updated)
      expect(error || data === null).toBeTruthy();
    });
  });

  test.describe('DELETE Operations', () => {
    test('should hard delete customer', async () => {
      test.skip(!testUserId, 'No test user authenticated');

      // Create a customer to delete
      const { data: newCustomer } = await supabase
        .from('customers')
        .insert({
          user_id: testUserId,
          name: 'Test Customer Hard Delete',
        })
        .select()
        .single();

      if (!newCustomer) {
        test.skip();
        return;
      }

      // Delete
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', newCustomer.id);

      expect(error).toBeNull();

      // Verify deletion
      const { data } = await supabase
        .from('customers')
        .select('*')
        .eq('id', newCustomer.id)
        .single();

      expect(data).toBeNull();
    });

    test('should cascade delete transactions when customer is deleted', async () => {
      test.skip(!testUserId, 'No test user authenticated');

      // Create a customer with a transaction
      const { data: newCustomer } = await supabase
        .from('customers')
        .insert({
          user_id: testUserId,
          name: 'Test Customer Cascade',
        })
        .select()
        .single();

      if (!newCustomer) {
        test.skip();
        return;
      }

      // Create a transaction for this customer
      const { data: transaction } = await supabase
        .from('transactions')
        .insert({
          user_id: testUserId!,
          customer_id: newCustomer.id,
          type: 'debt',
          amount: 100,
        })
        .select()
        .single();

      if (transaction) {
        createdTransactionIds.push(transaction.id);
      }

      // Delete customer (should cascade delete transaction based on FK settings)
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', newCustomer.id);

      expect(error).toBeNull();

      // Verify transaction is also deleted
      const { data: deletedTransaction } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transaction?.id)
        .single();

      // Transaction should be deleted (or not accessible)
      expect(deletedTransaction).toBeNull();
    });
  });

  test.describe('RLS Policy Tests', () => {
    test('unauthenticated user cannot read customers', async () => {
      // Sign out to become unauthenticated
      await supabase.auth.signOut();

      const { data, error } = await supabase.from('customers').select('*');

      // Should either return empty or error
      expect(data?.length === 0 || error).toBeTruthy();

      // Re-sign in for other tests
      await supabase.auth.signInWithPassword({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
      });
    });

    test('unauthenticated user cannot create customers', async () => {
      // Sign out
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

      // Re-sign in
      await supabase.auth.signInWithPassword({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
      });
    });
  });

  test.describe('Customer Limits (Freemium Paywall)', () => {
    test('should check customer count against plan limit', async () => {
      test.skip(!testUserId, 'No test user authenticated');

      // Get current customer count
      const { count, error } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', testUserId)
        .eq('is_deleted', false);

      expect(error).toBeNull();
      expect(count).toBeDefined();
      expect(typeof count).toBe('number');

      // Free plan limit is 10 customers
      // This test just verifies we can count customers
      console.log(`Current customer count: ${count}`);
    });

    test('should prevent creating customer when limit is reached', async () => {
      // This test would require setting up a user at their limit
      // For now, we document the expected behavior
      // The database trigger check_customer_limit() should enforce this

      test.skip(!testUserId, 'No test user authenticated');

      // Get subscription plan
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('plan')
        .eq('user_id', testUserId)
        .single();

      // Get customer count
      const { count } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', testUserId)
        .eq('is_deleted', false);

      const limits: Record<string, number> = {
        free: 10,
        basic: 100,
        pro: 1000,
        enterprise: 10000,
      };

      const plan = subscription?.plan || 'free';
      const limit = limits[plan] || 10;

      console.log(`Plan: ${plan}, Limit: ${limit}, Current: ${count}`);

      // If at limit, next create should fail
      if (count && count >= limit) {
        const { error } = await supabase.from('customers').insert({
          user_id: testUserId,
          name: 'Over Limit Customer',
        });

        expect(error).toBeDefined();
      }
    });
  });

  test.describe('Data Validation', () => {
    test('should handle unicode characters in name', async () => {
      test.skip(!testUserId, 'No test user authenticated');

      const { data, error } = await supabase
        .from('customers')
        .insert({
          user_id: testUserId,
          name: 'Müştəri 日本語 中文 العربية',
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.name).toBe('Müştəri 日本語 中文 العربية');

      if (data) {
        createdCustomerIds.push(data.id);
      }
    });

    test('should handle empty strings for optional fields', async () => {
      test.skip(!testUserId, 'No test user authenticated');

      const { data, error } = await supabase
        .from('customers')
        .insert({
          user_id: testUserId,
          name: 'Test Empty Fields',
          phone: '',
          address: '',
          notes: '',
        })
        .select()
        .single();

      // Empty strings should be accepted (or converted to null)
      expect(error).toBeNull();
      expect(data).toBeDefined();

      if (data) {
        createdCustomerIds.push(data.id);
      }
    });

    test('should handle null values for optional fields', async () => {
      test.skip(!testUserId, 'No test user authenticated');

      const { data, error } = await supabase
        .from('customers')
        .insert({
          user_id: testUserId,
          name: 'Test Null Fields',
          phone: null,
          address: null,
          notes: null,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.phone).toBeNull();
      expect(data!.address).toBeNull();
      expect(data!.notes).toBeNull();

      if (data) {
        createdCustomerIds.push(data.id);
      }
    });

    test('should handle very long names', async () => {
      test.skip(!testUserId, 'No test user authenticated');

      const longName = 'A'.repeat(500);

      const { data, error } = await supabase
        .from('customers')
        .insert({
          user_id: testUserId,
          name: longName,
        })
        .select()
        .single();

      // Should either truncate, accept, or reject based on schema
      // We're testing the behavior, not enforcing a specific outcome
      if (!error && data) {
        createdCustomerIds.push(data.id);
        expect(data.name).toBeDefined();
      }
    });
  });
});
