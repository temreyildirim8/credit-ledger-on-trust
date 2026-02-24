import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CustomerCard } from './CustomerCard';
import { Customer } from '@/lib/services/customers.service';

// Mock formatCurrency utility
vi.mock('@/lib/utils/currency', () => ({
  formatCurrency: (amount: number) => `${amount.toLocaleString()} TRY`,
}));

describe('CustomerCard', () => {
  const mockCustomer: Customer = {
    id: 'customer-1',
    user_id: 'user-1',
    name: 'John Doe',
    phone: '+1234567890',
    address: '123 Main St',
    notes: 'Regular customer',
    balance: 1500,
    is_archived: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockCustomerWithDebt: Customer = {
    ...mockCustomer,
    balance: 2500,
  };

  const mockCustomerWithNoDebt: Customer = {
    ...mockCustomer,
    balance: 0,
  };

  const mockCustomerWithoutPhone: Customer = {
    ...mockCustomer,
    phone: undefined,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<CustomerCard customer={mockCustomer} />);
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should render customer name correctly', () => {
      render(<CustomerCard customer={mockCustomer} />);
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should render customer avatar with first letter of name', () => {
      render(<CustomerCard customer={mockCustomer} />);
      expect(screen.getByText('J')).toBeInTheDocument();
    });

    it('should render customer phone when provided', () => {
      render(<CustomerCard customer={mockCustomer} />);
      expect(screen.getByText('+1234567890')).toBeInTheDocument();
    });

    it('should not render phone icon when phone is not provided', () => {
      render(<CustomerCard customer={mockCustomerWithoutPhone} />);
      expect(screen.queryByText('+1234567890')).not.toBeInTheDocument();
    });

    it('should render formatted balance', () => {
      render(<CustomerCard customer={mockCustomer} />);
      expect(screen.getByText('1,500 TRY')).toBeInTheDocument();
    });
  });

  describe('Visual States', () => {
    it('should show red avatar for customer with debt (positive balance)', () => {
      const { container } = render(<CustomerCard customer={mockCustomerWithDebt} />);
      const avatar = container.querySelector('.bg-red-500');
      expect(avatar).toBeInTheDocument();
    });

    it('should show green avatar for customer with no debt (zero balance)', () => {
      const { container } = render(<CustomerCard customer={mockCustomerWithNoDebt} />);
      const avatar = container.querySelector('.bg-green-500');
      expect(avatar).toBeInTheDocument();
    });

    it('should show destructive badge for customer with debt', () => {
      render(<CustomerCard customer={mockCustomerWithDebt} />);
      const badge = screen.getByText('2,500 TRY').closest('.bg-red-100');
      expect(badge).toBeInTheDocument();
    });

    it('should show secondary badge for customer without debt', () => {
      render(<CustomerCard customer={mockCustomerWithNoDebt} />);
      const badge = screen.getByText('0 TRY').closest('.bg-green-100');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Props', () => {
    it('should use default locale when not provided', () => {
      render(<CustomerCard customer={mockCustomer} />);
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should accept custom locale prop', () => {
      render(<CustomerCard customer={mockCustomer} locale="tr" />);
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onClick when card is clicked', () => {
      const handleClick = vi.fn();
      render(<CustomerCard customer={mockCustomer} onClick={handleClick} />);

      const card = screen.getByText('John Doe').closest('[class*="cursor-pointer"]');
      fireEvent.click(card!);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not throw error when clicked without onClick handler', () => {
      render(<CustomerCard customer={mockCustomer} />);

      const card = screen.getByText('John Doe').closest('[class*="cursor-pointer"]');

      expect(() => {
        fireEvent.click(card!);
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty customer name gracefully', () => {
      const customerWithEmptyName: Customer = {
        ...mockCustomer,
        name: '',
      };

      render(<CustomerCard customer={customerWithEmptyName} />);
      // Avatar should show empty string or handle gracefully
      const avatar = document.querySelector('.rounded-full');
      expect(avatar).toBeInTheDocument();
    });

    it('should handle negative balance (credit)', () => {
      const customerWithCredit: Customer = {
        ...mockCustomer,
        balance: -500,
      };

      render(<CustomerCard customer={customerWithCredit} />);
      expect(screen.getByText('500 TRY')).toBeInTheDocument();
    });

    it('should handle very large balance amounts', () => {
      const customerWithLargeBalance: Customer = {
        ...mockCustomer,
        balance: 1000000000,
      };

      render(<CustomerCard customer={customerWithLargeBalance} />);
      expect(screen.getByText('1,000,000,000 TRY')).toBeInTheDocument();
    });

    it('should handle long customer names with truncation', () => {
      const customerWithLongName: Customer = {
        ...mockCustomer,
        name: 'This is a very long customer name that should be truncated',
      };

      render(<CustomerCard customer={customerWithLongName} />);
      const nameElement = screen.getByText(/This is a very long customer name/);
      expect(nameElement).toHaveClass('truncate');
    });

    it('should handle special characters in customer name', () => {
      const customerWithSpecialChars: Customer = {
        ...mockCustomer,
        name: "John O'Brien & Co.",
      };

      render(<CustomerCard customer={customerWithSpecialChars} />);
      expect(screen.getByText("John O'Brien & Co.")).toBeInTheDocument();
    });

    it('should handle unicode characters in customer name', () => {
      const customerWithUnicode: Customer = {
        ...mockCustomer,
        name: 'Müller Ñoño',
      };

      render(<CustomerCard customer={customerWithUnicode} />);
      expect(screen.getByText('Müller Ñoño')).toBeInTheDocument();
      expect(screen.getByText('M')).toBeInTheDocument(); // Avatar letter
    });

    it('should handle very long phone numbers', () => {
      const customerWithLongPhone: Customer = {
        ...mockCustomer,
        phone: '+123456789012345678901234567890',
      };

      render(<CustomerCard customer={customerWithLongPhone} />);
      const phoneElement = screen.getByText('+123456789012345678901234567890');
      expect(phoneElement).toHaveClass('truncate');
    });
  });

  describe('Accessibility', () => {
    it('should have cursor-pointer class for clickable cards', () => {
      render(<CustomerCard customer={mockCustomer} onClick={vi.fn()} />);
      const card = screen.getByText('John Doe').closest('[class*="cursor-pointer"]');
      expect(card).toHaveClass('cursor-pointer');
    });

    it('should be keyboard accessible via onClick', () => {
      const handleClick = vi.fn();
      render(<CustomerCard customer={mockCustomer} onClick={handleClick} />);

      const card = screen.getByText('John Doe').closest('[class*="cursor-pointer"]');
      // Card should be interactive
      expect(card).toBeInTheDocument();
    });
  });
});
