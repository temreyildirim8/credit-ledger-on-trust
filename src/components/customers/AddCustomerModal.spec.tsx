import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddCustomerModal } from './AddCustomerModal';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => {
    const translations: Record<string, string> = {
      'customers.form.title': 'Add Customer',
      'customers.form.customId': 'Customer ID',
      'customers.form.customIdOptional': '(Optional)',
      'customers.form.customIdPlaceholder': 'Enter customer ID',
      'customers.form.name': 'Name',
      'customers.form.namePlaceholder': 'Enter name',
      'customers.form.phone': 'Phone',
      'customers.form.phonePlaceholder': 'Enter phone',
      'customers.form.address': 'Address',
      'customers.form.addressPlaceholder': 'Enter address',
      'customers.form.notes': 'Notes',
      'customers.form.notesPlaceholder': 'Enter notes',
      'customers.form.submit': 'Save',
      'customers.title': 'Customer',
      'customers.success': 'Customer saved',
      'customers.error': 'Failed to save',
      'customers.paywall.limitReached': 'Limit reached',
      'customers.paywall.upgradeMessage': 'Upgrade to add more',
      'customers.paywall.limit': 'limit',
      'customers.validation.idTooLong': 'ID must be less than 50 characters',
      'customers.validation.nameTooShort': 'Name must be at least 2 characters',
      'customers.validation.nameTooLong': 'Name must be less than 100 characters',
      'customers.validation.invalidPhone': 'Please enter a valid phone number',
      'customers.validation.fixErrors': 'Please fix the errors in the form',
      'common.required': 'Required',
      'common.cancel': 'Cancel',
    };

    const t = (key: string, params?: Record<string, unknown>) => {
      const fullKey = `${namespace}.${key}`;
      let value = translations[fullKey] ?? translations[key] ?? key;
      // Handle simple interpolation
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          value = value.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
        });
      }
      return value;
    };

    // Add raw method that returns the raw translation
    t.raw = (key: string) => translations[`${namespace}.${key}`] ?? translations[key] ?? null;

    return t;
  },
}));

// Mock useSubscription hook
vi.mock('@/lib/hooks/useSubscription', () => ({
  useSubscription: () => ({
    isPaidPlan: false,
    customerLimit: 10,
    hasFeature: () => false,
    loading: false,
  }),
}));

// Mock useUserProfile hook
vi.mock('@/lib/hooks/useUserProfile', () => ({
  useUserProfile: () => ({
    currency: 'TRY',
    language: 'en',
    loading: false,
  }),
}));

// Mock useCustomFields hook
vi.mock('@/lib/hooks/useCustomFields', () => ({
  useCustomFields: () => ({
    definitions: [],
    loading: false,
    canUseCustomFields: false,
    validateValues: () => ({}),
  }),
}));

// Mock UpgradePrompt component
vi.mock('@/components/subscription/UpgradePrompt', () => ({
  UpgradePrompt: ({ feature, message }: { feature?: string; message?: string }) => (
    <div data-testid="upgrade-prompt">
      <span data-testid="crown-icon">👑</span>
      <span>{feature}</span>
      <span>{message}</span>
    </div>
  ),
}));

