import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { ReactNode } from 'react';
import { AuthProvider, useAuth } from './useAuth';
import { authService } from '@/lib/services/auth.service';

// Mock the auth service
vi.mock('@/lib/services/auth.service', () => ({
  authService: {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  },
}));

// Mock user and session data
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: { name: 'Test User' },
  aud: 'authenticated',
  created_at: '2024-01-01T00:00:00Z',
};

const mockSession = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  token_type: 'bearer',
  user: mockUser,
  expires_at: 1704067200,
};

// Test component to access auth context
function TestComponent() {
  const { user, session, loading, signIn, signUp, signOut } = useAuth();
  return (
    <div>
      <span data-testid="loading">{loading.toString()}</span>
      <span data-testid="user-email">{user?.email ?? 'null'}</span>
      <span data-testid="session">{session ? 'exists' : 'null'}</span>
      <button
        data-testid="signin-btn"
        onClick={() => signIn('test@example.com', 'password').catch(() => {})}
      >
        Sign In
      </button>
      <button
        data-testid="signup-btn"
        onClick={() => signUp('test@example.com', 'password', 'Test User').catch(() => {})}
      >
        Sign Up
      </button>
      <button data-testid="signout-btn" onClick={() => signOut().catch(() => {})}>
        Sign Out
      </button>
    </div>
  );
}

