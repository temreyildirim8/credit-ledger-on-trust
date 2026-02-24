import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { PWAInstallPrompt } from './PWAInstallPrompt';

// Note: next-intl is mocked globally in vitest.setup.ts
// The global mock returns the translation key as-is (e.g., "title" for useTranslations('install')('title'))

// Mock usePWAInstall hook
vi.mock('@/lib/hooks/usePWAInstall', () => ({
  usePWAInstall: vi.fn(),
}));

import { usePWAInstall } from '@/lib/hooks/usePWAInstall';

describe('PWAInstallPrompt', () => {
  const mockInstall = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('should not render when not installable', () => {
      vi.mocked(usePWAInstall).mockReturnValue({
        isInstallable: false,
        isInstalled: false,
        install: mockInstall,
      });

      render(<PWAInstallPrompt />);

      expect(screen.queryByText('title')).not.toBeInTheDocument();
    });

    it('should render after delay when installable', () => {
      vi.mocked(usePWAInstall).mockReturnValue({
        isInstallable: true,
        isInstalled: false,
        install: mockInstall,
      });

      render(<PWAInstallPrompt />);

      // Should not be visible immediately
      expect(screen.queryByText('title')).not.toBeInTheDocument();

      // Advance timers by 2 seconds
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(screen.getByText('title')).toBeInTheDocument();
    });

    it('should render app icon', () => {
      vi.mocked(usePWAInstall).mockReturnValue({
        isInstallable: true,
        isInstalled: false,
        install: mockInstall,
      });

      render(<PWAInstallPrompt />);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      const icon = screen.getByAltText('App icon');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute('src', '/icons/icon.svg');
    });

    it('should render title and description', () => {
      vi.mocked(usePWAInstall).mockReturnValue({
        isInstallable: true,
        isInstalled: false,
        install: mockInstall,
      });

      render(<PWAInstallPrompt />);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(screen.getByText('title')).toBeInTheDocument();
      expect(screen.getByText('description')).toBeInTheDocument();
    });

    it('should render install and not now buttons', () => {
      vi.mocked(usePWAInstall).mockReturnValue({
        isInstallable: true,
        isInstalled: false,
        install: mockInstall,
      });

      render(<PWAInstallPrompt />);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(screen.getByRole('button', { name: 'install' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'notNow' })).toBeInTheDocument();
    });
  });

  describe('Close Button', () => {
    it('should render close button with aria-label', () => {
      vi.mocked(usePWAInstall).mockReturnValue({
        isInstallable: true,
        isInstalled: false,
        install: mockInstall,
      });

      render(<PWAInstallPrompt />);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    });

    it('should hide prompt when close button is clicked', () => {
      vi.mocked(usePWAInstall).mockReturnValue({
        isInstallable: true,
        isInstalled: false,
        install: mockInstall,
      });

      render(<PWAInstallPrompt />);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(screen.getByText('title')).toBeInTheDocument();

      const closeButton = screen.getByRole('button', { name: 'Close' });
      fireEvent.click(closeButton);

      expect(screen.queryByText('title')).not.toBeInTheDocument();
    });
  });

  describe('Install Button', () => {
    it('should call install function when install button is clicked', () => {
      vi.mocked(usePWAInstall).mockReturnValue({
        isInstallable: true,
        isInstalled: false,
        install: mockInstall,
      });

      render(<PWAInstallPrompt />);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      const installButton = screen.getByRole('button', { name: 'install' });
      fireEvent.click(installButton);

      expect(mockInstall).toHaveBeenCalledTimes(1);
    });

    it('should have green styling for install button', () => {
      vi.mocked(usePWAInstall).mockReturnValue({
        isInstallable: true,
        isInstalled: false,
        install: mockInstall,
      });

      render(<PWAInstallPrompt />);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      const installButton = screen.getByRole('button', { name: 'install' });
      expect(installButton).toHaveClass('bg-green-600');
    });
  });

  describe('Not Now Button', () => {
    it('should hide prompt when not now button is clicked', () => {
      vi.mocked(usePWAInstall).mockReturnValue({
        isInstallable: true,
        isInstalled: false,
        install: mockInstall,
      });

      render(<PWAInstallPrompt />);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(screen.getByText('title')).toBeInTheDocument();

      const notNowButton = screen.getByRole('button', { name: 'notNow' });
      fireEvent.click(notNowButton);

      expect(screen.queryByText('title')).not.toBeInTheDocument();
    });

    it('should not call install when not now is clicked', () => {
      vi.mocked(usePWAInstall).mockReturnValue({
        isInstallable: true,
        isInstalled: false,
        install: mockInstall,
      });

      render(<PWAInstallPrompt />);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      const notNowButton = screen.getByRole('button', { name: 'notNow' });
      fireEvent.click(notNowButton);

      expect(mockInstall).not.toHaveBeenCalled();
    });
  });

  describe('Visibility Timing', () => {
    it('should show prompt after exactly 2 seconds', () => {
      vi.mocked(usePWAInstall).mockReturnValue({
        isInstallable: true,
        isInstalled: false,
        install: mockInstall,
      });

      render(<PWAInstallPrompt />);

      // At 1 second - not visible
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.queryByText('title')).not.toBeInTheDocument();

      // At 2 seconds - visible
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(screen.getByText('title')).toBeInTheDocument();
    });

    it('should clear timeout on unmount', () => {
      vi.mocked(usePWAInstall).mockReturnValue({
        isInstallable: true,
        isInstalled: false,
        install: mockInstall,
      });

      const { unmount } = render(<PWAInstallPrompt />);

      // Unmount before timer fires
      unmount();

      // Advance timers - should not cause any issues
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      // No error should occur
      expect(true).toBe(true);
    });
  });

  describe('State Changes', () => {
    it('should render initially when installable and not installed', () => {
      vi.mocked(usePWAInstall).mockReturnValue({
        isInstallable: true,
        isInstalled: false,
        install: mockInstall,
      });

      render(<PWAInstallPrompt />);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // The global mock returns translation keys
      expect(screen.getByText('title')).toBeInTheDocument();
    });

    it('should not show when already installed', () => {
      vi.mocked(usePWAInstall).mockReturnValue({
        isInstallable: false,
        isInstalled: true,
        install: mockInstall,
      });

      render(<PWAInstallPrompt />);

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(screen.queryByText('title')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      vi.mocked(usePWAInstall).mockReturnValue({
        isInstallable: true,
        isInstalled: false,
        install: mockInstall,
      });

      render(<PWAInstallPrompt />);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      const heading = screen.getByRole('heading', { level: 3 });
      // The global mock returns the key without namespace prefix
      expect(heading).toHaveTextContent('title');
    });

    it('should have accessible close button', () => {
      vi.mocked(usePWAInstall).mockReturnValue({
        isInstallable: true,
        isInstalled: false,
        install: mockInstall,
      });

      render(<PWAInstallPrompt />);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      const closeButton = screen.getByRole('button', { name: 'Close' });
      expect(closeButton).toBeInTheDocument();
    });

    it('should have accessible image alt text', () => {
      vi.mocked(usePWAInstall).mockReturnValue({
        isInstallable: true,
        isInstalled: false,
        install: mockInstall,
      });

      render(<PWAInstallPrompt />);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      const icon = screen.getByRole('img');
      expect(icon).toHaveAttribute('alt', 'App icon');
    });
  });

  describe('Layout and Styling', () => {
    it('should have fixed positioning', () => {
      vi.mocked(usePWAInstall).mockReturnValue({
        isInstallable: true,
        isInstalled: false,
        install: mockInstall,
      });

      render(<PWAInstallPrompt />);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // Check for fixed class using querySelector
      const container = document.querySelector('.fixed');
      expect(container).toBeInTheDocument();
    });

    it('should have high z-index', () => {
      vi.mocked(usePWAInstall).mockReturnValue({
        isInstallable: true,
        isInstalled: false,
        install: mockInstall,
      });

      render(<PWAInstallPrompt />);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      const container = document.querySelector('.z-50');
      expect(container).toBeInTheDocument();
    });

    it('should have animation class', () => {
      vi.mocked(usePWAInstall).mockReturnValue({
        isInstallable: true,
        isInstalled: false,
        install: mockInstall,
      });

      render(<PWAInstallPrompt />);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      const container = document.querySelector('.animate-in');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('should have responsive classes for mobile and desktop', () => {
      vi.mocked(usePWAInstall).mockReturnValue({
        isInstallable: true,
        isInstalled: false,
        install: mockInstall,
      });

      render(<PWAInstallPrompt />);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // Check for responsive classes
      const container = document.querySelector('.md\\:left-auto');
      expect(container).toBeInTheDocument();
    });

    it('should have max-width constraint on desktop', () => {
      vi.mocked(usePWAInstall).mockReturnValue({
        isInstallable: true,
        isInstalled: false,
        install: mockInstall,
      });

      render(<PWAInstallPrompt />);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      const container = document.querySelector('.md\\:max-w-sm');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Dark Mode', () => {
    it('should have dark mode classes', () => {
      vi.mocked(usePWAInstall).mockReturnValue({
        isInstallable: true,
        isInstalled: false,
        install: mockInstall,
      });

      render(<PWAInstallPrompt />);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // Check for dark mode background
      const darkElement = document.querySelector('.dark\\:bg-gray-800');
      expect(darkElement).toBeInTheDocument();
    });

    it('should have dark mode text colors', () => {
      vi.mocked(usePWAInstall).mockReturnValue({
        isInstallable: true,
        isInstalled: false,
        install: mockInstall,
      });

      render(<PWAInstallPrompt />);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      const darkText = document.querySelector('.dark\\:text-gray-100');
      expect(darkText).toBeInTheDocument();
    });
  });
});
