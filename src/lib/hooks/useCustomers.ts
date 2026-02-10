'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { customersService, Customer } from '@/lib/services/customers.service';

export function useCustomers() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const loadCustomers = async () => {
      setLoading(true);
      try {
        const data = await customersService.getCustomers(user.id);
        setCustomers(data);
      } catch (error) {
        console.error('Error loading customers:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCustomers();
  }, [user?.id]);

  const createCustomer = async (customer: {
    name: string;
    phone?: string;
    address?: string;
    notes?: string;
  }) => {
    if (!user?.id) throw new Error('User not authenticated');

    const newCustomer = await customersService.createCustomer(user.id, customer);
    setCustomers([newCustomer, ...customers]);
    return newCustomer;
  };

  return { customers, loading, createCustomer };
}
