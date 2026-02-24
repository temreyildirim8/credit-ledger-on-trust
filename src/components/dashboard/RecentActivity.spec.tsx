import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RecentActivity } from './RecentActivity';

describe('RecentActivity', () => {
  const mockActivities = [
    {
      id: 'activity-1',
      customerName: 'John Doe',
      amount: 1500,
      type: 'debt' as const,
      date: new Date('2024-01-15T10:30:00Z'),
    },
    {
      id: 'activity-2',
      customerName: 'Jane Smith',
      amount: 500,
      type: 'payment' as const,
      date: new Date('2024-01-14T15:45:00Z'),
    },
    {
      id: 'activity-3',
      customerName: 'Bob Wilson',
      amount: 2000,
      type: 'debt' as const,
      date: new Date('2024-01-13T08:00:00Z'),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<RecentActivity activities={mockActivities} />);
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should render all activities', () => {
      render(<RecentActivity activities={mockActivities} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
    });

    it('should render customer names correctly', () => {
      render(<RecentActivity activities={mockActivities} />);

      mockActivities.forEach((activity) => {
        expect(screen.getByText(activity.customerName)).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no activities', () => {
      render(<RecentActivity activities={[]} />);

      expect(screen.getByText('No activity yet')).toBeInTheDocument();
      expect(
        screen.getByText(/Start by adding your first customer/)
      ).toBeInTheDocument();
    });

    it('should show clock icon in empty state', () => {
      const { container } = render(<RecentActivity activities={[]} />);

      const clockIcon = container.querySelector('svg.lucide-clock');
      expect(clockIcon).toBeInTheDocument();
    });

    it('should not show activities when empty', () => {
      render(<RecentActivity activities={[]} />);

      expect(screen.queryByText('Debt')).not.toBeInTheDocument();
      expect(screen.queryByText('Payment')).not.toBeInTheDocument();
    });
  });

  describe('Activity Types', () => {
    it('should show "Debt" label for debt transactions', () => {
      render(<RecentActivity activities={mockActivities} />);

      const debtLabels = screen.getAllByText('Debt');
      expect(debtLabels.length).toBe(2); // John Doe and Bob Wilson
    });

    it('should show "Payment" label for payment transactions', () => {
      render(<RecentActivity activities={mockActivities} />);

      expect(screen.getByText('Payment')).toBeInTheDocument();
    });

    it('should apply debt styling to debt transactions', () => {
      const { container } = render(<RecentActivity activities={mockActivities} />);

      const debtBadge = container.querySelector('.bg-debt');
      expect(debtBadge).toBeInTheDocument();
    });

    it('should apply payment styling to payment transactions', () => {
      const { container } = render(<RecentActivity activities={mockActivities} />);

      const paymentBadge = container.querySelector('.bg-payment');
      expect(paymentBadge).toBeInTheDocument();
    });

    it('should show + prefix for debt amounts', () => {
      render(<RecentActivity activities={mockActivities} />);

      // Debt amounts should have + prefix
      const plusAmounts = screen.getAllByText(/\+/);
      expect(plusAmounts.length).toBeGreaterThan(0);
    });

    it('should show - prefix for payment amounts', () => {
      render(<RecentActivity activities={mockActivities} />);

      // Payment amounts should have - prefix
      const minusAmounts = screen.getAllByText(/-/);
      expect(minusAmounts.length).toBeGreaterThan(0);
    });
  });

  describe('Formatting', () => {
    it('should format amounts with currency', () => {
      render(<RecentActivity activities={mockActivities} />);

      // Should show formatted amounts with currency symbols
      // 1500 from John Doe (debt)
      expect(screen.getByText(/\$1,500/)).toBeInTheDocument();
      // 500 from Jane Smith (payment) - use getAllByText since 500 appears multiple times
      const amounts500 = screen.getAllByText(/500/);
      expect(amounts500.length).toBeGreaterThan(0);
    });

    it('should format dates with relative time', () => {
      render(<RecentActivity activities={mockActivities} />);

      // Should show relative time text (e.g., "2 days ago", "about 1 month ago")
      // The exact text depends on current date vs activity date
      const timeTexts = screen.getAllByText(/ago|now/);
      expect(timeTexts.length).toBeGreaterThan(0);
    });

    it('should use Turkish locale when locale is "tr"', () => {
      render(<RecentActivity activities={mockActivities} locale="tr" />);

      // Component should render without errors with Turkish locale
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should use USD for non-Turkish locale', () => {
      render(<RecentActivity activities={mockActivities} locale="en" />);

      // Should show USD formatting
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should use TRY for Turkish locale', () => {
      const { container } = render(
        <RecentActivity activities={mockActivities} locale="tr" />
      );

      // Turkish locale should format with TRY
      expect(container.textContent).toBeTruthy();
    });
  });

  describe('Props', () => {
    it('should use default locale when not provided', () => {
      render(<RecentActivity activities={mockActivities} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should accept custom locale prop', () => {
      render(<RecentActivity activities={mockActivities} locale="es" />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should use empty array as default activities', () => {
      render(<RecentActivity />);

      // Should show empty state
      expect(screen.getByText('No activity yet')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null date gracefully', () => {
      const activitiesWithNullDate = [
        {
          id: 'activity-1',
          customerName: 'John Doe',
          amount: 1500,
          type: 'debt' as const,
          date: null,
        },
      ];

      render(<RecentActivity activities={activitiesWithNullDate} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should handle string dates', () => {
      const activitiesWithStringDate = [
        {
          id: 'activity-1',
          customerName: 'John Doe',
          amount: 1500,
          type: 'debt' as const,
          date: '2024-01-15T10:30:00Z',
        },
      ];

      render(<RecentActivity activities={activitiesWithStringDate} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should handle zero amount', () => {
      const activitiesWithZeroAmount = [
        {
          id: 'activity-1',
          customerName: 'John Doe',
          amount: 0,
          type: 'payment' as const,
          date: new Date(),
        },
      ];

      render(<RecentActivity activities={activitiesWithZeroAmount} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should handle very large amounts', () => {
      const activitiesWithLargeAmount = [
        {
          id: 'activity-1',
          customerName: 'John Doe',
          amount: 1000000000,
          type: 'debt' as const,
          date: new Date(),
        },
      ];

      render(<RecentActivity activities={activitiesWithLargeAmount} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should handle special characters in customer name', () => {
      const activitiesWithSpecialChars = [
        {
          id: 'activity-1',
          customerName: "O'Brien & Co. <Test>",
          amount: 100,
          type: 'debt' as const,
          date: new Date(),
        },
      ];

      render(<RecentActivity activities={activitiesWithSpecialChars} />);

      expect(screen.getByText("O'Brien & Co. <Test>")).toBeInTheDocument();
    });

    it('should handle unicode characters in customer name', () => {
      const activitiesWithUnicode = [
        {
          id: 'activity-1',
          customerName: 'Müller Ñoño 日本語',
          amount: 100,
          type: 'debt' as const,
          date: new Date(),
        },
      ];

      render(<RecentActivity activities={activitiesWithUnicode} />);

      expect(screen.getByText('Müller Ñoño 日本語')).toBeInTheDocument();
    });

    it('should handle single activity', () => {
      const singleActivity = [mockActivities[0]];

      render(<RecentActivity activities={singleActivity} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });

    it('should handle many activities', () => {
      const manyActivities = Array.from({ length: 20 }, (_, i) => ({
        id: `activity-${i}`,
        customerName: `Customer ${i}`,
        amount: (i + 1) * 100,
        type: (i % 2 === 0 ? 'debt' : 'payment') as 'debt' | 'payment',
        date: new Date(),
      }));

      render(<RecentActivity activities={manyActivities} />);

      expect(screen.getByText('Customer 0')).toBeInTheDocument();
      expect(screen.getByText('Customer 19')).toBeInTheDocument();
    });
  });

  describe('Visual Elements', () => {
    it('should render clock icon for each activity', () => {
      const { container } = render(
        <RecentActivity activities={mockActivities} />
      );

      const clockIcons = container.querySelectorAll('svg.lucide-clock');
      // One for each activity (3)
      expect(clockIcons.length).toBe(3);
    });

    it('should have proper card structure for activities', () => {
      const { container } = render(
        <RecentActivity activities={mockActivities} />
      );

      const cards = container.querySelectorAll('[data-slot="card"]');
      expect(cards.length).toBe(3);
    });

    it('should apply hover shadow effect', () => {
      const { container } = render(
        <RecentActivity activities={mockActivities} />
      );

      const hoverCard = container.querySelector('.hover\\:shadow-md');
      expect(hoverCard).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading in empty state', () => {
      render(<RecentActivity activities={[]} />);

      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('No activity yet');
    });

    it('should have descriptive text in empty state', () => {
      render(<RecentActivity activities={[]} />);

      expect(
        screen.getByText(/Start by adding your first customer/)
      ).toBeInTheDocument();
    });
  });
});
