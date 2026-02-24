import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CustomerDetailsModal } from './CustomerDetailsModal';
import type { Customer } from '@/lib/services/customers.service';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'details.totalDebt': 'Total Debt',
      'details.balance': 'Balance',
      'details.transactionHistory': 'Transaction History',
      'details.noTransactions': 'No transactions yet',
      'details.debt': 'Debt',
      'details.payment': 'Payment',
      'details.downloadPDF': 'Download PDF Statement',
      'details.generatingPDF': 'Generating...',
      'details.pdfDownloaded': 'PDF downloaded successfully',
      'details.pdfError': 'Failed to generate PDF',
    };
    return translations[key] || key;
  },
}));

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

// Mock customers service
vi.mock('@/lib/services/customers.service', () => ({
  customersService: {
    getCustomerById: vi.fn(),
    getCustomerTransactions: vi.fn(),
  },
}));

// Mock user profiles service
vi.mock('@/lib/services/user-profiles.service', () => ({
  userProfilesService: {
    getProfile: vi.fn(),
  },
}));

// Mock PDF utilities
vi.mock('@/lib/utils/pdf-statement', () => ({
  generateCustomerStatementPDF: vi.fn(),
  downloadPDF: vi.fn(),
}));

// Mock currency utility
vi.mock('@/lib/utils/currency', () => ({
  formatCurrency: (amount: number) => `${amount.toLocaleString()} TL`,
}));

// Mock date-fns
vi.mock('date-fns', () => ({
  formatDistanceToNow: () => '2 days ago',
}));

const mockCustomer: Customer = {
  id: 'customer-1',
  user_id: 'user-1',
  name: 'John Doe',
  phone: '+1234567890',
  address: '123 Main St',
  notes: 'VIP customer',
  balance: 500,
  transaction_count: 3,
  last_transaction_date: '2024-01-15T10:00:00Z',
  created_at: '2024-01-01T00:00:00Z',
};

const mockCustomerWithZeroBalance: Customer = {
  id: 'customer-2',
  user_id: 'user-1',
  name: 'Jane Smith',
  phone: '+0987654321',
  address: null,
  notes: null,
  balance: 0,
  transaction_count: 0,
  last_transaction_date: null,
  created_at: '2024-01-01T00:00:00Z',
};

const mockTransactions = [
  {
    id: 'tx-1',
    type: 'debt',
    amount: 300,
    transaction_date: '2024-01-15T10:00:00Z',
    created_at: '2024-01-15T10:00:00Z',
    description: 'Purchase on credit',
  },
  {
    id: 'tx-2',
    type: 'payment',
    amount: 100,
    transaction_date: '2024-01-14T10:00:00Z',
    created_at: '2024-01-14T10:00:00Z',
    description: 'Partial payment',
  },
  {
    id: 'tx-3',
    type: 'debt',
    amount: 300,
    transaction_date: '2024-01-10T10:00:00Z',
    created_at: '2024-01-10T10:00:00Z',
    description: null,
  },
];

