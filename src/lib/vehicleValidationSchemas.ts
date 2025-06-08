
import { z } from "zod"

// Vehicle registration schema
export const vehicleRegistrationSchema = z.object({
  userId: z.string().min(1, "User selection is required"),
  plateNumber: z.string().min(1, "Plate number is required"),
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: z
    .number()
    .min(1900)
    .max(new Date().getFullYear() + 1),
  vin: z.string().min(1, "VIN is required"),
  color: z.string().min(1, "Color is required"),
  fuelType: z.string().min(1, "Fuel type is required"),
  subscriptionPackageId: z.string().min(1, "Subscription package is required"),
  gpsTypeId: z.string().min(1, "GPS type is required"),
  simNumber: z.string().min(10, "Valid SIM number is required"),
  networkProviderId: z.string().min(1, "Network provider is required"),
})

// GPS configuration schema
export const gpsConfigSchema = z.object({
  vehicleId: z.string(),
  gpsTypeId: z.string(),
  simNumber: z.string(),
  networkProviderId: z.string(),
})

// Payment schema
export const paymentSchema = z.object({
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  vehicleId: z.string().min(1, "Vehicle ID is required"),
  paymentMethod: z.string().min(1, "Payment method is required"),
})

export type VehicleRegistrationData = z.infer<typeof vehicleRegistrationSchema>
export type GPSConfigData = z.infer<typeof gpsConfigSchema>
export type PaymentData = z.infer<typeof paymentSchema>
