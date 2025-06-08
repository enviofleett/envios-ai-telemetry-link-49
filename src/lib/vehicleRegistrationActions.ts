
import { supabase } from '@/integrations/supabase/client'
import { z } from 'zod'

// Vehicle registration schema
const vehicleRegistrationSchema = z.object({
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
const gpsConfigSchema = z.object({
  vehicleId: z.string(),
  gpsTypeId: z.string(),
  simNumber: z.string(),
  networkProviderId: z.string(),
})

// Generate vehicle ID
function generateVehicleId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substr(2, 5)
  return `VH-${timestamp}${random}`.toUpperCase()
}

// Simulate SMS sending for GPS configuration
async function sendGPSConfiguration(simNumber: string, configCode: string): Promise<boolean> {
  // In a real implementation, this would:
  // 1. Connect to SMS gateway (Twilio, AWS SNS, etc.)
  // 2. Send the configuration code to the SIM number
  // 3. Return success/failure status

  console.log(`Sending GPS config to ${simNumber}: ${configCode}`)

  // Simulate network delay and 90% success rate
  await new Promise((resolve) => setTimeout(resolve, 2000))
  return Math.random() > 0.1
}

// Simulate vehicle data retrieval
async function retrieveVehicleData(vehicleId: string): Promise<{
  success: boolean
  data?: {
    location: string
    speed: number
    battery: number
    signal: number
    timestamp: string
  }
}> {
  // In a real implementation, this would:
  // 1. Connect to GPS device API
  // 2. Retrieve latest vehicle data
  // 3. Return the data or error status

  console.log(`Retrieving data for vehicle ${vehicleId}`)

  // Simulate network delay and 70% success rate
  await new Promise((resolve) => setTimeout(resolve, 3000))

  if (Math.random() > 0.3) {
    return {
      success: true,
      data: {
        location: "New York, NY",
        speed: Math.floor(Math.random() * 80),
        battery: Math.floor(Math.random() * 100),
        signal: Math.floor(Math.random() * 100),
        timestamp: new Date().toISOString(),
      },
    }
  }

  return { success: false }
}

// Register new vehicle
export async function registerVehicle(formData: FormData) {
  try {
    // Extract form data
    const rawData = {
      userId: formData.get("userId") as string,
      plateNumber: formData.get("plateNumber") as string,
      make: formData.get("make") as string,
      model: formData.get("model") as string,
      year: Number.parseInt(formData.get("year") as string),
      vin: formData.get("vin") as string,
      color: formData.get("color") as string,
      fuelType: formData.get("fuelType") as string,
      subscriptionPackageId: formData.get("subscriptionPackageId") as string,
      gpsTypeId: formData.get("gpsTypeId") as string,
      simNumber: formData.get("simNumber") as string,
      networkProviderId: formData.get("networkProviderId") as string,
    }

    // Validate data
    const validatedData = vehicleRegistrationSchema.parse(rawData)

    // Generate vehicle ID
    const vehicleId = generateVehicleId()

    // Save vehicle to database
    const { data: vehicleData, error: vehicleError } = await supabase
      .from('vehicles')
      .insert({
        device_id: vehicleId,
        device_name: `${validatedData.make} ${validatedData.model}`,
        envio_user_id: validatedData.userId,
        sim_number: validatedData.simNumber,
        is_active: true,
        gp51_metadata: {
          plate_number: validatedData.plateNumber,
          make: validatedData.make,
          model: validatedData.model,
          year: validatedData.year,
          vin: validatedData.vin,
          color: validatedData.color,
          fuel_type: validatedData.fuelType,
          subscription_package_id: validatedData.subscriptionPackageId,
          gps_type_id: validatedData.gpsTypeId,
          network_provider_id: validatedData.networkProviderId,
          registration_timestamp: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (vehicleError) {
      console.error('Vehicle registration error:', vehicleError)
      return {
        success: false,
        message: "Failed to register vehicle. Please try again.",
      }
    }

    console.log("Vehicle registered:", { vehicleId, ...validatedData })

    return {
      success: true,
      message: "Vehicle registered successfully",
      vehicleId,
      data: validatedData,
    }
  } catch (error) {
    console.error("Vehicle registration error:", error)
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: "Validation failed",
        errors: error.errors,
      }
    }
    return {
      success: false,
      message: "Failed to register vehicle. Please try again.",
    }
  }
}

// Configure GPS device
export async function configureGPS(formData: FormData) {
  try {
    const data = {
      vehicleId: formData.get("vehicleId") as string,
      gpsTypeId: formData.get("gpsTypeId") as string,
      simNumber: formData.get("simNumber") as string,
      networkProviderId: formData.get("networkProviderId") as string,
    }

    const validatedData = gpsConfigSchema.parse(data)

    // Get GPS configuration code (would come from database)
    const gpsConfigs = {
      "gps-1": "AT+GPRMC=1,30,vzwinternet,,0,0,0,0",
      "gps-2": "CONFIG:APN=vzwinternet;USER=;PASS=;INTERVAL=30",
      "gps-3": "SETUP,vzwinternet,,30,1",
    }

    const configCode = gpsConfigs[validatedData.gpsTypeId as keyof typeof gpsConfigs]

    // Send configuration to SIM
    const configSent = await sendGPSConfiguration(validatedData.simNumber, configCode)

    if (!configSent) {
      return {
        success: false,
        message: "Failed to send GPS configuration",
      }
    }

    // Update vehicle status to configuring
    await supabase
      .from('vehicles')
      .update({
        gp51_metadata: {
          ...{},
          gps_configuration_sent: true,
          gps_config_sent_at: new Date().toISOString()
        }
      })
      .eq('device_id', validatedData.vehicleId)

    return {
      success: true,
      message: "GPS configuration sent successfully",
      vehicleId: validatedData.vehicleId,
    }
  } catch (error) {
    console.error("GPS configuration error:", error)
    return {
      success: false,
      message: "Failed to configure GPS. Please try again.",
    }
  }
}

// Retrieve vehicle data
export async function getVehicleData(vehicleId: string) {
  try {
    const result = await retrieveVehicleData(vehicleId)

    if (!result.success) {
      return {
        success: false,
        message: "Failed to retrieve vehicle data. The vehicle may not be responding.",
      }
    }

    // Save the data to database and update vehicle status to active
    await supabase
      .from('vehicles')
      .update({
        last_position: {
          lat: 40.7128,
          lon: -74.0060,
          speed: result.data?.speed || 0,
          course: 0,
          updatetime: result.data?.timestamp || new Date().toISOString(),
          statusText: 'Active'
        },
        gp51_metadata: {
          ...{},
          last_data_received: result.data?.timestamp,
          vehicle_active: true
        }
      })
      .eq('device_id', vehicleId)

    return {
      success: true,
      message: "Vehicle data retrieved successfully",
      data: result.data,
    }
  } catch (error) {
    console.error("Data retrieval error:", error)
    return {
      success: false,
      message: "Failed to retrieve vehicle data. Please try again.",
    }
  }
}

// Process payment
export async function processPayment(formData: FormData) {
  try {
    const amount = Number.parseFloat(formData.get("amount") as string)
    const vehicleId = formData.get("vehicleId") as string
    const paymentMethod = formData.get("paymentMethod") as string

    // In a real implementation, you would:
    // 1. Integrate with payment processor (Stripe, PayPal, etc.)
    // 2. Process the payment
    // 3. Update subscription status
    // 4. Send receipt

    console.log(`Processing payment: $${amount} for vehicle ${vehicleId}`)

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // 95% success rate for demo
    if (Math.random() > 0.05) {
      // Update vehicle with payment info
      await supabase
        .from('vehicles')
        .update({
          gp51_metadata: {
            ...{},
            payment_processed: true,
            payment_amount: amount,
            payment_method: paymentMethod,
            payment_date: new Date().toISOString()
          }
        })
        .eq('device_id', vehicleId)

      return {
        success: true,
        message: "Payment processed successfully",
        transactionId: `TXN-${Date.now()}`,
      }
    }

    return {
      success: false,
      message: "Payment failed. Please check your payment method and try again.",
    }
  } catch (error) {
    console.error("Payment processing error:", error)
    return {
      success: false,
      message: "Payment processing failed. Please try again.",
    }
  }
}

// Get all vehicles (for table display)
export async function getVehicles(filters?: {
  search?: string
  status?: string
  userId?: string
}) {
  try {
    let query = supabase
      .from('vehicles')
      .select(`
        *,
        envio_users!vehicles_envio_user_id_fkey (
          name,
          email
        )
      `)

    // Apply filters
    if (filters?.userId) {
      query = query.eq('envio_user_id', filters.userId)
    }

    if (filters?.search) {
      const search = filters.search.toLowerCase()
      query = query.or(
        `device_id.ilike.%${search}%,device_name.ilike.%${search}%,gp51_metadata->>plate_number.ilike.%${search}%`
      )
    }

    const { data: vehicles, error } = await query
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Get vehicles error:', error)
      return {
        success: false,
        message: "Failed to retrieve vehicles",
        vehicles: [],
        total: 0,
      }
    }

    // Transform data for display
    const transformedVehicles = vehicles?.map((vehicle: any) => ({
      id: vehicle.device_id,
      userId: vehicle.envio_user_id,
      userName: vehicle.envio_users?.name || 'Unknown',
      plateNumber: vehicle.gp51_metadata?.plate_number || 'N/A',
      make: vehicle.gp51_metadata?.make || 'Unknown',
      model: vehicle.gp51_metadata?.model || 'Unknown',
      year: vehicle.gp51_metadata?.year || 'Unknown',
      status: vehicle.is_active ? 'active' : 'inactive',
      subscriptionPackage: vehicle.gp51_metadata?.subscription_package_id || 'Unknown',
      gpsType: vehicle.gp51_metadata?.gps_type_id || 'Unknown',
      networkProvider: vehicle.gp51_metadata?.network_provider_id || 'Unknown',
      lastDataReceived: vehicle.gp51_metadata?.last_data_received || vehicle.updated_at,
      location: vehicle.last_position ? 
        `${vehicle.last_position.lat?.toFixed(4)}, ${vehicle.last_position.lon?.toFixed(4)}` : 
        'Unknown',
      createdAt: vehicle.created_at,
    })) || []

    return {
      success: true,
      vehicles: transformedVehicles,
      total: transformedVehicles.length,
    }
  } catch (error) {
    console.error("Get vehicles error:", error)
    return {
      success: false,
      message: "Failed to retrieve vehicles",
      vehicles: [],
      total: 0,
    }
  }
}

export type { vehicleRegistrationSchema as VehicleRegistrationSchema }