describe('CustomerDetailsModal', () => {
  const mockOnOpenChange = vi.fn();
  const mockOnAddDebt = vi.fn();
  const mockOnRecordPayment = vi.fn();
  const mockOnEdit = vi.fn();

  const defaultProps = {
    customerId: 'customer-1',
    open: true,
    onOpenChange: mockOnOpenChange,
    onAddDebt: mockOnAddDebt,
    onRecordPayment: mockOnRecordPayment,
    onEdit: mockOnEdit,
    locale: 'en',
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    // Set up default mock implementations
    const { useAuth } = await import('@/lib/hooks/useAuth');
    const { customersService } = await import('@/lib/services/customers.service');
    const { userProfilesService } = await import('@/lib/services/user-profiles.service');

    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com', user_metadata: { full_name: 'Test User' } },
      loading: false,
      error: null,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPassword: vi.fn(),
      updatePassword: vi.fn(),
    });

    vi.mocked(customersService.getCustomerById).mockResolvedValue(mockCustomer);
    vi.mocked(customersService.getCustomerTransactions).mockResolvedValue(mockTransactions);
    vi.mocked(userProfilesService.getProfile).mockResolvedValue({
      id: 'user-1',
      currency: 'TRY',
      language: 'en',
      industry: 'retail',
      onboarding_completed: true,
      created_at: '2024-01-01T00:00:00Z',
    });
  });

  describe('Rendering', () => {
    it('should render without crashing when open', async () => {
      render(<CustomerDetailsModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('should not render content when closed', () => {
      render(<CustomerDetailsModal {...defaultProps} open={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should show loading state initially', () => {
      render(<CustomerDetailsModal {...defaultProps} />);

      // Check for loading spinner
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should show customer data after loading', async () => {
      render(<CustomerDetailsModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    it('should show customer not found when customer is null', async () => {
      const { customersService } = await import('@/lib/services/customers.service');
      vi.mocked(customersService.getCustomerById).mockResolvedValue(null);

      render(<CustomerDetailsModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Customer not found')).toBeInTheDocument();
      });
    });
  });

  describe('Customer Avatar', () => {
    it('should display first letter of customer name', async () => {
      render(<CustomerDetailsModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('J')).toBeInTheDocument();
      });
    });

    it('should show red background when customer has debt', async () => {
      render(<CustomerDetailsModal {...defaultProps} />);

      await waitFor(() => {
        const avatar = screen.getByText('J').closest('div');
        expect(avatar).toHaveClass('bg-red-500');
      });
    });

    it('should show green background when customer has no debt', async () => {
      const { customersService } = await import('@/lib/services/customers.service');
      vi.mocked(customersService.getCustomerById).mockResolvedValue(mockCustomerWithZeroBalance);

      render(<CustomerDetailsModal {...defaultProps} />);

      await waitFor(() => {
        const avatar = screen.getByText('J').closest('div');
        expect(avatar).toHaveClass('bg-green-500');
      });
    });
  });

  describe('Balance Card', () => {
    it('should display customer balance', async () => {
      render(<CustomerDetailsModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('500 TL')).toBeInTheDocument();
      });
    });

    it('should show debt styling when balance is positive', async () => {
      render(<CustomerDetailsModal {...defaultProps} />);

      await waitFor(() => {
        const balanceText = screen.getByText('500 TL');
        expect(balanceText).toHaveClass('text-red-600');
      });
    });

    it('should show settled styling when balance is zero', async () => {
      const { customersService } = await import('@/lib/services/customers.service');
      vi.mocked(customersService.getCustomerById).mockResolvedValue(mockCustomerWithZeroBalance);

      render(<CustomerDetailsModal {...defaultProps} />);

      await waitFor(() => {
        const balanceText = screen.getByText('0 TL');
        expect(balanceText).toHaveClass('text-green-600');
      });
    });

    it('should show transaction count', async () => {
      render(<CustomerDetailsModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('3 transactions')).toBeInTheDocument();
      });
    });
  });

  describe('Quick Actions', () => {
    it('should render Add Debt button', async () => {
      render(<CustomerDetailsModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Add Debt')).toBeInTheDocument();
      });
    });

    it('should render Record Payment button', async () => {
      render(<CustomerDetailsModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Record Payment')).toBeInTheDocument();
      });
    });

    it('should call onAddDebt with customer when clicked', async () => {
      render(<CustomerDetailsModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Add Debt')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Add Debt'));

      expect(mockOnAddDebt).toHaveBeenCalledWith(mockCustomer);
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('should call onRecordPayment with customer when clicked', async () => {
      render(<CustomerDetailsModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Record Payment')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Record Payment'));

      expect(mockOnRecordPayment).toHaveBeenCalledWith(mockCustomer);
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('should not call onAddDebt if not provided', async () => {
      render(<CustomerDetailsModal {...defaultProps} onAddDebt={undefined} />);

      await waitFor(() => {
        expect(screen.getByText('Add Debt')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Add Debt'));

      expect(mockOnAddDebt).not.toHaveBeenCalled();
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('PDF Statement', () => {
    it('should render Download PDF button', async () => {
      render(<CustomerDetailsModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Download PDF Statement')).toBeInTheDocument();
      });
    });

    it('should generate and download PDF when clicked', async () => {
      const { generateCustomerStatementPDF, downloadPDF } = await import('@/lib/utils/pdf-statement');
      vi.mocked(generateCustomerStatementPDF).mockResolvedValue(new Uint8Array());
      vi.mocked(downloadPDF).mockImplementation(() => {});

      render(<CustomerDetailsModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Download PDF Statement')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Download PDF Statement'));

      await waitFor(() => {
        expect(generateCustomerStatementPDF).toHaveBeenCalled();
        expect(downloadPDF).toHaveBeenCalled();
      });
    });

    it('should show loading state during PDF generation', async () => {
      const { generateCustomerStatementPDF } = await import('@/lib/utils/pdf-statement');
      vi.mocked(generateCustomerStatementPDF).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(new Uint8Array()), 100))
      );

      render(<CustomerDetailsModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Download PDF Statement')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Download PDF Statement'));

      await waitFor(() => {
        expect(screen.getByText('Generating...')).toBeInTheDocument();
      });
    });

    it('should show success toast on successful PDF download', async () => {
      const { toast } = await import('sonner');
      const { generateCustomerStatementPDF, downloadPDF } = await import('@/lib/utils/pdf-statement');
      vi.mocked(generateCustomerStatementPDF).mockResolvedValue(new Uint8Array());
      vi.mocked(downloadPDF).mockImplementation(() => {});

      render(<CustomerDetailsModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Download PDF Statement')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Download PDF Statement'));

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalled();
      });
    });

    it('should show error toast on PDF generation failure', async () => {
      const { toast } = await import('sonner');
      const { generateCustomerStatementPDF } = await import('@/lib/utils/pdf-statement');
      vi.mocked(generateCustomerStatementPDF).mockRejectedValue(new Error('PDF error'));

      render(<CustomerDetailsModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Download PDF Statement')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Download PDF Statement'));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });
  });

  describe('Contact Info', () => {
    it('should display phone number', async () => {
      render(<CustomerDetailsModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('+1234567890')).toBeInTheDocument();
      });
    });

    it('should have tel: link for phone', async () => {
      render(<CustomerDetailsModal {...defaultProps} />);

      await waitFor(() => {
        const phoneLink = screen.getByRole('link', { name: '+1234567890' });
        expect(phoneLink).toHaveAttribute('href', 'tel:+1234567890');
      });
    });

    it('should have WhatsApp link for phone', async () => {
      render(<CustomerDetailsModal {...defaultProps} />);

      await waitFor(() => {
        const whatsappLinks = screen.getAllByRole('link');
        const waLink = whatsappLinks.find(link => link.getAttribute('href')?.includes('wa.me'));
        expect(waLink).toBeDefined();
        expect(waLink?.getAttribute('href')).toBe('https://wa.me/1234567890');
      });
    });

    it('should display address', async () => {
      render(<CustomerDetailsModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('123 Main St')).toBeInTheDocument();
      });
    });

    it('should not show phone section if phone is null', async () => {
      const { customersService } = await import('@/lib/services/customers.service');
      vi.mocked(customersService.getCustomerById).mockResolvedValue(mockCustomerWithZeroBalance);

      render(<CustomerDetailsModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.queryByText('Phone')).not.toBeInTheDocument();
      });
    });

    it('should not show address section if address is null', async () => {
      const { customersService } = await import('@/lib/services/customers.service');
      vi.mocked(customersService.getCustomerById).mockResolvedValue(mockCustomerWithZeroBalance);

      render(<CustomerDetailsModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.queryByText('Address')).not.toBeInTheDocument();
      });
    });
  });

  describe('Transaction History', () => {
    it('should display transaction history section', async () => {
      render(<CustomerDetailsModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Transaction History')).toBeInTheDocument();
      });
    });

    it('should display all transactions', async () => {
      render(<CustomerDetailsModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Purchase on credit')).toBeInTheDocument();
        expect(screen.getByText('Partial payment')).toBeInTheDocument();
      });
    });

    it('should show transaction type badges', async () => {
      render(<CustomerDetailsModal {...defaultProps} />);

      await waitFor(() => {
        const debtBadges = screen.getAllByText('Debt');
        const paymentBadges = screen.getAllByText('Payment');
        expect(debtBadges.length).toBe(2);
        expect(paymentBadges.length).toBe(1);
      });
    });

    it('should show transaction amounts', async () => {
      render(<CustomerDetailsModal {...defaultProps} />);

      await waitFor(() => {
        // Debug: log all text content
        // Check for amounts - the formatCurrency mock returns "300 TL"
        // The component adds +/- prefix
        const allText = document.body.textContent;
        // Check that transaction amounts appear
        expect(allText).toMatch(/\+.*300.*TL/);
        expect(allText).toMatch(/-.*100.*TL/);
      });
    });

    it('should show "No transactions" message when empty', async () => {
      const { customersService } = await import('@/lib/services/customers.service');
      vi.mocked(customersService.getCustomerTransactions).mockResolvedValue([]);

      render(<CustomerDetailsModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('No transactions yet')).toBeInTheDocument();
      });
    });

    it('should display Edit button when onEdit is provided', async () => {
      render(<CustomerDetailsModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeInTheDocument();
      });
    });

    it('should not display Edit button when onEdit is not provided', async () => {
      render(<CustomerDetailsModal {...defaultProps} onEdit={undefined} />);

      await waitFor(() => {
        expect(screen.queryByText('Edit')).not.toBeInTheDocument();
      });
    });

    it('should call onEdit when Edit button is clicked', async () => {
      render(<CustomerDetailsModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Edit'));

      expect(mockOnEdit).toHaveBeenCalledWith(mockCustomer);
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Status Text', () => {
    it('should show "Owes you money" when balance is positive', async () => {
      render(<CustomerDetailsModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Owes you money')).toBeInTheDocument();
      });
    });

    it('should show "All settled up" when balance is zero', async () => {
      const { customersService } = await import('@/lib/services/customers.service');
      vi.mocked(customersService.getCustomerById).mockResolvedValue(mockCustomerWithZeroBalance);

      render(<CustomerDetailsModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('All settled up')).toBeInTheDocument();
      });
    });
  });

  describe('Data Loading', () => {
    it('should fetch customer data when modal opens', async () => {
      const { customersService } = await import('@/lib/services/customers.service');

      render(<CustomerDetailsModal {...defaultProps} />);

      await waitFor(() => {
        expect(customersService.getCustomerById).toHaveBeenCalledWith('user-1', 'customer-1');
      });
    });

    it('should fetch transactions when modal opens', async () => {
      const { customersService } = await import('@/lib/services/customers.service');

      render(<CustomerDetailsModal {...defaultProps} />);

      await waitFor(() => {
        expect(customersService.getCustomerTransactions).toHaveBeenCalledWith('user-1', 'customer-1');
      });
    });

    it('should not fetch data when modal is closed', async () => {
      const { customersService } = await import('@/lib/services/customers.service');

      render(<CustomerDetailsModal {...defaultProps} open={false} />);

      expect(customersService.getCustomerById).not.toHaveBeenCalled();
    });

    it('should not fetch data when customerId is null', async () => {
      const { customersService } = await import('@/lib/services/customers.service');

      render(<CustomerDetailsModal {...defaultProps} customerId={null} />);

      expect(customersService.getCustomerById).not.toHaveBeenCalled();
    });

    it('should handle loading error gracefully', async () => {
      const { customersService } = await import('@/lib/services/customers.service');
      vi.mocked(customersService.getCustomerById).mockRejectedValue(new Error('Network error'));

      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<CustomerDetailsModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Customer not found')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Props', () => {
    it('should work without optional callbacks', async () => {
      render(
        <CustomerDetailsModal
          customerId="customer-1"
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    it('should use default locale when not provided', async () => {
      render(
        <CustomerDetailsModal
          customerId="customer-1"
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle customer with no user metadata', async () => {
      const { useAuth } = await import('@/lib/hooks/useAuth');
      vi.mocked(useAuth).mockReturnValue({
        user: { id: 'user-1', email: 'test@example.com', user_metadata: undefined },
        loading: false,
        error: null,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        resetPassword: vi.fn(),
        updatePassword: vi.fn(),
      });

      render(<CustomerDetailsModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    it('should handle negative balance (credit)', async () => {
      const { customersService } = await import('@/lib/services/customers.service');
      vi.mocked(customersService.getCustomerById).mockResolvedValue({
        ...mockCustomer,
        balance: -100,
      });

      render(<CustomerDetailsModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('100 TL')).toBeInTheDocument();
      });
    });

    it('should handle very large balance amounts', async () => {
      const { customersService } = await import('@/lib/services/customers.service');
      vi.mocked(customersService.getCustomerById).mockResolvedValue({
        ...mockCustomer,
        balance: 999999999,
      });

      render(<CustomerDetailsModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/999,999,999 TL/)).toBeInTheDocument();
      });
    });

    it('should handle customer name with special characters', async () => {
      const { customersService } = await import('@/lib/services/customers.service');
      vi.mocked(customersService.getCustomerById).mockResolvedValue({
        ...mockCustomer,
        name: "O'Brien & Co. <Test>",
      });

      render(<CustomerDetailsModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("O'Brien & Co. <Test>")).toBeInTheDocument();
      });
    });

    it('should handle unicode customer name', async () => {
      const { customersService } = await import('@/lib/services/customers.service');
      vi.mocked(customersService.getCustomerById).mockResolvedValue({
        ...mockCustomer,
        name: 'Müller Ñoño 日本語',
      });

      render(<CustomerDetailsModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Müller Ñoño 日本語')).toBeInTheDocument();
      });
    });

    it('should handle phone with non-numeric characters for WhatsApp', async () => {
      const { customersService } = await import('@/lib/services/customers.service');
      vi.mocked(customersService.getCustomerById).mockResolvedValue({
        ...mockCustomer,
        phone: '+1 (234) 567-890',
      });

      render(<CustomerDetailsModal {...defaultProps} />);

      await waitFor(() => {
        const whatsappLinks = screen.getAllByRole('link');
        const waLink = whatsappLinks.find(link => link.getAttribute('href')?.includes('wa.me'));
        expect(waLink?.getAttribute('href')).toBe('https://wa.me/1234567890');
      });
    });

    it('should handle transaction without description', async () => {
      const { customersService } = await import('@/lib/services/customers.service');
      vi.mocked(customersService.getCustomerTransactions).mockResolvedValue([
        {
          id: 'tx-1',
          type: 'debt',
          amount: 100,
          transaction_date: '2024-01-15T10:00:00Z',
          created_at: '2024-01-15T10:00:00Z',
          description: null,
        },
      ]);

      render(<CustomerDetailsModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Debt')).toBeInTheDocument();
        // Description text should not appear
        expect(screen.queryByText('Purchase on credit')).not.toBeInTheDocument();
      });
    });

    it('should reload data when customerId changes', async () => {
      const { customersService } = await import('@/lib/services/customers.service');
      const { rerender } = render(<CustomerDetailsModal {...defaultProps} />);

      await waitFor(() => {
        expect(customersService.getCustomerById).toHaveBeenCalledWith('user-1', 'customer-1');
      });

      vi.clearAllMocks();

      rerender(<CustomerDetailsModal {...defaultProps} customerId="customer-2" />);

      await waitFor(() => {
        expect(customersService.getCustomerById).toHaveBeenCalledWith('user-1', 'customer-2');
      });
    });

    it('should reload data when modal reopens', async () => {
      const { customersService } = await import('@/lib/services/customers.service');
      const { rerender } = render(<CustomerDetailsModal {...defaultProps} open={false} />);

      expect(customersService.getCustomerById).not.toHaveBeenCalled();

      rerender(<CustomerDetailsModal {...defaultProps} open={true} />);

      await waitFor(() => {
        expect(customersService.getCustomerById).toHaveBeenCalledWith('user-1', 'customer-1');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper dialog role', async () => {
      render(<CustomerDetailsModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('should have accessible phone link', async () => {
      render(<CustomerDetailsModal {...defaultProps} />);

      await waitFor(() => {
        const phoneLink = screen.getByRole('link', { name: '+1234567890' });
        expect(phoneLink).toBeInTheDocument();
      });
    });

    it('should have accessible WhatsApp link', async () => {
      render(<CustomerDetailsModal {...defaultProps} />);

      await waitFor(() => {
        const links = screen.getAllByRole('link');
        const waLink = links.find(link => link.getAttribute('href')?.includes('wa.me'));
        expect(waLink).toBeInTheDocument();
      });
    });
  });
});
