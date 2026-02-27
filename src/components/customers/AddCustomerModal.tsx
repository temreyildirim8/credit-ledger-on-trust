"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useSubscription } from "@/lib/hooks/useSubscription";
import { useUserProfile } from "@/lib/hooks/useUserProfile";
import { UpgradePrompt } from "@/components/subscription/UpgradePrompt";
import { PhoneInput, PhoneInputValue } from "@/components/ui/phone-input";

/**
 * AddCustomerModal — adds a new customer
 * national_id is optional (National ID / TCKN)
 */

interface AddCustomerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (customer: {
    national_id?: string;
    name: string;
    phone?: string;
    address?: string;
    notes?: string;
  }) => Promise<unknown>;
  currentCustomerCount?: number;
  /** @deprecated Now uses useSubscription hook internally */
  isPaidPlan?: boolean;
}

interface FormErrors {
  nationalId?: string;
  name?: string;
  phone?: string;
}

export function AddCustomerModal({
  open,
  onOpenChange,
  onSave,
  currentCustomerCount = 0,
  isPaidPlan: isPaidPlanProp,
}: AddCustomerModalProps) {
  const t = useTranslations("customers.form");
  const tCommon = useTranslations("common");
  const tCustomers = useTranslations("customers");
  const { isPaidPlan, customerLimit } = useSubscription();
  const { currency } = useUserProfile();

  const [nationalId, setNationalId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<{
    nationalId: boolean;
    name: boolean;
    phone: boolean;
  }>({ nationalId: false, name: false, phone: false });

  // Use prop if provided (for backward compatibility), otherwise use hook value
  const effectiveIsPaidPlan = isPaidPlanProp ?? isPaidPlan;

  // Check if customer limit is reached for free tier
  // customerLimit can be null for unlimited plans
  const isAtLimit =
    !effectiveIsPaidPlan &&
    customerLimit !== null &&
    currentCustomerCount >= customerLimit;

  // Reset form when modal opens (NOT pre-fill customId)
  useEffect(() => {
    if (open) {
      setNationalId("");
      setName("");
      setPhone("");
      setAddress("");
      setNotes("");
      setErrors({});
      setTouched({ nationalId: false, name: false, phone: false });
    }
  }, [open]);

  // nationalId is optional — just validate format if provided
  const validateNationalId = (value: string): string | undefined => {
    if (!value.trim()) return undefined;
    if (value.trim().length > 50) {
      return (
        tCustomers.raw("validation.idTooLong") ||
        "ID must be less than 50 characters"
      );
    }
    return undefined;
  };

  const validateName = (value: string): string | undefined => {
    if (!value.trim()) {
      return tCommon("required");
    }
    if (value.trim().length < 2) {
      return (
        tCustomers.raw("validation.nameTooShort") ||
        "Name must be at least 2 characters"
      );
    }
    if (value.trim().length > 100) {
      return (
        tCustomers.raw("validation.nameTooLong") ||
        "Name must be less than 100 characters"
      );
    }
    return undefined;
  };

  const validatePhone = (value: string): string | undefined => {
    if (!value.trim()) return undefined; // Phone is optional
    const phoneRegex = /^[+\d][\d\s\-()]{6,20}$/;
    if (!phoneRegex.test(value.trim())) {
      return (
        tCustomers.raw("validation.invalidPhone") ||
        "Please enter a valid phone number"
      );
    }
    return undefined;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {
      nationalId: validateNationalId(nationalId),
      name: validateName(name),
      phone: validatePhone(phone),
    };
    setErrors(newErrors);
    return !newErrors.nationalId && !newErrors.name && !newErrors.phone;
  };

  const handleNationalIdChange = (value: string) => {
    setNationalId(value);
    if (touched.nationalId) {
      setErrors((prev) => ({ ...prev, nationalId: validateNationalId(value) }));
    }
  };

  const handleNationalIdBlur = () => {
    setTouched((prev) => ({ ...prev, nationalId: true }));
    setErrors((prev) => ({
      ...prev,
      nationalId: validateNationalId(nationalId),
    }));
  };

  const handleNameBlur = () => {
    setTouched((prev) => ({ ...prev, name: true }));
    setErrors((prev) => ({ ...prev, name: validateName(name) }));
  };

  const handlePhoneBlur = () => {
    setTouched((prev) => ({ ...prev, phone: true }));
    setErrors((prev) => ({ ...prev, phone: validatePhone(phone) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setTouched({ nationalId: true, name: true, phone: true });

    if (isAtLimit) {
      toast.error(tCustomers("paywall.limitReached"));
      return;
    }

    if (!validateForm()) {
      toast.error(
        tCustomers.raw("validation.fixErrors") ||
          "Please fix the errors in the form",
      );
      return;
    }

    setLoading(true);
    try {
      await onSave({
        national_id: nationalId.trim() || undefined,
        name: name.trim(),
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      toast.success(tCustomers("success"));
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(message || tCustomers("error"));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setNationalId("");
      setName("");
      setPhone("");
      setAddress("");
      setNotes("");
      setErrors({});
      setTouched({ nationalId: false, name: false, phone: false });
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>{tCustomers("title")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Paywall warning */}
            {isAtLimit && (
              <UpgradePrompt
                variant="card"
                feature={tCustomers("paywall.limitReached")}
                message={tCustomers("paywall.upgradeMessage")}
                size="sm"
                className="mb-4"
              />
            )}

            {/* Customer count indicator */}
            {!effectiveIsPaidPlan && (
              <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
                <span>
                  {tCustomers("paywall.customersUsed", {
                    count: currentCustomerCount,
                  })}
                </span>
                <span
                  className={
                    customerLimit !== null &&
                    currentCustomerCount >= customerLimit
                      ? "text-orange-500 font-medium"
                      : ""
                  }
                >
                  {customerLimit ?? "∞"} {tCustomers("paywall.limit")}
                </span>
              </div>
            )}

            {/* National ID field — optional */}
            <div className="space-y-2">
              <Label
                htmlFor="nationalId"
                className={
                  errors.nationalId && touched.nationalId
                    ? "text-destructive"
                    : ""
                }
              >
                {t("customId")}
                <span className="ml-1 text-xs text-[var(--color-text-secondary)] font-normal">
                  {t("customIdOptional")}
                </span>
              </Label>
              <Input
                id="nationalId"
                value={nationalId}
                onChange={(e) => handleNationalIdChange(e.target.value)}
                onBlur={handleNationalIdBlur}
                placeholder={t("customIdPlaceholder")}
                disabled={loading}
                className={
                  errors.nationalId && touched.nationalId
                    ? "border-destructive focus-visible:ring-destructive"
                    : ""
                }
              />
              {errors.nationalId && touched.nationalId && (
                <p className="text-xs text-destructive">{errors.nationalId}</p>
              )}
            </div>

            {/* Name field */}
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className={
                  errors.name && touched.name ? "text-destructive" : ""
                }
              >
                {t("name")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (touched.name) {
                    setErrors((prev) => ({
                      ...prev,
                      name: validateName(e.target.value),
                    }));
                  }
                }}
                onBlur={handleNameBlur}
                placeholder={t("namePlaceholder")}
                disabled={loading}
                className={
                  errors.name && touched.name
                    ? "border-destructive focus-visible:ring-destructive"
                    : ""
                }
              />
              {errors.name && touched.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>

            {/* Phone field */}
            <div className="space-y-2">
              <Label
                htmlFor="phone"
                className={
                  errors.phone && touched.phone ? "text-destructive" : ""
                }
              >
                {t("phone")}
              </Label>
              <PhoneInput
                id="phone"
                value={phone}
                onChange={(value: PhoneInputValue) => {
                  setPhone(value.formatted);
                  if (touched.phone) {
                    setErrors((prev) => ({
                      ...prev,
                      phone: validatePhone(value.formatted),
                    }));
                  }
                }}
                onBlur={handlePhoneBlur}
                currencyCode={currency}
                placeholder={t("phonePlaceholder")}
                disabled={loading}
                error={!!(errors.phone && touched.phone)}
                ariaLabel={t("phone")}
              />
              {errors.phone && touched.phone && (
                <p className="text-xs text-destructive">{errors.phone}</p>
              )}
            </div>

            {/* Address field */}
            <div className="space-y-2">
              <Label htmlFor="address">{t("address")}</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={t("addressPlaceholder")}
                disabled={loading}
              />
            </div>

            {/* Notes field */}
            <div className="space-y-2">
              <Label htmlFor="notes">{t("notes")}</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("notesPlaceholder") || t("addressPlaceholder")}
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
              {tCommon("cancel")}
            </Button>
            <Button type="submit" disabled={loading || isAtLimit}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