// Helper to render with AuthProvider
function renderWithAuthProvider(ui: ReactNode) {
  return render(<AuthProvider>{ui}</AuthProvider>);
}

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for onAuthStateChange
    vi.mocked(authService.onAuthStateChange).mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('AuthProvider', () => {
    it('should show loading state initially', () => {
      vi.mocked(authService.getSession).mockImplementation(
        () => new Promise(() => {})
      );

      renderWithAuthProvider(<TestComponent />);

      expect(screen.getByTestId('loading').textContent).toBe('true');
    });

    it('should set loading to false after session check', async () => {
      vi.mocked(authService.getSession).mockResolvedValue(null);

      renderWithAuthProvider(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });
    });

    it('should set user and session when session exists', async () => {
      vi.mocked(authService.getSession).mockResolvedValue(mockSession);

      renderWithAuthProvider(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('user-email').textContent).toBe(
          'test@example.com'
        );
        expect(screen.getByTestId('session').textContent).toBe('exists');
      });
    });

    it('should set null user when no session exists', async () => {
      vi.mocked(authService.getSession).mockResolvedValue(null);

      renderWithAuthProvider(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('user-email').textContent).toBe('null');
        expect(screen.getByTestId('session').textContent).toBe('null');
      });
    });

    it('should handle session fetch error gracefully', async () => {
      vi.mocked(authService.getSession).mockRejectedValue(
        new Error('Session error')
      );
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      renderWithAuthProvider(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
        expect(screen.getByTestId('user-email').textContent).toBe('null');
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error initializing auth:',
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });

    it('should subscribe to auth state changes on mount', () => {
      vi.mocked(authService.getSession).mockResolvedValue(null);

      renderWithAuthProvider(<TestComponent />);

      expect(authService.onAuthStateChange).toHaveBeenCalled();
    });

    it('should unsubscribe from auth state changes on unmount', async () => {
      const mockUnsubscribe = vi.fn();
      vi.mocked(authService.onAuthStateChange).mockReturnValue({
        data: { subscription: { unsubscribe: mockUnsubscribe } },
      });
      vi.mocked(authService.getSession).mockResolvedValue(null);

      const { unmount } = renderWithAuthProvider(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('should update state on auth state change event', async () => {
      let authCallback: ((event: string, session: typeof mockSession | null) => void) | null = null;
      vi.mocked(authService.onAuthStateChange).mockImplementation(
        (callback) => {
          authCallback = callback;
          return { data: { subscription: { unsubscribe: vi.fn() } } };
        }
      );
      vi.mocked(authService.getSession).mockResolvedValue(null);

      renderWithAuthProvider(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      // Simulate auth state change
      await act(async () => {
        authCallback?.('SIGNED_IN', mockSession);
      });

      await waitFor(() => {
        expect(screen.getByTestId('user-email').textContent).toBe(
          'test@example.com'
        );
        expect(screen.getByTestId('session').textContent).toBe('exists');
      });
    });
  });

  describe('signIn', () => {
    it('should call authService.signIn with correct params', async () => {
      vi.mocked(authService.getSession).mockResolvedValue(null);
      vi.mocked(authService.signIn).mockResolvedValue({
        session: mockSession,
        user: mockUser,
      });

      renderWithAuthProvider(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      await act(async () => {
        screen.getByTestId('signin-btn').click();
      });

      expect(authService.signIn).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
      });
    });

    it('should update state after successful sign in', async () => {
      vi.mocked(authService.getSession).mockResolvedValue(null);
      vi.mocked(authService.signIn).mockResolvedValue({
        session: mockSession,
        user: mockUser,
      });

      renderWithAuthProvider(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      await act(async () => {
        screen.getByTestId('signin-btn').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('user-email').textContent).toBe(
          'test@example.com'
        );
        expect(screen.getByTestId('session').textContent).toBe('exists');
      });
    });

    it('should not update state on sign in failure', async () => {
      vi.mocked(authService.getSession).mockResolvedValue(null);
      vi.mocked(authService.signIn).mockRejectedValue(
        new Error('Invalid credentials')
      );

      renderWithAuthProvider(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      await act(async () => {
        screen.getByTestId('signin-btn').click();
        // Wait for the promise to reject
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      // Verify signIn was called but state didn't change
      expect(authService.signIn).toHaveBeenCalled();
      expect(screen.getByTestId('user-email').textContent).toBe('null');
      expect(screen.getByTestId('session').textContent).toBe('null');
    });
  });

  describe('signUp', () => {
    it('should call authService.signUp with correct params', async () => {
      vi.mocked(authService.getSession).mockResolvedValue(null);
      vi.mocked(authService.signUp).mockResolvedValue({
        session: null,
        user: null,
      });

      renderWithAuthProvider(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      await act(async () => {
        screen.getByTestId('signup-btn').click();
      });

      expect(authService.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
        name: 'Test User',
      });
    });

    it('should update state after successful sign up with session', async () => {
      vi.mocked(authService.getSession).mockResolvedValue(null);
      vi.mocked(authService.signUp).mockResolvedValue({
        session: mockSession,
        user: mockUser,
      });

      renderWithAuthProvider(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      await act(async () => {
        screen.getByTestId('signup-btn').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('user-email').textContent).toBe(
          'test@example.com'
        );
      });
    });

    it('should not update state on sign up failure', async () => {
      vi.mocked(authService.getSession).mockResolvedValue(null);
      vi.mocked(authService.signUp).mockRejectedValue(
        new Error('Email already exists')
      );

      renderWithAuthProvider(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      await act(async () => {
        screen.getByTestId('signup-btn').click();
        // Wait for the promise to reject
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      // Verify signUp was called but state didn't change
      expect(authService.signUp).toHaveBeenCalled();
      expect(screen.getByTestId('user-email').textContent).toBe('null');
    });
  });

  describe('signOut', () => {
    it('should call authService.signOut', async () => {
      vi.mocked(authService.getSession).mockResolvedValue(mockSession);
      vi.mocked(authService.signOut).mockResolvedValue(undefined);

      renderWithAuthProvider(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('user-email').textContent).toBe(
          'test@example.com'
        );
      });

      await act(async () => {
        screen.getByTestId('signout-btn').click();
      });

      expect(authService.signOut).toHaveBeenCalled();
    });

    it('should clear user and session after sign out', async () => {
      vi.mocked(authService.getSession).mockResolvedValue(mockSession);
      vi.mocked(authService.signOut).mockResolvedValue(undefined);

      renderWithAuthProvider(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('user-email').textContent).toBe(
          'test@example.com'
        );
      });

      await act(async () => {
        screen.getByTestId('signout-btn').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('user-email').textContent).toBe('null');
        expect(screen.getByTestId('session').textContent).toBe('null');
      });
    });

    it('should not clear state on sign out failure', async () => {
      vi.mocked(authService.getSession).mockResolvedValue(mockSession);
      vi.mocked(authService.signOut).mockRejectedValue(
        new Error('Sign out failed')
      );
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      renderWithAuthProvider(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('user-email').textContent).toBe(
          'test@example.com'
        );
      });

      await act(async () => {
        screen.getByTestId('signout-btn').click();
        // Wait for the promise to reject
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      // Verify signOut was called but state wasn't cleared (error was thrown)
      expect(authService.signOut).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Sign out error:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('useAuth (outside provider)', () => {
    it('should throw error when used outside AuthProvider', () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      function TestComponentOutsideProvider() {
        useAuth();
        return null;
      }

      expect(() => render(<TestComponentOutsideProvider />)).toThrow(
        'useAuth must be used within an AuthProvider'
      );

      consoleSpy.mockRestore();
    });
  });
});
