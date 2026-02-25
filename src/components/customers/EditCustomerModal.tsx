'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { Customer } from '@/lib/services/customers.service';
import { useUserProfile } from '@/lib/hooks/useUserProfile';
import { PhoneInput, PhoneInputValue } from '@/components/ui/phone-input';

interface EditCustomerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (customerId: string, customer: { name: string; phone?: string; address?: string; notes?: string }) => Promise<unknown>;
  customer: Customer | null;
}

interface FormErrors {
  name?: string;
  phone?: string;
}

export function EditCustomerModal({ open, onOpenChange, onSave, customer }: EditCustomerModalProps) {
  const t = useTranslations('customers.form');
  const tCommon = useTranslations('common');
  const tCustomers = useTranslations('customers');
  const { currency } = useUserProfile();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<{ name: boolean; phone: boolean }>({ name: false, phone: false });

  // Populate form when customer changes
  useEffect(() => {
    if (customer) {
      setName(customer.name || '');
      setPhone(customer.phone || '');
      setAddress(customer.address || '');
      setNotes(customer.notes || '');
      setErrors({});
      setTouched({ name: false, phone: false });
    }
  }, [customer]);

  // Validation functions
  const validateName = (value: string): string | undefined => {
    if (!value.trim()) {
      return tCommon('required');
    }
    if (value.trim().length < 2) {
      return tCustomers.raw('validation.nameTooShort') || 'Name must be at least 2 characters';
    }
    if (value.trim().length > 100) {
      return tCustomers.raw('validation.nameTooLong') || 'Name must be less than 100 characters';
    }
    return undefined;
  };

  const validatePhone = (value: string): string | undefined => {
    if (!value.trim()) return undefined; // Phone is optional
    // Basic phone validation - allows digits, spaces, dashes, parentheses, and +
    const phoneRegex = /^[+\d][\d\s\-()]{6,20}$/;
    if (!phoneRegex.test(value.trim())) {
      return tCustomers.raw('validation.invalidPhone') || 'Please enter a valid phone number';
    }
    return undefined;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {
      name: validateName(name),
      phone: validatePhone(phone),
    };
    setErrors(newErrors);
    return !newErrors.name && !newErrors.phone;
  };

  // Handle field blur for validation feedback
  const handleNameBlur = () => {
    setTouched(prev => ({ ...prev, name: true }));
    setErrors(prev => ({ ...prev, name: validateName(name) }));
  };

  const handlePhoneBlur = () => {
    setTouched(prev => ({ ...prev, phone: true }));
    setErrors(prev => ({ ...prev, phone: validatePhone(phone) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({ name: true, phone: true });

    if (!customer) {
      toast.error(tCustomers('error'));
      return;
    }

    // Validate form
    if (!validateForm()) {
      toast.error(tCustomers.raw('validation.fixErrors') || 'Please fix the errors in the form');
      return;
    }

    setLoading(true);
    try {
      await onSave(customer.id, {
        name: name.trim(),
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      toast.success(tCustomers('editSuccess'));
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(message || tCustomers('error'));
    } finally {
      setLoading(false);
    }
  };

  // Reset form when modal closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setErrors({});
      setTouched({ name: false, phone: false });
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t('editTitle')}</DialogTitle>
            <DialogDescription>
              {t('editDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className={errors.name && touched.name ? 'text-destructive' : ''}>
                {t('name')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (touched.name) {
                    setErrors(prev => ({ ...prev, name: validateName(e.target.value) }));
                  }
                }}
                onBlur={handleNameBlur}
                placeholder={t('namePlaceholder')}
                disabled={loading}
                className={errors.name && touched.name ? 'border-destructive focus-visible:ring-destructive' : ''}
              />
              {errors.name && touched.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone" className={errors.phone && touched.phone ? 'text-destructive' : ''}>
                {t('phone')}
              </Label>
              <PhoneInput
                id="edit-phone"
                value={phone}
                onChange={(value: PhoneInputValue) => {
                  setPhone(value.formatted);
                  if (touched.phone) {
                    setErrors(prev => ({ ...prev, phone: validatePhone(value.formatted) }));
                  }
                }}
                onBlur={handlePhoneBlur}
                currencyCode={currency}
                placeholder={t('phonePlaceholder')}
                disabled={loading}
                error={!!(errors.phone && touched.phone)}
                ariaLabel={t('phone')}
              />
              {errors.phone && touched.phone && (
                <p className="text-xs text-destructive">{errors.phone}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">{t('address')}</Label>
              <Input
                id="edit-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={t('addressPlaceholder')}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">{tCommon('optional')}</Label>
              <Input
                id="edit-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('notesPlaceholder') || t('addressPlaceholder')}
                disabled={loading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              {tCommon('cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('saveChanges')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
