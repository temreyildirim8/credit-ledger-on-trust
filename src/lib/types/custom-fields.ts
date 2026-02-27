/**
 * Custom field types supported by the system
 */
export type CustomFieldType =
  | "text"
  | "number"
  | "date"
  | "select"
  | "textarea"
  | "checkbox";

/**
 * Option for select type fields
 */
export interface SelectOption {
  label: string;
  value: string;
}

/**
 * Field definition stored in custom_field_definitions table
 */
export interface CustomFieldDefinition {
  id: string;
  user_id: string;
  name: string; // Display name
  slug: string; // URL-safe identifier
  field_type: CustomFieldType;
  options: SelectOption[]; // For select fields
  is_required: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * Field definition for creating/updating
 */
export interface CustomFieldDefinitionInput {
  name: string;
  slug?: string; // Auto-generated from name if not provided
  field_type: CustomFieldType;
  options?: SelectOption[];
  is_required?: boolean;
  sort_order?: number;
}

/**
 * Custom field values stored in customers.custom_fields JSONB column
 * Key is the slug, value is the field value
 */
export type CustomFieldValues = Record<string, string | number | boolean | null>;

/**
 * Validation errors for custom fields
 */
export type CustomFieldErrors = Record<string, string>;
