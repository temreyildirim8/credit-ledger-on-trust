import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { AddTransactionModal } from './AddTransactionModal';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock useAuth hook
vi.mock('@/lib/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

// Mock transactions service
vi.mock('@/lib/services/transactions.service', () => ({
  transactionsService: {
    getCustomers: vi.fn(),
  },
}));

import { useAuth } from '@/lib/hooks/useAuth';
import { transactionsService } from '@/lib/services/transactions.service';
import { toast } from 'sonner';

const mockCustomers = [
  { id: 'customer-1', name: 'John Doe' },
  { id: 'customer-2', name: 'Jane Smith' },
  { id: 'customer-3', name: 'Bob Wilson' },
];

describe('AddTransactionModal', () => {
  const mockOnOpenChange = vi.fn();
  const mockOnSave = vi.fn();

  const defaultProps = {
    open: false,
    onOpenChange: mockOnOpenChange,
    onSave: mockOnSave,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com' },
      isLoading: false,
      isAuthenticated: true,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPassword: vi.fn(),
    });
    vi.mocked(transactionsService.getCustomers).mockResolvedValue(mockCustomers);
    mockOnSave.mockResolvedValue(undefined);
  });

  describe('Rendering', () => {
    it('should not render when closed', () => {
      render(<AddTransactionModal {...defaultProps} open={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render when open', () => {
      act(() => {
        render(<AddTransactionModal {...defaultProps} open={true} />);
      });

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should render debt and payment toggle buttons', () => {
      act(() => {
        render(<AddTransactionModal {...defaultProps} open={true} />);
      });

      // With global mock, buttons show the translation key
      expect(screen.getByRole('button', { name: 'debt' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'payment' })).toBeInTheDocument();
    });

    it('should render form fields', () => {
      act(() => {
        render(<AddTransactionModal {...defaultProps} open={true} />);
      });

      // Check for input fields by ID
      expect(document.getElementById('amount')).toBeInTheDocument();
      expect(document.getElementById('note')).toBeInTheDocument();
    });

    it('should load customers on open', () => {
      act(() => {
        render(<AddTransactionModal {...defaultProps} open={true} />);
      });

      expect(transactionsService.getCustomers).toHaveBeenCalledWith('user-1');
    });
  });

  describe('Type Toggle', () => {
    it('should default to debt type', () => {
      act(() => {
        render(<AddTransactionModal {...defaultProps} open={true} />);
      });

      const debtButton = screen.getByRole('button', { name: 'debt' });
      expect(debtButton).toHaveClass('bg-red-500');
    });

    it('should switch to payment when payment button is clicked', () => {
      act(() => {
        render(<AddTransactionModal {...defaultProps} open={true} />);
      });

      const paymentButton = screen.getByRole('button', { name: 'payment' });
      fireEvent.click(paymentButton);

      expect(paymentButton).toHaveClass('bg-green-500');
    });

    it('should use preselected type when provided', () => {
      act(() => {
        render(
          <AddTransactionModal
            {...defaultProps}
            open={true}
            preselectedType="payment"
          />
        );
      });

      const paymentButton = screen.getByRole('button', { name: 'payment' });
      expect(paymentButton).toHaveClass('bg-green-500');
    });

    it('should toggle back to debt when clicking debt button', () => {
      act(() => {
        render(<AddTransactionModal {...defaultProps} open={true} />);
      });

      // First switch to payment
      const paymentButton = screen.getByRole('button', { name: 'payment' });
      fireEvent.click(paymentButton);

      // Then switch back to debt
      const debtButton = screen.getByRole('button', { name: 'debt' });
      fireEvent.click(debtButton);

      expect(debtButton).toHaveClass('bg-red-500');
    });
  });

  describe('Form Input', () => {
    it('should update amount when typing', () => {
      act(() => {
        render(<AddTransactionModal {...defaultProps} open={true} />);
      });

      const amountInput = document.getElementById('amount') as HTMLInputElement;
      fireEvent.change(amountInput, { target: { value: '150.50' } });

      expect(amountInput).toHaveValue(150.50);
    });

    it('should update note when typing', () => {
      act(() => {
        render(<AddTransactionModal {...defaultProps} open={true} />);
      });

      const noteInput = document.getElementById('note') as HTMLInputElement;
      fireEvent.change(noteInput, { target: { value: 'Monthly payment' } });

      expect(noteInput).toHaveValue('Monthly payment');
    });

    it('should have correct input types', () => {
      act(() => {
        render(<AddTransactionModal {...defaultProps} open={true} />);
      });

      const amountInput = document.getElementById('amount') as HTMLInputElement;
      expect(amountInput).toHaveAttribute('type', 'number');
      expect(amountInput).toHaveAttribute('step', '0.01');
    });
  });

  describe('Form Validation', () => {
    it('should show error when submitting without customer', () => {
      act(() => {
        render(<AddTransactionModal {...defaultProps} open={true} />);
      });

      const amountInput = document.getElementById('amount') as HTMLInputElement;
      fireEvent.change(amountInput, { target: { value: '100' } });

      const submitButton = screen.getByRole('button', { name: /submit/i });
      fireEvent.click(submitButton);

      expect(toast.error).toHaveBeenCalled();
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should show error when submitting without amount', () => {
      act(() => {
        render(<AddTransactionModal {...defaultProps} open={true} />);
      });

      const submitButton = screen.getByRole('button', { name: /submit/i });
      fireEvent.click(submitButton);

      expect(toast.error).toHaveBeenCalled();
    });

    it('should show error for invalid amount (zero)', () => {
      act(() => {
        render(<AddTransactionModal {...defaultProps} open={true} />);
      });

      const amountInput = document.getElementById('amount') as HTMLInputElement;
      fireEvent.change(amountInput, { target: { value: '0' } });

      const submitButton = screen.getByRole('button', { name: /submit/i });
      fireEvent.click(submitButton);

      expect(toast.error).toHaveBeenCalled();
    });
  });

  describe('Cancel Action', () => {
    it('should not call onSave when modal is open', () => {
      act(() => {
        render(<AddTransactionModal {...defaultProps} open={true} />);
      });

      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have dialog role', () => {
      act(() => {
        render(<AddTransactionModal {...defaultProps} open={true} />);
      });

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should have input elements for form fields', () => {
      act(() => {
        render(<AddTransactionModal {...defaultProps} open={true} />);
      });

      // Check for form elements
      const amountInput = document.getElementById('amount');
      const noteInput = document.getElementById('note');

      expect(amountInput).toBeInTheDocument();
      expect(noteInput).toBeInTheDocument();

      // Check for customer select (combobox role)
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
  });

  describe('Preselected Customer', () => {
    it('should accept preselectedCustomer prop', () => {
      const { container } = render(
        <AddTransactionModal
          {...defaultProps}
          open={true}
          preselectedCustomer={{ id: 'customer-1', name: 'John Doe' }}
        />
      );

      // Component should render without error
      expect(container).toBeInTheDocument();
    });
  });

  describe('Modal State', () => {
    it('should accept open prop changes', () => {
      const { rerender } = render(
        <AddTransactionModal {...defaultProps} open={false} />
      );

      // Modal not visible initially
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      // Open modal
      rerender(<AddTransactionModal {...defaultProps} open={true} />);

      // Modal should be visible
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});
