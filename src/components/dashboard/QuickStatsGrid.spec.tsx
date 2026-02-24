import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QuickStatsGrid } from './QuickStatsGrid';

describe('QuickStatsGrid', () => {
  const defaultProps = {
    totalDebt: 10000,
    totalCollected: 5000,
    activeCustomers: 15,
    thisMonth: 2500,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<QuickStatsGrid {...defaultProps} />);
      expect(screen.getByText('Total Owed')).toBeInTheDocument();
    });

    it('should render all four stat cards', () => {
      render(<QuickStatsGrid {...defaultProps} />);

      expect(screen.getByText('Total Owed')).toBeInTheDocument();
      expect(screen.getByText('Collected')).toBeInTheDocument();
      expect(screen.getByText('Active Customers')).toBeInTheDocument();
      expect(screen.getByText('This Month')).toBeInTheDocument();
    });

    it('should render formatted total debt value', () => {
      render(<QuickStatsGrid {...defaultProps} />);
      // The component uses Intl.NumberFormat with tr-TR locale and TRY currency
      expect(screen.getByText('₺10.000')).toBeInTheDocument();
    });

    it('should render formatted total collected value', () => {
      render(<QuickStatsGrid {...defaultProps} />);
      expect(screen.getByText('₺5.000')).toBeInTheDocument();
    });

    it('should render active customers count', () => {
      render(<QuickStatsGrid {...defaultProps} />);
      expect(screen.getByText('15')).toBeInTheDocument();
    });

    it('should render formatted this month value', () => {
      render(<QuickStatsGrid {...defaultProps} />);
      expect(screen.getByText('₺2.500')).toBeInTheDocument();
    });
  });

  describe('Props', () => {
    it('should use default values when props not provided', () => {
      render(<QuickStatsGrid />);

      // All values should be 0 with default formatting
      const zeroValues = screen.getAllByText('₺0');
      expect(zeroValues).toHaveLength(3); // totalDebt, totalCollected, thisMonth

      expect(screen.getByText('0')).toBeInTheDocument(); // activeCustomers
    });

    it('should accept zero values explicitly', () => {
      render(
        <QuickStatsGrid
          totalDebt={0}
          totalCollected={0}
          activeCustomers={0}
          thisMonth={0}
        />
      );

      const zeroValues = screen.getAllByText('₺0');
      expect(zeroValues).toHaveLength(3);
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should handle large numbers', () => {
      render(
        <QuickStatsGrid
          totalDebt={1000000000}
          totalCollected={500000000}
          activeCustomers={9999}
          thisMonth={250000000}
        />
      );

      // Turkish locale uses dots for thousands, no decimals
      expect(screen.getByText('₺1.000.000.000')).toBeInTheDocument();
      expect(screen.getByText('₺500.000.000')).toBeInTheDocument();
      // 9999 is just a number without formatting, so it should appear as plain text
      expect(screen.getAllByText('9999').length).toBeGreaterThan(0);
      expect(screen.getByText('₺250.000.000')).toBeInTheDocument();
    });

    it('should handle decimal amounts', () => {
      render(
        <QuickStatsGrid
          totalDebt={1234.56}
          totalCollected={789.01}
          activeCustomers={5}
          thisMonth={345.67}
        />
      );

      // With minimumFractionDigits: 0 and maximumFractionDigits: 0,
      // decimals should be rounded/truncated
      expect(screen.getByText('₺1.235')).toBeInTheDocument();
      expect(screen.getByText('₺789')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('₺346')).toBeInTheDocument();
    });
  });

  describe('Visual Variants', () => {
    it('should apply debt variant styling to Total Owed card', () => {
      const { container } = render(<QuickStatsGrid {...defaultProps} />);
      // StatCard with variant="debt" should have bg-debt/10 class
      const debtCard = container.querySelector('[class*="bg-debt"]');
      expect(debtCard).toBeInTheDocument();
    });

    it('should apply collected variant styling to Collected card', () => {
      const { container } = render(<QuickStatsGrid {...defaultProps} />);
      // StatCard with variant="collected" should have bg-payment/10 class
      const collectedCard = container.querySelector('[class*="bg-payment"]');
      expect(collectedCard).toBeInTheDocument();
    });

    it('should apply customers variant styling to Active Customers card', () => {
      const { container } = render(<QuickStatsGrid {...defaultProps} />);
      // StatCard with variant="customers" should have bg-accent/10 class
      const customersCard = container.querySelector('[class*="bg-accent"]');
      expect(customersCard).toBeInTheDocument();
    });

    it('should apply month variant styling to This Month card', () => {
      const { container } = render(<QuickStatsGrid {...defaultProps} />);
      // StatCard with variant="month" should have bg-surface-alt class
      const monthCard = container.querySelector('[class*="bg-surface-alt"]');
      expect(monthCard).toBeInTheDocument();
    });
  });

  describe('Icons', () => {
    it('should render TrendingUp icon for debt card', () => {
      const { container } = render(<QuickStatsGrid {...defaultProps} />);
      // TrendingUp icon should be present
      const trendingUpIcon = container.querySelector('svg.lucide-trending-up');
      expect(trendingUpIcon).toBeInTheDocument();
    });

    it('should render TrendingDown icon for collected card', () => {
      const { container } = render(<QuickStatsGrid {...defaultProps} />);
      // TrendingDown icon should be present
      const trendingDownIcon = container.querySelector('svg.lucide-trending-down');
      expect(trendingDownIcon).toBeInTheDocument();
    });

    it('should render Users icon for customers card', () => {
      const { container } = render(<QuickStatsGrid {...defaultProps} />);
      // Users icon should be present
      const usersIcon = container.querySelector('svg.lucide-users');
      expect(usersIcon).toBeInTheDocument();
    });

    it('should render DollarSign icon for month card', () => {
      const { container } = render(<QuickStatsGrid {...defaultProps} />);
      // DollarSign icon should be present
      const dollarSignIcon = container.querySelector('svg.lucide-dollar-sign');
      expect(dollarSignIcon).toBeInTheDocument();
    });
  });

  describe('Layout', () => {
    it('should render grid with 2 columns on mobile', () => {
      const { container } = render(<QuickStatsGrid {...defaultProps} />);
      const grid = container.querySelector('.grid-cols-2');
      expect(grid).toBeInTheDocument();
    });

    it('should render grid with 4 columns on desktop (md breakpoint)', () => {
      const { container } = render(<QuickStatsGrid {...defaultProps} />);
      const grid = container.querySelector('.md\\:grid-cols-4');
      expect(grid).toBeInTheDocument();
    });

    it('should have gap-3 for spacing between cards', () => {
      const { container } = render(<QuickStatsGrid {...defaultProps} />);
      const grid = container.querySelector('.gap-3');
      expect(grid).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle negative totalDebt', () => {
      render(<QuickStatsGrid totalDebt={-1000} />);
      // Negative values should still display (note: Turkish uses minus before symbol)
      expect(screen.getByText(/-.*₺1.000|₺-1.000/)).toBeInTheDocument();
    });

    it('should handle very small amounts', () => {
      render(
        <QuickStatsGrid
          totalDebt={0.01}
          totalCollected={0.99}
          activeCustomers={1}
          thisMonth={0.5}
        />
      );

      // With fractionDigits set to 0, small values should round to 0 or 1
      expect(screen.getByText('1')).toBeInTheDocument(); // activeCustomers
    });

    it('should handle undefined props gracefully', () => {
      render(
        <QuickStatsGrid
          totalDebt={undefined}
          totalCollected={undefined}
          activeCustomers={undefined}
          thisMonth={undefined}
        />
      );

      // Should use default values of 0
      const zeroValues = screen.getAllByText('₺0');
      expect(zeroValues).toHaveLength(3);
    });
  });

  describe('Accessibility', () => {
    it('should have uppercase tracking for labels', () => {
      render(<QuickStatsGrid {...defaultProps} />);

      const labels = screen.getAllByText(/^(Total Owed|Collected|Active Customers|This Month)$/);
      labels.forEach((label) => {
        expect(label).toHaveClass('uppercase');
      });
    });

    it('should have proper text hierarchy', () => {
      render(<QuickStatsGrid {...defaultProps} />);

      // Labels should have text-xs class
      const labels = screen.getAllByText(/^(Total Owed|Collected|Active Customers|This Month)$/);
      labels.forEach((label) => {
        expect(label).toHaveClass('text-xs');
      });

      // Values should have text-2xl class
      const values = screen.getAllByText(/\d/);
      const numericValues = values.filter(
        (el) => el.className.includes('text-2xl')
      );
      expect(numericValues.length).toBeGreaterThan(0);
    });
  });
});
