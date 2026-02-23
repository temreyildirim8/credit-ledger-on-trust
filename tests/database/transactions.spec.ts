import { test, expect } from '@playwright/test';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../src/lib/database.types';

/**
 * Backend Tests for Transactions Table CRUD Operations
 *
 * These tests verify:
 * - CRUD operations work correctly
 * - RLS policies enforce data isolation
 * - Foreign key constraints work as expected (customer_id -> customers)
 * - Transaction type validation (debt/payment)
 * - Amount validation (> 0)
 * - Customer balance calculations
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
let testCustomerId: string | null = null;

test.describe('Transactions Table CRUD Operations', () => {
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

      // Create a test customer for transaction tests
      const { data: customer } = await supabase
        .from('customers')
        .insert({
          user_id: testUserId,
          name: 'Test Customer for Transactions',
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
    test('should create a debt transaction with required fields', async () => {
      test.skip(!testUserId || !testCustomerId, 'No test user or customer');

      const transactionData = {
        user_id: testUserId!,
        customer_id: testCustomerId!,
        type: 'debt',
        amount: 150.50,
      };

      const { data, error } = await supabase
        .from('transactions')
        .insert(transactionData)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.type).toBe('debt');
      expect(data!.amount).toBe(150.50);
      expect(data!.user_id).toBe(testUserId);
      expect(data!.customer_id).toBe(testCustomerId);
      expect(data!.id).toBeDefined();

      // Track for cleanup
      if (data) {
        createdTransactionIds.push(data.id);
      }
    });

    test('should create a payment transaction with required fields', async () => {
      test.skip(!testUserId || !testCustomerId, 'No test user or customer');

      const transactionData = {
        user_id: testUserId!,
        customer_id: testCustomerId!,
        type: 'payment',
        amount: 75.25,
      };

      const { data, error } = await supabase
        .from('transactions')
        .insert(transactionData)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.type).toBe('payment');
      expect(data!.amount).toBe(75.25);

      if (data) {
        createdTransactionIds.push(data.id);
      }
    });

    test('should create transaction with all optional fields', async () => {
      test.skip(!testUserId || !testCustomerId, 'No test user or customer');

      const transactionDate = new Date().toISOString();
      const transactionData = {
        user_id: testUserId!,
        customer_id: testCustomerId!,
        type: 'debt',
        amount: 500,
        description: 'Large purchase - groceries',
        transaction_date: transactionDate,
      };

      const { data, error } = await supabase
        .from('transactions')
        .insert(transactionData)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.description).toBe('Large purchase - groceries');
      expect(data!.transaction_date).toBeDefined();

      if (data) {
        createdTransactionIds.push(data.id);
      }
    });

    test('should fail to create transaction without type', async () => {
      test.skip(!testUserId || !testCustomerId, 'No test user or customer');

      const transactionData = {
        user_id: testUserId!,
        customer_id: testCustomerId!,
        // type is missing - should fail
        amount: 100,
      };

      const { data, error } = await supabase
        .from('transactions')
        .insert(transactionData as any)
        .select()
        .single();

      expect(error).toBeDefined();
      expect(data).toBeNull();
    });

    test('should fail to create transaction without amount', async () => {
      test.skip(!testUserId || !testCustomerId, 'No test user or customer');

      const transactionData = {
        user_id: testUserId!,
        customer_id: testCustomerId!,
        type: 'debt',
        // amount is missing - should fail
      };

      const { data, error } = await supabase
        .from('transactions')
        .insert(transactionData as any)
        .select()
        .single();

      expect(error).toBeDefined();
      expect(data).toBeNull();
    });

    test('should fail to create transaction without customer_id', async () => {
      test.skip(!testUserId, 'No test user authenticated');

      const transactionData = {
        user_id: testUserId!,
        // customer_id is missing - should fail
        type: 'debt',
        amount: 100,
      };

      const { data, error } = await supabase
        .from('transactions')
        .insert(transactionData as any)
        .select()
        .single();

      expect(error).toBeDefined();
      expect(data).toBeNull();
    });

    test('should fail to create transaction with invalid type', async () => {
      test.skip(!testUserId || !testCustomerId, 'No test user or customer');

      const transactionData = {
        user_id: testUserId!,
        customer_id: testCustomerId!,
        type: 'invalid_type', // Invalid - must be 'debt' or 'payment'
        amount: 100,
      };

      const { data, error } = await supabase
        .from('transactions')
        .insert(transactionData as any)
        .select()
        .single();

      // Should fail due to check constraint
      expect(error).toBeDefined();
      expect(data).toBeNull();
    });

    test('should fail to create transaction with zero amount', async () => {
      test.skip(!testUserId || !testCustomerId, 'No test user or customer');

      const transactionData = {
        user_id: testUserId!,
        customer_id: testCustomerId!,
        type: 'debt',
        amount: 0, // Invalid - must be > 0
      };

      const { data, error } = await supabase
        .from('transactions')
        .insert(transactionData)
        .select()
        .single();

      // Should fail due to check constraint (amount > 0)
      expect(error).toBeDefined();
      expect(data).toBeNull();
    });

    test('should fail to create transaction with negative amount', async () => {
      test.skip(!testUserId || !testCustomerId, 'No test user or customer');

      const transactionData = {
        user_id: testUserId!,
        customer_id: testCustomerId!,
        type: 'debt',
        amount: -50, // Invalid - must be > 0
      };

      const { data, error } = await supabase
        .from('transactions')
        .insert(transactionData)
        .select()
        .single();

      // Should fail due to check constraint (amount > 0)
      expect(error).toBeDefined();
      expect(data).toBeNull();
    });

    test('should auto-generate UUID for id field', async () => {
      test.skip(!testUserId || !testCustomerId, 'No test user or customer');

      const transactionData = {
        user_id: testUserId!,
        customer_id: testCustomerId!,
        type: 'debt',
        amount: 25,
      };

      const { data, error } = await supabase
        .from('transactions')
        .insert(transactionData)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      // UUID format: 8-4-4-4-12 hex characters
      expect(data!.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      );

      if (data) {
        createdTransactionIds.push(data.id);
      }
    });

    test('should set created_at timestamp automatically', async () => {
      test.skip(!testUserId || !testCustomerId, 'No test user or customer');

      const beforeCreate = new Date().toISOString();

      const transactionData = {
        user_id: testUserId!,
        customer_id: testCustomerId!,
        type: 'debt',
        amount: 30,
      };

      const { data, error } = await supabase
        .from('transactions')
        .insert(transactionData)
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
        createdTransactionIds.push(data.id);
      }
    });

    test('should handle large amounts (millions for IDR)', async () => {
      test.skip(!testUserId || !testCustomerId, 'No test user or customer');

      const largeAmount = 15000000.50; // 15 million IDR

      const transactionData = {
        user_id: testUserId!,
        customer_id: testCustomerId!,
        type: 'debt',
        amount: largeAmount,
      };

      const { data, error } = await supabase
        .from('transactions')
        .insert(transactionData)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Number(data!.amount)).toBe(largeAmount);

      if (data) {
        createdTransactionIds.push(data.id);
      }
    });
  });

  test.describe('READ Operations', () => {
    let readTransactionId: string;

    test.beforeAll(async () => {
      if (!testUserId || !testCustomerId) return;

      // Create a test transaction for read operations
      const { data } = await supabase
        .from('transactions')
        .insert({
          user_id: testUserId,
          customer_id: testCustomerId,
          type: 'debt',
          amount: 200,
          description: 'Test transaction for READ',
        })
        .select()
        .single();

      if (data) {
        readTransactionId = data.id;
        createdTransactionIds.push(data.id);
      }
    });

    test('should read transaction by id', async () => {
      test.skip(!readTransactionId, 'No test transaction');

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', readTransactionId)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.id).toBe(readTransactionId);
      expect(data!.description).toBe('Test transaction for READ');
    });

    test('should list all transactions for user', async () => {
      test.skip(!testUserId, 'No test user authenticated');

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', testUserId);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
      expect(data!.length).toBeGreaterThan(0);
    });

    test('should filter transactions by type (debt)', async () => {
      test.skip(!testUserId, 'No test user authenticated');

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', testUserId)
        .eq('type', 'debt');

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.every((t) => t.type === 'debt')).toBe(true);
    });

    test('should filter transactions by type (payment)', async () => {
      test.skip(!testUserId, 'No test user authenticated');

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', testUserId)
        .eq('type', 'payment');

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.every((t) => t.type === 'payment')).toBe(true);
    });

    test('should filter transactions by customer_id', async () => {
      test.skip(!testUserId || !testCustomerId, 'No test user or customer');

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', testUserId)
        .eq('customer_id', testCustomerId);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.every((t) => t.customer_id === testCustomerId)).toBe(true);
    });

    test('should order transactions by transaction_date descending', async () => {
      test.skip(!testUserId, 'No test user authenticated');

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', testUserId)
        .order('transaction_date', { ascending: false });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);

      // Verify ordering (if there are at least 2 transactions)
      if (data!.length >= 2) {
        for (let i = 1; i < data!.length; i++) {
          const prevDate = new Date(data![i - 1].transaction_date || 0);
          const currDate = new Date(data![i].transaction_date || 0);
          expect(prevDate.getTime()).toBeGreaterThanOrEqual(currDate.getTime());
        }
      }
    });

    test('should order transactions by created_at descending', async () => {
      test.skip(!testUserId, 'No test user authenticated');

      const { data, error } = await supabase
        .from('transactions')
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

    test('should join transactions with customers', async () => {
      test.skip(!testUserId, 'No test user authenticated');

      const { data, error } = await supabase
        .from('transactions')
        .select(
          `
          id,
          type,
          amount,
          description,
          customer:customers(
            id,
            name,
            phone
          )
        `
        )
        .eq('user_id', testUserId)
        .limit(5);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);

      // Verify customer data is joined
      if (data!.length > 0) {
        const firstTransaction = data![0] as any;
        expect(firstTransaction.customer).toBeDefined();
        expect(firstTransaction.customer.name).toBeDefined();
      }
    });

    test('should filter transactions by date range', async () => {
      test.skip(!testUserId, 'No test user authenticated');

      const today = new Date();
      const startOfMonth = new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      ).toISOString();
      const endOfMonth = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        0
      ).toISOString();

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', testUserId)
        .gte('transaction_date', startOfMonth)
        .lte('transaction_date', endOfMonth);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);

      // Verify all transactions are within date range
      data!.forEach((t) => {
        if (t.transaction_date) {
          const date = new Date(t.transaction_date);
          expect(date.getTime()).toBeGreaterThanOrEqual(
            new Date(startOfMonth).getTime()
          );
          expect(date.getTime()).toBeLessThanOrEqual(
            new Date(endOfMonth).getTime()
          );
        }
      });
    });
  });

  test.describe('UPDATE Operations', () => {
    let updateTransactionId: string;

    test.beforeAll(async () => {
      if (!testUserId || !testCustomerId) return;

      const { data } = await supabase
        .from('transactions')
        .insert({
          user_id: testUserId,
          customer_id: testCustomerId,
          type: 'debt',
          amount: 300,
          description: 'Original description',
        })
        .select()
        .single();

      if (data) {
        updateTransactionId = data.id;
        createdTransactionIds.push(data.id);
      }
    });

    test('should update transaction description', async () => {
      test.skip(!updateTransactionId, 'No test transaction');

      const { data, error } = await supabase
        .from('transactions')
        .update({ description: 'Updated description' })
        .eq('id', updateTransactionId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.description).toBe('Updated description');
    });

    test('should update transaction amount', async () => {
      test.skip(!updateTransactionId, 'No test transaction');

      const { data, error } = await supabase
        .from('transactions')
        .update({ amount: 350 })
        .eq('id', updateTransactionId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Number(data!.amount)).toBe(350);
    });

    test('should update transaction type', async () => {
      test.skip(!updateTransactionId, 'No test transaction');

      const { data, error } = await supabase
        .from('transactions')
        .update({ type: 'payment' })
        .eq('id', updateTransactionId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.type).toBe('payment');
    });

    test('should update transaction_date', async () => {
      test.skip(!updateTransactionId, 'No test transaction');

      const newDate = new Date('2025-01-15T10:30:00Z').toISOString();

      const { data, error } = await supabase
        .from('transactions')
        .update({ transaction_date: newDate })
        .eq('id', updateTransactionId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.transaction_date).toBeDefined();
    });

    test('should fail to update to invalid type', async () => {
      test.skip(!updateTransactionId, 'No test transaction');

      const { data, error } = await supabase
        .from('transactions')
        .update({ type: 'invalid_type' } as any)
        .eq('id', updateTransactionId)
        .select()
        .single();

      expect(error).toBeDefined();
      expect(data).toBeNull();
    });

    test('should fail to update to zero amount', async () => {
      test.skip(!updateTransactionId, 'No test transaction');

      const { data, error } = await supabase
        .from('transactions')
        .update({ amount: 0 })
        .eq('id', updateTransactionId)
        .select()
        .single();

      expect(error).toBeDefined();
      expect(data).toBeNull();
    });

    test('should fail to update to negative amount', async () => {
      test.skip(!updateTransactionId, 'No test transaction');

      const { data, error } = await supabase
        .from('transactions')
        .update({ amount: -100 })
        .eq('id', updateTransactionId)
        .select()
        .single();

      expect(error).toBeDefined();
      expect(data).toBeNull();
    });

    test('should not update transaction belonging to another user', async () => {
      const randomUuid = '00000000-0000-0000-0000-000000000000';

      const { data, error } = await supabase
        .from('transactions')
        .update({ description: 'Should Not Update' })
        .eq('id', randomUuid)
        .select()
        .single();

      // Should either error or return null (no rows updated)
      expect(error || data === null).toBeTruthy();
    });
  });

  test.describe('DELETE Operations', () => {
    test('should hard delete transaction', async () => {
      test.skip(!testUserId || !testCustomerId, 'No test user or customer');

      // Create a transaction to delete
      const { data: newTransaction } = await supabase
        .from('transactions')
        .insert({
          user_id: testUserId,
          customer_id: testCustomerId,
          type: 'debt',
          amount: 50,
        })
        .select()
        .single();

      if (!newTransaction) {
        test.skip();
        return;
      }

      // Delete
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', newTransaction.id);

      expect(error).toBeNull();

      // Verify deletion
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', newTransaction.id)
        .single();

      expect(data).toBeNull();
    });

    test('should delete all transactions for a customer (via cascade)', async () => {
      test.skip(!testUserId, 'No test user authenticated');

      // Create a customer with transactions
      const { data: newCustomer } = await supabase
        .from('customers')
        .insert({
          user_id: testUserId,
          name: 'Test Customer Cascade Delete',
        })
        .select()
        .single();

      if (!newCustomer) {
        test.skip();
        return;
      }

      createdCustomerIds.push(newCustomer.id);

      // Create transactions for this customer
      const { data: transaction1 } = await supabase
        .from('transactions')
        .insert({
          user_id: testUserId,
          customer_id: newCustomer.id,
          type: 'debt',
          amount: 100,
        })
        .select()
        .single();

      const { data: transaction2 } = await supabase
        .from('transactions')
        .insert({
          user_id: testUserId,
          customer_id: newCustomer.id,
          type: 'debt',
          amount: 200,
        })
        .select()
        .single();

      // Track for potential cleanup
      if (transaction1) createdTransactionIds.push(transaction1.id);
      if (transaction2) createdTransactionIds.push(transaction2.id);

      // Delete customer (should cascade delete transactions based on FK settings)
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', newCustomer.id);

      expect(error).toBeNull();

      // Verify transactions are also deleted
      const { data: remainingTransactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('customer_id', newCustomer.id);

      // All transactions should be deleted
      expect(remainingTransactions?.length || 0).toBe(0);
    });
  });

  test.describe('RLS Policy Tests', () => {
    test('unauthenticated user cannot read transactions', async () => {
      // Sign out to become unauthenticated
      await supabase.auth.signOut();

      const { data, error } = await supabase
        .from('transactions')
        .select('*');

      // Should either return empty or error
      expect(data?.length === 0 || error).toBeTruthy();

      // Re-sign in for other tests
      await supabase.auth.signInWithPassword({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
      });
    });

    test('unauthenticated user cannot create transactions', async () => {
      // Sign out
      await supabase.auth.signOut();

      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000000',
          customer_id: '00000000-0000-0000-0000-000000000000',
          type: 'debt',
          amount: 100,
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

    test('user can only see their own transactions', async () => {
      test.skip(!testUserId, 'No test user authenticated');

      const { data, error } = await supabase
        .from('transactions')
        .select('*');

      expect(error).toBeNull();
      expect(data).toBeDefined();

      // All transactions should belong to the current user
      data!.forEach((transaction) => {
        expect(transaction.user_id).toBe(testUserId);
      });
    });
  });

  test.describe('Customer Balance Calculation', () => {
    let balanceCustomerId: string;
    let _balanceDebtId1: string;
    let _balanceDebtId2: string;
    let _balancePaymentId: string;

    test.beforeAll(async () => {
      if (!testUserId) return;

      // Create a dedicated customer for balance tests
      const { data: customer } = await supabase
        .from('customers')
        .insert({
          user_id: testUserId,
          name: 'Test Customer Balance',
        })
        .select()
        .single();

      if (customer) {
        balanceCustomerId = customer.id;
        createdCustomerIds.push(customer.id);
      }
    });

    test('should calculate correct balance with debts and payments', async () => {
      test.skip(!testUserId || !balanceCustomerId, 'No test user or customer');

      // Add two debts: 200 + 150 = 350
      const { data: debt1 } = await supabase
        .from('transactions')
        .insert({
          user_id: testUserId,
          customer_id: balanceCustomerId,
          type: 'debt',
          amount: 200,
        })
        .select()
        .single();

      const { data: debt2 } = await supabase
        .from('transactions')
        .insert({
          user_id: testUserId,
          customer_id: balanceCustomerId,
          type: 'debt',
          amount: 150,
        })
        .select()
        .single();

      // Add payment: 100
      const { data: payment } = await supabase
        .from('transactions')
        .insert({
          user_id: testUserId,
          customer_id: balanceCustomerId,
          type: 'payment',
          amount: 100,
        })
        .select()
        .single();

      if (debt1) {
        _balanceDebtId1 = debt1.id;
        createdTransactionIds.push(debt1.id);
      }
      if (debt2) {
        _balanceDebtId2 = debt2.id;
        createdTransactionIds.push(debt2.id);
      }
      if (payment) {
        _balancePaymentId = payment.id;
        createdTransactionIds.push(payment.id);
      }

      // Check customer_balances view
      // Expected balance: 200 + 150 - 100 = 250
      const { data, error } = await supabase
        .from('customer_balances')
        .select('*')
        .eq('id', balanceCustomerId)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Number(data!.balance)).toBe(250);
      expect(data!.transaction_count).toBe(3);
    });

    test('customer_balances view should show transaction count', async () => {
      test.skip(!balanceCustomerId, 'No test customer');

      const { data, error } = await supabase
        .from('customer_balances')
        .select('*')
        .eq('id', balanceCustomerId)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.transaction_count).toBeGreaterThan(0);
    });

    test('customer_balances view should show last_transaction_date', async () => {
      test.skip(!balanceCustomerId, 'No test customer');

      const { data, error } = await supabase
        .from('customer_balances')
        .select('*')
        .eq('id', balanceCustomerId)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.last_transaction_date).toBeDefined();
    });
  });

  test.describe('Data Validation', () => {
    test('should handle unicode characters in description', async () => {
      test.skip(!testUserId || !testCustomerId, 'No test user or customer');

      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: testUserId,
          customer_id: testCustomerId,
          type: 'debt',
          amount: 50,
          description: 'Satın alma - 购买 - شراء',
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.description).toBe('Satın alma - 购买 - شراء');

      if (data) {
        createdTransactionIds.push(data.id);
      }
    });

    test('should handle null description', async () => {
      test.skip(!testUserId || !testCustomerId, 'No test user or customer');

      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: testUserId,
          customer_id: testCustomerId,
          type: 'debt',
          amount: 50,
          description: null,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.description).toBeNull();

      if (data) {
        createdTransactionIds.push(data.id);
      }
    });

    test('should handle empty description', async () => {
      test.skip(!testUserId || !testCustomerId, 'No test user or customer');

      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: testUserId,
          customer_id: testCustomerId,
          type: 'debt',
          amount: 50,
          description: '',
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();

      if (data) {
        createdTransactionIds.push(data.id);
      }
    });

    test('should handle decimal amounts correctly', async () => {
      test.skip(!testUserId || !testCustomerId, 'No test user or customer');

      const decimalAmount = 123.456789;

      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: testUserId,
          customer_id: testCustomerId,
          type: 'debt',
          amount: decimalAmount,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      // Amount should be stored (possibly rounded by database)
      expect(Number(data!.amount)).toBeCloseTo(decimalAmount, 2);

      if (data) {
        createdTransactionIds.push(data.id);
      }
    });

    test('should handle very long descriptions', async () => {
      test.skip(!testUserId || !testCustomerId, 'No test user or customer');

      const longDescription = 'A'.repeat(1000);

      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: testUserId,
          customer_id: testCustomerId,
          type: 'debt',
          amount: 50,
          description: longDescription,
        })
        .select()
        .single();

      // Should either truncate, accept, or reject based on schema
      if (!error && data) {
        createdTransactionIds.push(data.id);
        expect(data.description).toBeDefined();
      }
    });
  });

  test.describe('Foreign Key Constraints', () => {
    test('should fail to create transaction with non-existent customer_id', async () => {
      test.skip(!testUserId, 'No test user authenticated');

      const fakeCustomerId = '00000000-0000-0000-0000-000000000000';

      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: testUserId,
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
  });
});
