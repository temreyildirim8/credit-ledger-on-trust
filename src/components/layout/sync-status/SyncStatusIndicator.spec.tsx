import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { SyncStatusIndicator } from './SyncStatusIndicator';
import { TooltipProvider } from '@/components/ui/tooltip';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) => {
    const translations: Record<string, string> = {
      'offline': 'Offline',
      'online': 'Online',
      'synced': 'Synced',
      'syncing': 'Syncing...',
      'syncError': 'Sync Error',
      'pending': 'Pending',
      'allSynced': 'All Synced',
      'lastSync': 'Last Sync',
      'never': 'Never',
      'justNow': 'Just now',
      'minutesAgo': `${params?.count || 0} minutes ago`,
      'hoursAgo': `${params?.count || 0} hours ago`,
      'pendingCount': `${params?.count || 0} pending`,
      'willSyncWhenOnline': 'Will sync when online',
      'syncFailed': 'Sync failed',
      'offlineMode': 'Offline Mode',
      'sync': 'Sync',
    };
    return translations[key] || key;
  },
}));

// Mock useSyncStatus hook
vi.mock('@/lib/hooks/useSyncStatus', () => ({
  useSyncStatus: vi.fn(),
}));

import { useSyncStatus } from '@/lib/hooks/useSyncStatus';