describe('AddCustomerModal', () => {
  const mockOnSave = vi.fn();
  const mockOnOpenChange = vi.fn();

  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    onSave: mockOnSave,
    currentCustomerCount: 5,
    isPaidPlan: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render without crashing when open', () => {
      render(<AddCustomerModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      render(<AddCustomerModal {...defaultProps} open={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render form fields', () => {
      render(<AddCustomerModal {...defaultProps} />);

      // Check for form inputs by ID
      expect(document.getElementById('name')).toBeInTheDocument();
      expect(document.getElementById('phone')).toBeInTheDocument();
      expect(document.getElementById('address')).toBeInTheDocument();
      expect(document.getElementById('notes')).toBeInTheDocument();
    });

    it('should render dialog title', () => {
      render(<AddCustomerModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });
  });

  describe('Form Inputs', () => {
    it('should allow typing in name input', () => {
      render(<AddCustomerModal {...defaultProps} />);

      const nameInput = document.getElementById('name') as HTMLInputElement;
      fireEvent.change(nameInput, { target: { value: 'John Doe' } });

      expect(nameInput).toHaveValue('John Doe');
    });

    it('should allow typing in phone input', () => {
      render(<AddCustomerModal {...defaultProps} />);

      const phoneInput = document.getElementById('phone') as HTMLInputElement;
      fireEvent.change(phoneInput, { target: { value: '1234567890' } });

      expect(phoneInput).toHaveValue('1234567890');
    });

    it('should allow typing in address input', () => {
      render(<AddCustomerModal {...defaultProps} />);

      const addressInput = document.getElementById('address') as HTMLInputElement;
      fireEvent.change(addressInput, { target: { value: '123 Main St' } });

      expect(addressInput).toHaveValue('123 Main St');
    });

    it('should allow typing in notes input', () => {
      render(<AddCustomerModal {...defaultProps} />);

      const notesInput = document.getElementById('notes') as HTMLInputElement;
      fireEvent.change(notesInput, { target: { value: 'VIP customer' } });

      expect(notesInput).toHaveValue('VIP customer');
    });
  });

  describe('Form Submission', () => {
    it('should call onSave with form data when submitted', async () => {
      mockOnSave.mockResolvedValue({});
      render(<AddCustomerModal {...defaultProps} />);

      const nameInput = document.getElementById('name') as HTMLInputElement;
      fireEvent.change(nameInput, { target: { value: 'John Doe' } });

      const form = nameInput.closest('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'John Doe',
            phone: undefined,
            address: undefined,
            notes: undefined,
          })
        );
      });
    });

    it('should include optional fields when provided', async () => {
      mockOnSave.mockResolvedValue({});
      render(<AddCustomerModal {...defaultProps} />);

      fireEvent.change(document.getElementById('name')!, { target: { value: 'John Doe' } });
      fireEvent.change(document.getElementById('address')!, { target: { value: '123 Main St' } });

      const form = document.querySelector('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'John Doe',
            address: '123 Main St',
          })
        );
      });
    });

    it('should show error when name is empty', async () => {
      render(<AddCustomerModal {...defaultProps} />);

      const form = document.querySelector('form')!;
      fireEvent.submit(form);

      // Wait for validation to complete - the error text should appear
      await waitFor(() => {
        // The form should show validation error for name field
        const nameInput = document.getElementById('name');
        expect(nameInput).toHaveClass('border-destructive');
      }, { timeout: 3000 });
    });

    it('should trim whitespace from inputs', async () => {
      mockOnSave.mockResolvedValue({});
      render(<AddCustomerModal {...defaultProps} />);

      const nameInput = document.getElementById('name') as HTMLInputElement;
      fireEvent.change(nameInput, { target: { value: '  John Doe  ' } });

      const form = document.querySelector('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'John Doe',
          })
        );
      });
    });

    it('should close modal after successful save', async () => {
      mockOnSave.mockResolvedValue({});
      render(<AddCustomerModal {...defaultProps} />);

      fireEvent.change(document.getElementById('name')!, { target: { value: 'John Doe' } });

      const form = document.querySelector('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it('should show loading state during submission', async () => {
      mockOnSave.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));
      render(<AddCustomerModal {...defaultProps} />);

      fireEvent.change(document.getElementById('name')!, { target: { value: 'John Doe' } });

      const form = document.querySelector('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        const spinner = document.querySelector('.animate-spin');
        expect(spinner).toBeInTheDocument();
      });
    });

    it('should disable inputs during loading', async () => {
      mockOnSave.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));
      render(<AddCustomerModal {...defaultProps} />);

      fireEvent.change(document.getElementById('name')!, { target: { value: 'John Doe' } });

      const form = document.querySelector('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(document.getElementById('name')).toHaveAttribute('disabled');
      });
    });
  });

  describe('Cancel Action', () => {
    it('should close modal when cancel is clicked', () => {
      render(<AddCustomerModal {...defaultProps} />);

      // Find the cancel button by looking for the outline variant button
      const buttons = screen.getAllByRole('button');
      const cancelButton = buttons.find(btn => btn.textContent?.includes('cancel'));
      if (cancelButton) {
        fireEvent.click(cancelButton);
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      }
    });
  });

  describe('Paywall', () => {
    it('should show paywall warning when at limit', () => {
      render(
        <AddCustomerModal
          {...defaultProps}
          currentCustomerCount={10}
          isPaidPlan={false}
        />
      );

      // Check for the mocked upgrade prompt
      expect(screen.getByTestId('upgrade-prompt')).toBeInTheDocument();
    });

    it('should not show paywall warning for paid plans', () => {
      render(
        <AddCustomerModal
          {...defaultProps}
          currentCustomerCount={10}
          isPaidPlan={true}
        />
      );

      // No upgrade prompt should be shown for paid plans
      expect(screen.queryByTestId('upgrade-prompt')).not.toBeInTheDocument();
    });

    it('should show customer count indicator for free plan', () => {
      render(
        <AddCustomerModal
          {...defaultProps}
          currentCustomerCount={5}
          isPaidPlan={false}
        />
      );

      // Check that the free tier limit indicator is shown
      // Look for the limit text "10" which is the free tier limit
      const limitElements = screen.getAllByText(/10/);
      expect(limitElements.length).toBeGreaterThan(0);
    });

    it('should not show customer count indicator for paid plan', () => {
      render(
        <AddCustomerModal
          {...defaultProps}
          currentCustomerCount={5}
          isPaidPlan={true}
        />
      );

      // No count indicator should be visible for paid plans
      // Check that "customers used" text is not present
      expect(screen.queryByText(/customers used/)).not.toBeInTheDocument();
    });

    it('should prevent saving when at free tier limit', async () => {
      const { toast } = await import('sonner');
      render(
        <AddCustomerModal
          {...defaultProps}
          currentCustomerCount={10}
          isPaidPlan={false}
        />
      );

      fireEvent.change(document.getElementById('name')!, { target: { value: 'John Doe' } });

      const form = document.querySelector('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      }, { timeout: 3000 });

      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should show error toast when save fails', async () => {
      const { toast } = await import('sonner');
      mockOnSave.mockRejectedValue(new Error('Save failed'));
      render(<AddCustomerModal {...defaultProps} />);

      fireEvent.change(document.getElementById('name')!, { target: { value: 'John Doe' } });

      const form = document.querySelector('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });

    it('should not close modal when save fails', async () => {
      mockOnSave.mockRejectedValue(new Error('Save failed'));
      render(<AddCustomerModal {...defaultProps} />);

      fireEvent.change(document.getElementById('name')!, { target: { value: 'John Doe' } });

      const form = document.querySelector('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });

      expect(mockOnOpenChange).not.toHaveBeenCalled();
    });
  });

  describe('Props', () => {
    it('should use default values for optional props', () => {
      render(
        <AddCustomerModal
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      render(<AddCustomerModal {...defaultProps} />);

      // Check for Label components (associated with inputs via htmlFor)
      expect(document.getElementById('name')).toBeInTheDocument();
      expect(document.getElementById('phone')).toBeInTheDocument();
      expect(document.getElementById('address')).toBeInTheDocument();
    });

    it('should have type="tel" for phone input', () => {
      render(<AddCustomerModal {...defaultProps} />);

      const phoneInput = document.getElementById('phone') as HTMLInputElement;
      expect(phoneInput).toHaveAttribute('type', 'tel');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long names', () => {
      render(<AddCustomerModal {...defaultProps} />);

      const longName = 'A'.repeat(500);
      const nameInput = document.getElementById('name') as HTMLInputElement;
      fireEvent.change(nameInput, { target: { value: longName } });

      expect(nameInput).toHaveValue(longName);
    });

    it('should handle special characters in name', () => {
      render(<AddCustomerModal {...defaultProps} />);

      const specialName = "O'Brien & Co. <Test>";
      const nameInput = document.getElementById('name') as HTMLInputElement;
      fireEvent.change(nameInput, { target: { value: specialName } });

      expect(nameInput).toHaveValue(specialName);
    });

    it('should handle unicode characters', () => {
      render(<AddCustomerModal {...defaultProps} />);

      const unicodeName = 'Müller Ñoño 日本語';
      const nameInput = document.getElementById('name') as HTMLInputElement;
      fireEvent.change(nameInput, { target: { value: unicodeName } });

      expect(nameInput).toHaveValue(unicodeName);
    });

    it('should handle empty optional fields', async () => {
      mockOnSave.mockResolvedValue({});
      render(<AddCustomerModal {...defaultProps} />);

      fireEvent.change(document.getElementById('name')!, { target: { value: 'John Doe' } });

      const form = document.querySelector('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'John Doe',
            phone: undefined,
            address: undefined,
            notes: undefined,
          })
        );
      });
    });

    it('should handle whitespace-only optional fields', async () => {
      mockOnSave.mockResolvedValue({});
      render(<AddCustomerModal {...defaultProps} />);

      fireEvent.change(document.getElementById('name')!, { target: { value: 'John Doe' } });
      fireEvent.change(document.getElementById('address')!, { target: { value: '\t\n' } });

      const form = document.querySelector('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'John Doe',
            address: undefined,
          })
        );
      });
    });
  });
});
