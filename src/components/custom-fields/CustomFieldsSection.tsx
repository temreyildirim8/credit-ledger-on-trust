"use client";

import { useTranslations } from "next-intl";
import { useCustomFields } from "@/lib/hooks/useCustomFields";
import { CustomFieldInput } from "./CustomFieldInput";
import type { CustomFieldValues, CustomFieldErrors } from "@/lib/types/custom-fields";

interface CustomFieldsSectionProps {
  values: CustomFieldValues;
  onChange: (values: CustomFieldValues) => void;
  errors?: CustomFieldErrors;
  disabled?: boolean;
}

export function CustomFieldsSection({
  values,
  onChange,
  errors = {},
  disabled,
}: CustomFieldsSectionProps) {
  const t = useTranslations("customers.customFields");
  const { definitions, loading, canUseCustomFields } = useCustomFields();

  // Don't render anything if loading or user doesn't have access
  if (loading || !canUseCustomFields || definitions.length === 0) {
    return null;
  }

  const handleFieldChange = (
    slug: string,
    value: string | number | boolean | null,
  ) => {
    const newValues = { ...values };

    if (value === null || value === "") {
      // Remove the field if value is empty
      delete newValues[slug];
    } else {
      newValues[slug] = value;
    }

    onChange(newValues);
  };

  return (
    <div className="space-y-4 pt-4 border-t">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-medium text-[var(--color-text-secondary)]">
          {t("sectionTitle")}
        </h3>
      </div>
      <div className="grid gap-4">
        {definitions.map((definition) => (
          <CustomFieldInput
            key={definition.id}
            definition={definition}
            value={values[definition.slug]}
            onChange={handleFieldChange}
            error={errors[definition.slug]}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
}
