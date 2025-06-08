
import { supabase } from '@/integrations/supabase/client'
import { userRegistrationSchema, otpVerificationSchema, passwordSetupSchema } from './validationSchemas'
import { z } from 'zod'

// Generate username from name
function generateUsername(name: string): string {
  const cleanName = name
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z]/g, "")
  const randomNum = Math.floor(Math.random() * 9000) + 1000
  return `${cleanName}_${randomNum}`
}

// Generate OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Register user
export async function registerUser(formData: FormData) {
  try {
    // Extract and validate form data
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      city: formData.get("city") as string,
      subscriptionPackage: formData.get("subscriptionPackage") as string,
    }

    // Validate data
    const validatedData = userRegistrationSchema.parse(data)

    // Generate username
    const username = generateUsername(validatedData.name)

    // Generate OTP
    const otp = generateOTP()

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('envio_users')
      .select('id')
      .eq('email', validatedData.email)
      .single()

    if (existingUser) {
      return {
        success: false,
        message: "User with this email already exists",
      }
    }

    // Create pending registration record
    const { data: registrationData, error: registrationError } = await supabase
      .from('pending_user_registrations')
      .insert({
        name: validatedData.name,
        email: validatedData.email,
        phone_number: validatedData.phone,
        city: validatedData.city,
        subscription_package: validatedData.subscriptionPackage,
        gp51_username: username,
        registration_source: 'admin_portal',
        status: 'pending_otp'
      })
      .select()
      .single()

    if (registrationError) {
      console.error('Registration error:', registrationError)
      return {
        success: false,
        message: "Failed to register user. Please try again.",
      }
    }

    // Generate and store OTP
    const { error: otpError } = await supabase
      .from('otp_verifications')
      .insert({
        email: validatedData.email,
        phone_number: validatedData.phone,
        otp_code: otp,
        otp_type: 'registration',
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
        max_attempts: 3,
        attempts_count: 0,
        is_used: false
      })

    if (otpError) {
      console.error('OTP creation error:', otpError)
      return {
        success: false,
        message: "Failed to send OTP. Please try again.",
      }
    }

    // In a real application, send OTP via email/SMS
    console.log(`OTP for ${validatedData.email}: ${otp}`)

    return {
      success: true,
      message: "User registered successfully. OTP sent to email.",
      user: {
        ...validatedData,
        username,
        id: registrationData.id,
        registrationSource: "admin_portal",
        status: "pending_otp",
        createdAt: registrationData.created_at,
      },
    }
  } catch (error) {
    console.error("Registration error:", error)
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: "Validation failed",
        errors: error.errors,
      }
    }
    return {
      success: false,
      message: "Failed to register user. Please try again.",
    }
  }
}

// Verify OTP
export async function verifyOTP(formData: FormData) {
  try {
    const data = {
      email: formData.get("email") as string,
      otp: formData.get("otp") as string,
    }

    // Validate data
    const validatedData = otpVerificationSchema.parse(data)

    // Get the latest OTP for this email
    const { data: otpRecord, error: otpError } = await supabase
      .from('otp_verifications')
      .select('*')
      .eq('email', validatedData.email)
      .eq('otp_type', 'registration')
      .eq('is_used', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (otpError || !otpRecord) {
      return {
        success: false,
        message: "No valid OTP found. Please request a new one.",
      }
    }

    // Check if OTP has expired
    if (new Date(otpRecord.expires_at) < new Date()) {
      return {
        success: false,
        message: "OTP has expired. Please request a new one.",
      }
    }

    // Check if max attempts exceeded
    if (otpRecord.attempts_count >= otpRecord.max_attempts) {
      return {
        success: false,
        message: "Maximum OTP attempts exceeded. Please request a new one.",
      }
    }

    // Verify OTP
    if (otpRecord.otp_code !== validatedData.otp) {
      // Increment attempts count
      await supabase
        .from('otp_verifications')
        .update({ attempts_count: otpRecord.attempts_count + 1 })
        .eq('id', otpRecord.id)

      return {
        success: false,
        message: `Invalid OTP. ${otpRecord.max_attempts - otpRecord.attempts_count - 1} attempts remaining.`,
      }
    }

    // Mark OTP as used
    await supabase
      .from('otp_verifications')
      .update({ 
        is_used: true,
        verified_at: new Date().toISOString()
      })
      .eq('id', otpRecord.id)

    // Update registration status
    await supabase
      .from('pending_user_registrations')
      .update({ status: 'otp_verified' })
      .eq('email', validatedData.email)

    return {
      success: true,
      message: "OTP verified successfully. You can now set your password.",
    }
  } catch (error) {
    console.error("OTP verification error:", error)
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: "Invalid OTP format",
        errors: error.errors,
      }
    }
    return {
      success: false,
      message: "Failed to verify OTP. Please try again.",
    }
  }
}

// Set password
export async function setPassword(formData: FormData) {
  try {
    const data = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      confirmPassword: formData.get("confirmPassword") as string,
    }

    // Validate data
    const validatedData = passwordSetupSchema.parse(data)

    // Get pending registration - select all needed columns
    const { data: registration, error: registrationError } = await supabase
      .from('pending_user_registrations')
      .select('*')
      .eq('email', validatedData.email)
      .eq('status', 'otp_verified')
      .single()

    if (registrationError || !registration) {
      return {
        success: false,
        message: "Registration not found or OTP not verified.",
      }
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        data: {
          name: registration.name,
          phone: registration.phone_number,
          city: registration.city,
        }
      }
    })

    if (authError) {
      console.error('Auth creation error:', authError)
      return {
        success: false,
        message: authError.message || "Failed to create user account.",
      }
    }

    // Create user in envio_users table
    const { error: userError } = await supabase
      .from('envio_users')
      .insert({
        id: authData.user?.id,
        name: registration.name,
        email: registration.email,
        phone_number: registration.phone_number,
        city: registration.city,
        gp51_username: registration.gp51_username,
        registration_type: 'admin_portal',
        registration_status: 'completed',
        needs_password_set: false
      })

    if (userError) {
      console.error('User creation error:', userError)
      return {
        success: false,
        message: "Failed to complete user setup.",
      }
    }

    // Create default user role
    await supabase
      .from('user_roles')
      .insert({
        user_id: authData.user?.id,
        role: 'user'
      })

    // Mark registration as completed
    await supabase
      .from('pending_user_registrations')
      .update({ status: 'completed' })
      .eq('id', registration.id)

    return {
      success: true,
      message: "Password set successfully. User account created.",
    }
  } catch (error) {
    console.error("Password setup error:", error)
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: "Password validation failed",
        errors: error.errors,
      }
    }
    return {
      success: false,
      message: "Failed to set password. Please try again.",
    }
  }
}
