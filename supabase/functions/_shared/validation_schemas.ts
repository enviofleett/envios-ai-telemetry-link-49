
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// Common validation schemas
export const usernameSchema = z.string()
  .min(3, "Username must be at least 3 characters")
  .max(50, "Username must be less than 50 characters")
  .regex(/^[a-zA-Z0-9_.-@]+$/, "Username contains invalid characters");

export const passwordSchema = z.string()
  .min(6, "Password must be at least 6 characters")
  .max(128, "Password too long");

export const emailSchema = z.string()
  .email("Invalid email format")
  .max(254, "Email too long");

export const workshopLoginSchema = z.object({
  action: z.literal("login"),
  email: emailSchema,
  password: passwordSchema,
  workshop_id: z.string().uuid("Invalid workshop ID")
});

export const gp51AuthSchema = z.object({
  action: z.enum(["test_connection", "authenticate"]),
  username: usernameSchema,
  password: passwordSchema,
  apiUrl: z.string().url().optional()
});

export const passwordSetSchema = z.object({
  username: usernameSchema,
  newPassword: passwordSchema
});

// Validation helper
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return { success: false, error: firstError.message };
    }
    return { success: false, error: "Invalid input data" };
  }
}
