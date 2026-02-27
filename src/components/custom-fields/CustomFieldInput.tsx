"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import type { CustomFieldDefinition } from "@/lib/types/custom-fields";

interface CustomFieldInputProps {
  definition: CustomFieldDefinition;
  value: string | number | boolean | null | undefined;
  onChange: (slug: string, value: string | number | boolean | null) => void;
  error?: string;
  disabled?: boolean;
}

export function CustomFieldInput({
  definition,
  value,
  onChange,
  error,
  disabled,
}: CustomFieldInputProps) {
  const inputId = `custom-field-${definition.slug}`;
  const hasError = !!error;

  const renderInput = () => {
    switch (definition.field_type) {
      case "text":
        return (
          <Input
            id={inputId}
            type="text"
            value={(value as string) ?? ""}
            onChange={(e) =>
              onChange(definition.slug, e.target.value || null)
            }
            placeholder={`Enter ${definition.name.toLowerCase()}`}
            disabled={disabled}
            className={hasError ? "border-destructive" : ""}
          />
        );

      case "number":
        return (
          <Input
            id={inputId}
            type="number"
            value={(value as number) ?? ""}
            onChange={(e) =>
              onChange(
                definition.slug,
                e.target.value ? Number(e.target.value) : null,
              )
            }
            placeholder={`Enter ${definition.name.toLowerCase()}`}
            disabled={disabled}
            className={hasError ? "border-destructive" : ""}
          />
        );

      case "date":
        return (
          <Input
            id={inputId}
            type="date"
            value={(value as string) ?? ""}
            onChange={(e) => onChange(definition.slug, e.target.value || null)}
            disabled={disabled}
            className={hasError ? "border-destructive" : ""}
          />
        );

      case "textarea":
        return (
          <Textarea
            id={inputId}
            value={(value as string) ?? ""}
            onChange={(e) =>
              onChange(definition.slug, e.target.value || null)
            }
            placeholder={`Enter ${definition.name.toLowerCase()}`}
            disabled={disabled}
            rows={3}
            className={hasError ? "border-destructive" : ""}
          />
        );

      case "select":
        return (
          <Select
            value={(value as string) ?? ""}
            onValueChange={(v) => onChange(definition.slug, v || null)}
            disabled={disabled}
          >
            <SelectTrigger className={hasError ? "border-destructive" : ""}>
              <SelectValue
                placeholder={`Select ${definition.name.toLowerCase()}`}
              />
            </SelectTrigger>
            <SelectContent>
              {definition.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "checkbox":
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={inputId}
              checked={(value as boolean) ?? false}
              onCheckedChange={(checked) =>
                onChange(definition.slug, checked as boolean)
              }
              disabled={disabled}
            />
            <label
              htmlFor={inputId}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {definition.name}
            </label>
          </div>
        );

      default:
        return null;
    }
  };

  // Checkbox renders its own label
  if (definition.field_type === "checkbox") {
    return (
      <div className="space-y-2">
        {renderInput()}
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label
        htmlFor={inputId}
        className={hasError ? "text-destructive" : ""}
      >
        {definition.name}
        {definition.is_required && (
          <span className="text-destructive ml-1">*</span>
        )}
      </Label>
      {renderInput()}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
