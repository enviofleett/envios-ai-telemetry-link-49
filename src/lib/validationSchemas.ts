
import { z } from "zod"

// User registration schema
export const userRegistrationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
  city: z.string().min(2, "City must be at least 2 characters"),
  subscriptionPackage: z.string().min(1, "Subscription package is required"),
})

// OTP verification schema
export const otpVerificationSchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string().length(6, "OTP must be 6 digits"),
})

// Password setup schema
export const passwordSetupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export type UserRegistrationData = z.infer<typeof userRegistrationSchema>
export type OTPVerificationData = z.infer<typeof otpVerificationSchema>
export type PasswordSetupData = z.infer<typeof passwordSetupSchema>
