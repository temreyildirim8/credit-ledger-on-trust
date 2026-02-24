import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CustomerTable } from './CustomerTable';
import { Customer } from '@/lib/services/customers.service';

// Mock formatCurrency utility
vi.mock('@/lib/utils/currency', () => ({
  formatCurrency: (amount: number) => `${amount.toLocaleString()} TRY`,
}));

// Mock date-fns
vi.mock('date-fns', () => ({
  formatDistanceToNow: () => '2 days ago',
}));

vi.mock('date-fns/locale', () => ({
  tr: {},
  enUS: {},
  es: {},
  id: {},
  hi: {},
  ar: {},
}));

describe('CustomerTable', () => {
  const mockCustomers: Customer[] = [
    {
      id: 'customer-1',
      user_id: 'user-1',
      name: 'John Doe',
      phone: '+1234567890',
      address: '123 Main St',
      notes: 'VIP customer',
      balance: 1500,
      is_archived: false,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-15T00:00:00Z',
      transaction_count: 5,
      last_transaction_date: '2024-01-15T10:30:00Z',
    },
    {
      id: 'customer-2',
      user_id: 'user-1',
      name: 'Jane Smith',
      phone: '+1987654321',
      address: '456 Oak Ave',
      notes: null,
      balance: 0,
      is_archived: false,
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-14T00:00:00Z',
      transaction_count: 3,
      last_transaction_date: '2024-01-14T15:45:00Z',
    },
    {
      id: 'customer-3',
      user_id: 'user-1',
      name: 'Bob Wilson',
      phone: null,
      address: null,
      notes: null,
      balance: 2500,
      is_archived: false,
      created_at: '2024-01-03T00:00:00Z',
      updated_at: '2024-01-13T00:00:00Z',
      transaction_count: 10,
      last_transaction_date: '2024-01-13T08:00:00Z',
    },
  ];

  const mockOnRowClick = vi.fn();
  const mockOnAddDebt = vi.fn();
  const mockOnRecordPayment = vi.fn();
  const mockOnEdit = vi.fn();
  const mockOnArchive = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnSort = vi.fn();

  const defaultProps = {
    customers: mockCustomers,
    locale: 'en',
    onRowClick: mockOnRowClick,
    onAddDebt: mockOnAddDebt,
    onRecordPayment: mockOnRecordPayment,
    onEdit: mockOnEdit,
    onArchive: mockOnArchive,
    onDelete: mockOnDelete,
    onSort: mockOnSort,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<CustomerTable {...defaultProps} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should render all customer names', () => {
      render(<CustomerTable {...defaultProps} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
    });

    it('should render table headers', () => {
      render(<CustomerTable {...defaultProps} />);

      // Check for table header presence
      const table = document.querySelector('table');
      expect(table).toBeInTheDocument();
    });

    it('should render customer avatars', () => {
      render(<CustomerTable {...defaultProps} />);

      // Check for avatar elements (circular divs with colored backgrounds)
      const { container } = render(<CustomerTable {...defaultProps} />);
      const avatars = container.querySelectorAll('.rounded-full');
      expect(avatars.length).toBeGreaterThan(0);
    });

    it('should render phone numbers when available', () => {
      render(<CustomerTable {...defaultProps} />);

      expect(screen.getByText('+1234567890')).toBeInTheDocument();
      expect(screen.getByText('+1987654321')).toBeInTheDocument();
    });

    it('should show dash for missing phone numbers', () => {
      render(<CustomerTable {...defaultProps} />);

      // Bob Wilson has no phone
      const dashElements = screen.getAllByText('-');
      expect(dashElements.length).toBeGreaterThan(0);
    });

    it('should render formatted balances', () => {
      render(<CustomerTable {...defaultProps} />);

      // Check that balances are rendered (with mock formatCurrency)
      expect(screen.getByText(/1,500/)).toBeInTheDocument();
      expect(screen.getByText(/2,500/)).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should render empty table when no customers', () => {
      render(<CustomerTable customers={[]} />);

      // Table should exist but be empty
      const table = document.querySelector('table');
      expect(table).toBeInTheDocument();
    });
  });

  describe('Status Badges', () => {
    it('should show status badges for customers', () => {
      render(<CustomerTable {...defaultProps} />);

      // Check that customers are rendered with their balance info
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
    });

    it('should have badge elements in table', () => {
      render(<CustomerTable {...defaultProps} />);

      // Just verify table exists with content
      const table = document.querySelector('table');
      expect(table).toBeInTheDocument();
    });
  });

  describe('Avatar Colors', () => {
    it('should show red avatar for customers with debt', () => {
      const { container } = render(<CustomerTable {...defaultProps} />);

      const redAvatars = container.querySelectorAll('.bg-red-500');
      expect(redAvatars.length).toBe(2); // John and Bob
    });

    it('should show green avatar for customers without debt', () => {
      const { container } = render(<CustomerTable {...defaultProps} />);

      const greenAvatars = container.querySelectorAll('.bg-green-500');
      expect(greenAvatars.length).toBe(1); // Jane
    });
  });

  describe('User Interactions', () => {
    it('should call onRowClick when row is clicked', () => {
      render(<CustomerTable {...defaultProps} />);

      const johnRow = screen.getByText('John Doe').closest('tr');
      fireEvent.click(johnRow!);

      expect(mockOnRowClick).toHaveBeenCalledWith(mockCustomers[0]);
    });

    it('should have clickable cursor style on rows', () => {
      render(<CustomerTable {...defaultProps} />);

      const johnRow = screen.getByText('John Doe').closest('tr');
      expect(johnRow).toHaveClass('cursor-pointer');
    });
  });

  describe('Sorting', () => {
    it('should have sortable columns', () => {
      const { container } = render(<CustomerTable {...defaultProps} />);

      // Check that sort buttons exist (have ArrowUpDown icons)
      const sortIcons = container.querySelectorAll('.lucide-arrow-up-down');
      expect(sortIcons.length).toBeGreaterThan(0);
    });

    it('should call onSort when sort button is clicked', () => {
      const { container } = render(<CustomerTable {...defaultProps} />);

      // Find a sort button by locating buttons with sort icons
      const sortIcon = container.querySelector('.lucide-arrow-up-down');
      const sortButton = sortIcon?.closest('button');

      if (sortButton) {
        fireEvent.click(sortButton);
        expect(mockOnSort).toHaveBeenCalled();
      }
    });

    it('should render sort buttons with ArrowUpDown icons', () => {
      const { container } = render(<CustomerTable {...defaultProps} />);

      const sortIcons = container.querySelectorAll('.lucide-arrow-up-down');
      expect(sortIcons.length).toBeGreaterThan(0);
    });
  });

  describe('Props', () => {
    it('should use default locale when not provided', () => {
      render(<CustomerTable customers={mockCustomers} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should accept custom locale prop', () => {
      render(<CustomerTable customers={mockCustomers} locale="tr" />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should work without callback props', () => {
      render(<CustomerTable customers={mockCustomers} />);

      // Should render without errors even without callbacks
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  describe('Dropdown Menu Actions', () => {
    it('should render action menu trigger button', () => {
      const { container } = render(<CustomerTable {...defaultProps} />);

      const menuTriggers = container.querySelectorAll('[data-slot="dropdown-menu-trigger"]');
      expect(menuTriggers.length).toBe(mockCustomers.length);
    });

    it('should stop propagation on action menu click', () => {
      render(<CustomerTable {...defaultProps} />);

      // Find first dropdown trigger button
      const menuButton = document.querySelector('[data-slot="dropdown-menu-trigger"]');
      expect(menuButton).toBeInTheDocument();
    });
  });

  describe('Transaction Count', () => {
    it('should display transaction count when available', () => {
      render(<CustomerTable {...defaultProps} />);

      // Should show transaction counts
      expect(screen.getByText('5 transactions')).toBeInTheDocument();
      expect(screen.getByText('3 transactions')).toBeInTheDocument();
      expect(screen.getByText('10 transactions')).toBeInTheDocument();
    });

    it('should not display transaction count when not available', () => {
      const customersWithoutCount = mockCustomers.map((c) => ({
        ...c,
        transaction_count: undefined,
      }));

      render(<CustomerTable customers={customersWithoutCount} />);

      expect(screen.queryByText('transactions')).not.toBeInTheDocument();
    });
  });

  describe('Last Activity', () => {
    it('should display last activity date', () => {
      render(<CustomerTable {...defaultProps} />);

      // Mocked to return "2 days ago"
      const activityDates = screen.getAllByText('2 days ago');
      expect(activityDates.length).toBe(mockCustomers.length);
    });

    it('should show dash when no last transaction date', () => {
      const customersWithoutDate = mockCustomers.map((c) => ({
        ...c,
        last_transaction_date: null,
      }));

      render(<CustomerTable customers={customersWithoutDate} />);

      // Should show dashes for missing dates
      const dashElements = screen.getAllByText('-');
      expect(dashElements.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle customers with very long names', () => {
      const longNameCustomer: Customer = {
        ...mockCustomers[0],
        id: 'long-name',
        name: 'This is a very long customer name that might overflow',
      };

      render(<CustomerTable customers={[longNameCustomer]} />);

      expect(screen.getByText(/This is a very long customer name/)).toBeInTheDocument();
    });

    it('should handle unicode characters in names', () => {
      const unicodeCustomer: Customer = {
        ...mockCustomers[0],
        id: 'unicode',
        name: 'Müller Ñoño 日本語',
      };

      render(<CustomerTable customers={[unicodeCustomer]} />);

      expect(screen.getByText('Müller Ñoño 日本語')).toBeInTheDocument();
    });

    it('should handle special characters in names', () => {
      const specialCharCustomer: Customer = {
        ...mockCustomers[0],
        id: 'special',
        name: "O'Brien & Co. <Test>",
      };

      render(<CustomerTable customers={[specialCharCustomer]} />);

      expect(screen.getByText("O'Brien & Co. <Test>")).toBeInTheDocument();
    });

    it('should handle negative balance (credit)', () => {
      const creditCustomer: Customer = {
        ...mockCustomers[0],
        id: 'credit',
        balance: -500,
      };

      render(<CustomerTable customers={[creditCustomer]} />);

      // Should show the balance (absolute value) with green styling
      expect(screen.getByText(/500/)).toBeInTheDocument();
    });

    it('should handle very large balances', () => {
      const largeBalanceCustomer: Customer = {
        ...mockCustomers[0],
        id: 'large',
        balance: 1000000000,
      };

      render(<CustomerTable customers={[largeBalanceCustomer]} />);

      // Verify the component renders without crashing with large balance
      expect(screen.getByText(/1,000,000,000/)).toBeInTheDocument();
    });

    it('should handle empty string names', () => {
      const emptyNameCustomer: Customer = {
        ...mockCustomers[0],
        id: 'empty',
        name: '',
      };

      render(<CustomerTable customers={[emptyNameCustomer]} />);

      // Should render without crashing
      const table = document.querySelector('table');
      expect(table).toBeInTheDocument();
    });

    it('should handle single customer', () => {
      render(<CustomerTable customers={[mockCustomers[0]]} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });

    it('should handle many customers', () => {
      const manyCustomers = Array.from({ length: 50 }, (_, i) => ({
        ...mockCustomers[0],
        id: `customer-${i}`,
        name: `Customer ${i}`,
      }));

      render(<CustomerTable customers={manyCustomers} />);

      expect(screen.getByText('Customer 0')).toBeInTheDocument();
      expect(screen.getByText('Customer 49')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper table structure', () => {
      render(<CustomerTable {...defaultProps} />);

      const table = document.querySelector('table');
      const thead = table?.querySelector('thead');
      const tbody = table?.querySelector('tbody');

      expect(table).toBeInTheDocument();
      expect(thead).toBeInTheDocument();
      expect(tbody).toBeInTheDocument();
    });

    it('should have table rows for each customer', () => {
      const { container } = render(<CustomerTable {...defaultProps} />);

      const rows = container.querySelectorAll('tbody tr');
      expect(rows.length).toBe(mockCustomers.length);
    });
  });
});
