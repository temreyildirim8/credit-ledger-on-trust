'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { customersService, Customer } from '@/lib/services/customers.service';

export function useCustomers() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCustomers = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await customersService.getCustomers(user.id);
      setCustomers(data);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const createCustomer = async (customer: {
    name: string;
    phone?: string;
    address?: string;
    notes?: string;
  }): Promise<Customer> => {
    if (!user?.id) throw new Error('User not authenticated');

    const newCustomer = await customersService.createCustomer(user.id, customer);
    setCustomers([newCustomer, ...customers]);
    return newCustomer;
  };

  const refreshCustomers = useCallback(() => {
    loadCustomers();
  }, [loadCustomers]);

  const archiveCustomer = async (customerId: string) => {
    await customersService.archiveCustomer(customerId);
    setCustomers(customers.filter(c => c.id !== customerId));
  };

  const deleteCustomer = async (customerId: string) => {
    await customersService.deleteCustomer(customerId);
    setCustomers(customers.filter(c => c.id !== customerId));
  };

  return { customers, loading, createCustomer, refreshCustomers, archiveCustomer, deleteCustomer };
}
