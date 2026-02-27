/**
 * Zod Validation Schemas for API Inputs
 *
 * Provides type-safe validation for all API request bodies.
 */

import { z } from "zod";

// =====================
// Customer Schemas
// =====================

export const customerCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long").trim(),
  phone: z.string().max(20, "Phone number is too long").trim().optional().nullable(),
  address: z.string().max(500, "Address is too long").trim().optional().nullable(),
  notes: z.string().max(1000, "Notes are too long").trim().optional().nullable(),
  national_id: z.string().max(50, "National ID is too long").trim().optional().nullable(),
});

export const customerUpdateSchema = z.object({
  customerId: z.string().uuid("Invalid customer ID"),
  name: z.string().min(1, "Name cannot be empty").max(100, "Name is too long").trim().optional(),
  phone: z.string().max(20, "Phone number is too long").trim().optional().nullable(),
  address: z.string().max(500, "Address is too long").trim().optional().nullable(),
  notes: z.string().max(1000, "Notes are too long").trim().optional().nullable(),
  national_id: z.string().max(50, "National ID is too long").trim().optional().nullable(),
});

export const customerDeleteSchema = z.object({
  customerId: z.string().uuid("Invalid customer ID"),
  hardDelete: z.boolean().optional().default(false),
});

// =====================
// Transaction Schemas
// =====================

export const transactionCreateSchema = z.object({
  customerId: z.string().uuid("Invalid customer ID"),
  type: z.enum(["debt", "payment"], { message: "Type must be 'debt' or 'payment'" }),
  amount: z.number().positive("Amount must be positive").max(999999999, "Amount is too large"),
  note: z.string().max(500, "Note is too long").trim().optional().nullable(),
  date: z.string().datetime({ message: "Invalid date format" }).optional(),
});

export const transactionUpdateSchema = z.object({
  transactionId: z.string().uuid("Invalid transaction ID"),
  customerId: z.string().uuid("Invalid customer ID").optional(),
  type: z.enum(["debt", "payment"], { message: "Type must be 'debt' or 'payment'" }).optional(),
  amount: z.number().positive("Amount must be positive").max(999999999, "Amount is too large").optional(),
  note: z.string().max(500, "Note is too long").trim().optional().nullable(),
  date: z.string().datetime({ message: "Invalid date format" }).optional(),
});

export const transactionDeleteSchema = z.object({
  transactionId: z.string().uuid("Invalid transaction ID"),
});

// =====================
// Export Schemas
// =====================

export const exportRequestSchema = z.object({
  format: z.enum(["csv", "pdf"], { message: "Format must be 'csv' or 'pdf'" }),
  type: z.enum(["transactions", "customers", "summary"], { message: "Type must be 'transactions', 'customers', or 'summary'" }),
  dateRange: z.object({
    start: z.string().datetime({ message: "Invalid start date" }).optional(),
    end: z.string().datetime({ message: "Invalid end date" }).optional(),
  }).optional(),
});

// =====================
// Auth Schemas
// =====================

export const loginSchema = z.object({
  email: z.string().email("Invalid email address").trim().toLowerCase(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signupSchema = z.object({
  email: z.string().email("Invalid email address").trim().toLowerCase(),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  name: z.string().min(1, "Name is required").max(100, "Name is too long").trim(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address").trim().toLowerCase(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

// =====================
// Validation Helper
// =====================

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Validate data against a Zod schema
 */
export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  // Extract first error message (Zod v4 uses .issues instead of .errors)
  const issues = result.error.issues;
  const firstError = issues[0];
  const errorMessage = firstError?.message || "Validation failed";

  return { success: false, error: errorMessage };
}

/**
 * Validate and return appropriate error response
 */
export function validateOrError<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { data: T } | { error: Response } {
  const result = validate(schema, data);

  if (result.success) {
    return { data: result.data };
  }

  return {
    error: new Response(JSON.stringify({ error: result.error }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    }),
  };
}
