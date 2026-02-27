import type {
  CustomFieldDefinition,
  CustomFieldDefinitionInput,
  CustomFieldValues,
  CustomFieldErrors,
  SelectOption,
} from "@/lib/types/custom-fields";

export const customFieldsService = {
  /**
   * Get all custom field definitions for the current user
   */
  async getFieldDefinitions(): Promise<CustomFieldDefinition[]> {
    const response = await fetch("/api/custom-fields", {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      if (response.status === 403) {
        return []; // Return empty for non-Pro users
      }
      throw new Error("Failed to fetch custom fields");
    }

    const data = await response.json();
    return data.fields || [];
  },

  /**
   * Create a new field definition
   */
  async createField(
    field: CustomFieldDefinitionInput,
  ): Promise<CustomFieldDefinition> {
    const response = await fetch("/api/custom-fields", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(field),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create field");
    }

    const data = await response.json();
    return data.field;
  },

  /**
   * Update a field definition
   */
  async updateField(
    id: string,
    field: Partial<CustomFieldDefinitionInput>,
  ): Promise<CustomFieldDefinition> {
    const response = await fetch("/api/custom-fields", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id, ...field }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update field");
    }

    const data = await response.json();
    return data.field;
  },

  /**
   * Delete a field definition
   */
  async deleteField(id: string): Promise<void> {
    const response = await fetch("/api/custom-fields", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete field");
    }
  },

  /**
   * Validate custom field values against definitions
   */
  validateFieldValues(
    definitions: CustomFieldDefinition[],
    values: CustomFieldValues,
  ): CustomFieldErrors {
    const errors: CustomFieldErrors = {};

    for (const def of definitions) {
      const value = values[def.slug];

      // Check required fields
      if (
        def.is_required &&
        (value === undefined || value === null || value === "")
      ) {
        errors[def.slug] = `${def.name} is required`;
        continue;
      }

      // Skip validation if value is empty and not required
      if (value === undefined || value === null || value === "") {
        continue;
      }

      // Type-specific validation
      switch (def.field_type) {
        case "number":
          if (isNaN(Number(value))) {
            errors[def.slug] = `${def.name} must be a number`;
          }
          break;
        case "date":
          if (isNaN(Date.parse(String(value)))) {
            errors[def.slug] = `${def.name} must be a valid date`;
          }
          break;
        case "select": {
          const validOptions = def.options.map((o) => o.value);
          if (!validOptions.includes(String(value))) {
            errors[def.slug] = `Invalid option for ${def.name}`;
          }
          break;
        }
      }
    }

    return errors;
  },

  /**
   * Generate a slug from a field name
   */
  generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/(^_|_$)/g, "");
  },
};