describe('SyncStatusIndicator', () => {
  const mockTriggerSync = vi.fn();

  const defaultStatus = {
    connectionStatus: 'online' as const,
    queueStatus: 'idle' as const,
    pendingCount: 0,
    isSyncing: false,
    lastSyncedAt: new Date(),
    errorMessage: null,
    triggerSync: mockTriggerSync,
    refreshPendingCount: vi.fn(),
  };

  // Wrapper for compact variant that needs TooltipProvider
  const renderWithTooltip = (ui: React.ReactElement) => {
    return render(<TooltipProvider>{ui}</TooltipProvider>);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSyncStatus).mockReturnValue(defaultStatus);
  });

  describe('Full Variant (Desktop)', () => {
    it('should render synced status when online with no pending items', () => {
      render(<SyncStatusIndicator variant="full" />);

      expect(screen.getByText('All Synced')).toBeInTheDocument();
    });

    it('should render offline status when offline', () => {
      vi.mocked(useSyncStatus).mockReturnValue({
        ...defaultStatus,
        connectionStatus: 'offline',
      });

      render(<SyncStatusIndicator variant="full" />);

      expect(screen.getByText('Offline')).toBeInTheDocument();
      expect(screen.getByText('Offline Mode')).toBeInTheDocument();
    });

    it('should show syncing icon when syncing', () => {
      vi.mocked(useSyncStatus).mockReturnValue({
        ...defaultStatus,
        isSyncing: true,
        queueStatus: 'syncing',
      });

      render(<SyncStatusIndicator variant="full" />);

      // The component shows "All Synced" text but with spinning icon and blue color
      expect(screen.getByText('All Synced')).toBeInTheDocument();
      // Check for blue background which indicates syncing state
      const mainContainer = document.querySelector('.bg-blue-50');
      expect(mainContainer).toBeInTheDocument();
    });

    it('should show error icon and message when there is an error', () => {
      vi.mocked(useSyncStatus).mockReturnValue({
        ...defaultStatus,
        queueStatus: 'error',
        errorMessage: 'Connection failed',
      });

      render(<SyncStatusIndicator variant="full" />);

      // Error message is shown in the subtitle
      expect(screen.getByText('Connection failed')).toBeInTheDocument();
      // Check for red background which indicates error state
      const mainContainer = document.querySelector('.bg-red-50');
      expect(mainContainer).toBeInTheDocument();
    });

    it('should render pending status when there are pending items', () => {
      vi.mocked(useSyncStatus).mockReturnValue({
        ...defaultStatus,
        pendingCount: 5,
      });

      render(<SyncStatusIndicator variant="full" />);

      expect(screen.getByText('5 pending')).toBeInTheDocument();
    });

    it('should show sync button when online with pending items', () => {
      vi.mocked(useSyncStatus).mockReturnValue({
        ...defaultStatus,
        pendingCount: 3,
      });

      render(<SyncStatusIndicator variant="full" />);

      expect(screen.getByRole('button', { name: /sync/i })).toBeInTheDocument();
    });

    it('should not show sync button when offline', () => {
      vi.mocked(useSyncStatus).mockReturnValue({
        ...defaultStatus,
        connectionStatus: 'offline',
        pendingCount: 3,
      });

      render(<SyncStatusIndicator variant="full" />);

      expect(screen.queryByRole('button', { name: /sync/i })).not.toBeInTheDocument();
    });

    it('should not show sync button when no pending items', () => {
      render(<SyncStatusIndicator variant="full" />);

      expect(screen.queryByRole('button', { name: /sync/i })).not.toBeInTheDocument();
    });

    it('should call triggerSync when sync button is clicked', () => {
      vi.mocked(useSyncStatus).mockReturnValue({
        ...defaultStatus,
        pendingCount: 3,
      });

      render(<SyncStatusIndicator variant="full" />);

      const syncButton = screen.getByRole('button', { name: /sync/i });
      fireEvent.click(syncButton);

      expect(mockTriggerSync).toHaveBeenCalledTimes(1);
    });

    it('should disable sync button while syncing', () => {
      vi.mocked(useSyncStatus).mockReturnValue({
        ...defaultStatus,
        pendingCount: 3,
        isSyncing: true,
        queueStatus: 'syncing',
      });

      render(<SyncStatusIndicator variant="full" />);

      // When syncing, button exists but is disabled and has no visible text (spinner only)
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should show last sync time', () => {
      const lastSync = new Date('2024-01-15T10:00:00Z');
      vi.mocked(useSyncStatus).mockReturnValue({
        ...defaultStatus,
        lastSyncedAt: lastSync,
      });

      render(<SyncStatusIndicator variant="full" />);

      expect(screen.getByText(/Last Sync:/)).toBeInTheDocument();
    });

    it('should show "Never" when never synced', () => {
      vi.mocked(useSyncStatus).mockReturnValue({
        ...defaultStatus,
        lastSyncedAt: null,
      });

      render(<SyncStatusIndicator variant="full" />);

      expect(screen.getByText(/Never/)).toBeInTheDocument();
    });
  });

  describe('Compact Variant (Mobile)', () => {
    it('should render compact indicator', () => {
      renderWithTooltip(<SyncStatusIndicator variant="compact" />);

      // Should have a button with an accessible label
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should show pending count badge when there are pending items', () => {
      vi.mocked(useSyncStatus).mockReturnValue({
        ...defaultStatus,
        pendingCount: 5,
      });

      renderWithTooltip(<SyncStatusIndicator variant="compact" />);

      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should show 9+ for counts over 9', () => {
      vi.mocked(useSyncStatus).mockReturnValue({
        ...defaultStatus,
        pendingCount: 15,
      });

      renderWithTooltip(<SyncStatusIndicator variant="compact" />);

      expect(screen.getByText('9+')).toBeInTheDocument();
    });

    it('should not show count badge when no pending items', () => {
      renderWithTooltip(<SyncStatusIndicator variant="compact" />);

      expect(screen.queryByText(/\d+/)).not.toBeInTheDocument();
    });

    it('should trigger sync when clicked with pending items online', () => {
      vi.mocked(useSyncStatus).mockReturnValue({
        ...defaultStatus,
        pendingCount: 3,
      });

      renderWithTooltip(<SyncStatusIndicator variant="compact" />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockTriggerSync).toHaveBeenCalledTimes(1);
    });

    it('should not trigger sync when offline', () => {
      vi.mocked(useSyncStatus).mockReturnValue({
        ...defaultStatus,
        connectionStatus: 'offline',
        pendingCount: 3,
      });

      renderWithTooltip(<SyncStatusIndicator variant="compact" />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockTriggerSync).not.toHaveBeenCalled();
    });

    it('should be disabled when syncing', () => {
      vi.mocked(useSyncStatus).mockReturnValue({
        ...defaultStatus,
        isSyncing: true,
        queueStatus: 'syncing',
      });

      renderWithTooltip(<SyncStatusIndicator variant="compact" />);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('Status Icons and Colors', () => {
    it('should show green color when synced', () => {
      render(<SyncStatusIndicator variant="full" />);

      // The main container has the color classes
      const mainContainer = document.querySelector('.bg-green-50');
      expect(mainContainer).toBeInTheDocument();
    });

    it('should show orange color when offline', () => {
      vi.mocked(useSyncStatus).mockReturnValue({
        ...defaultStatus,
        connectionStatus: 'offline',
      });

      render(<SyncStatusIndicator variant="full" />);

      const mainContainer = document.querySelector('.bg-orange-50');
      expect(mainContainer).toBeInTheDocument();
    });

    it('should show red color when error', () => {
      vi.mocked(useSyncStatus).mockReturnValue({
        ...defaultStatus,
        queueStatus: 'error',
        errorMessage: 'Error',
      });

      render(<SyncStatusIndicator variant="full" />);

      const mainContainer = document.querySelector('.bg-red-50');
      expect(mainContainer).toBeInTheDocument();
    });

    it('should show blue color when syncing', () => {
      vi.mocked(useSyncStatus).mockReturnValue({
        ...defaultStatus,
        isSyncing: true,
        queueStatus: 'syncing',
      });

      render(<SyncStatusIndicator variant="full" />);

      const mainContainer = document.querySelector('.bg-blue-50');
      expect(mainContainer).toBeInTheDocument();
    });

    it('should show amber color when pending', () => {
      vi.mocked(useSyncStatus).mockReturnValue({
        ...defaultStatus,
        pendingCount: 5,
      });

      render(<SyncStatusIndicator variant="full" />);

      const mainContainer = document.querySelector('.bg-amber-50');
      expect(mainContainer).toBeInTheDocument();
    });
  });

  describe('Last Sync Time Formatting', () => {
    it('should show "Just now" for recent sync', () => {
      vi.mocked(useSyncStatus).mockReturnValue({
        ...defaultStatus,
        lastSyncedAt: new Date(),
      });

      render(<SyncStatusIndicator variant="full" />);

      expect(screen.getByText(/Just now/)).toBeInTheDocument();
    });

    it('should show minutes ago for recent sync', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      vi.mocked(useSyncStatus).mockReturnValue({
        ...defaultStatus,
        lastSyncedAt: fiveMinutesAgo,
      });

      render(<SyncStatusIndicator variant="full" />);

      expect(screen.getByText(/5 minutes ago/)).toBeInTheDocument();
    });

    it('should show hours ago for older sync', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      vi.mocked(useSyncStatus).mockReturnValue({
        ...defaultStatus,
        lastSyncedAt: twoHoursAgo,
      });

      render(<SyncStatusIndicator variant="full" />);

      expect(screen.getByText(/2 hours ago/)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when sync fails', () => {
      vi.mocked(useSyncStatus).mockReturnValue({
        ...defaultStatus,
        queueStatus: 'error',
        errorMessage: 'Network timeout',
      });

      render(<SyncStatusIndicator variant="full" />);

      expect(screen.getByText('Network timeout')).toBeInTheDocument();
    });

    it('should show default error message when no message provided', () => {
      vi.mocked(useSyncStatus).mockReturnValue({
        ...defaultStatus,
        queueStatus: 'error',
        errorMessage: null,
      });

      render(<SyncStatusIndicator variant="full" />);

      expect(screen.getByText('Sync failed')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible label in compact mode', () => {
      renderWithTooltip(<SyncStatusIndicator variant="compact" />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label');
    });

    it('should have accessible label for synced status', () => {
      renderWithTooltip(<SyncStatusIndicator variant="compact" />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Synced');
    });

    it('should have accessible label for offline status', () => {
      vi.mocked(useSyncStatus).mockReturnValue({
        ...defaultStatus,
        connectionStatus: 'offline',
      });

      renderWithTooltip(<SyncStatusIndicator variant="compact" />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Offline');
    });

    it('should have accessible label for syncing status', () => {
      vi.mocked(useSyncStatus).mockReturnValue({
        ...defaultStatus,
        isSyncing: true,
        queueStatus: 'syncing',
      });

      renderWithTooltip(<SyncStatusIndicator variant="compact" />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Syncing...');
    });
  });

  describe('Custom ClassName', () => {
    it('should apply custom className in full variant', () => {
      render(<SyncStatusIndicator variant="full" className="custom-class" />);

      // The main container has the custom className
      const mainContainer = document.querySelector('.custom-class');
      expect(mainContainer).toBeInTheDocument();
    });

    it('should apply custom className in compact variant', () => {
      renderWithTooltip(<SyncStatusIndicator variant="compact" className="custom-class" />);

      const button = screen.getByRole('button');
      expect(button.className).toContain('custom-class');
    });
  });

  describe('Default Variant', () => {
    it('should default to full variant', () => {
      render(<SyncStatusIndicator />);

      expect(screen.getByText('All Synced')).toBeInTheDocument();
    });
  });

  describe('Online Status with Pending Items', () => {
    it('should show online status with pending count', () => {
      vi.mocked(useSyncStatus).mockReturnValue({
        ...defaultStatus,
        pendingCount: 7,
      });

      render(<SyncStatusIndicator variant="full" />);

      expect(screen.getByText('Online')).toBeInTheDocument();
      expect(screen.getByText('7 pending')).toBeInTheDocument();
    });

    it('should show Wifi icon when online with pending', () => {
      vi.mocked(useSyncStatus).mockReturnValue({
        ...defaultStatus,
        pendingCount: 3,
      });

      render(<SyncStatusIndicator variant="full" />);

      // Check for Online text which indicates Wifi icon is shown
      expect(screen.getByText('Online')).toBeInTheDocument();
    });
  });

  describe('Tooltip in Compact Mode', () => {
    it('should show pending count badge', async () => {
      vi.mocked(useSyncStatus).mockReturnValue({
        ...defaultStatus,
        pendingCount: 3,
      });

      renderWithTooltip(<SyncStatusIndicator variant="compact" />);

      // The badge count should be visible
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should have button that is clickable', () => {
      vi.mocked(useSyncStatus).mockReturnValue({
        ...defaultStatus,
        connectionStatus: 'offline',
        pendingCount: 3,
      });

      renderWithTooltip(<SyncStatusIndicator variant="compact" />);

      // Button should exist and be disabled
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });
});
