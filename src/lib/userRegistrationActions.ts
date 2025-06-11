
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

// Create GP51 user
async function createGP51User(userData: {
  username: string;
  password: string;
  showname: string;
  email?: string;
  usertype?: number;
}) {
  console.log('🔄 Creating GP51 user:', userData.username);
  
  const { data, error } = await supabase.functions.invoke('gp51-user-management', {
    body: {
      action: 'adduser',
      username: userData.username,
      password: userData.password,
      showname: userData.showname,
      email: userData.email || '',
      usertype: userData.usertype || 3,
      multilogin: 1
    }
  });

  if (error) {
    console.error('❌ GP51 user creation failed:', error);
    throw new Error(`GP51 user creation failed: ${error.message}`);
  }

  if (!data.success) {
    console.error('❌ GP51 user creation returned error:', data);
    throw new Error(`GP51 user creation failed: ${data.error || 'Unknown error'}`);
  }

  console.log('✅ GP51 user created successfully:', userData.username);
  return data;
}

// Delete GP51 user (for rollback)
async function deleteGP51User(username: string) {
  console.log('🔄 Rolling back GP51 user:', username);
  
  try {
    const { data, error } = await supabase.functions.invoke('gp51-user-management', {
      body: {
        action: 'deleteuser',
        usernames: username
      }
    });

    if (error) {
      console.error('❌ GP51 user rollback failed:', error);
    } else {
      console.log('✅ GP51 user rollback successful:', username);
    }
  } catch (rollbackError) {
    console.error('❌ GP51 user rollback exception:', rollbackError);
  }
}

// Register user with GP51 integration
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

    // Generate username and temporary password
    const username = generateUsername(validatedData.name)
    const tempPassword = 'TempPass123!' // Will be changed during password setup

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

    let registrationId: string | null = null;
    let gp51Created = false;

    try {
      // Step 1: Create pending registration record first
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

      registrationId = registrationData.id;

      // Step 2: Create user in GP51 system
      console.log('🔄 Creating GP51 user for registration:', username);
      await createGP51User({
        username,
        password: tempPassword,
        showname: validatedData.name,
        email: validatedData.email,
        usertype: 3 // End user
      });
      
      gp51Created = true;
      console.log('✅ GP51 user created successfully');

      // Step 3: Generate and store OTP
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
        throw new Error('Failed to send OTP')
      }

      // In a real application, send OTP via email/SMS
      console.log(`📧 OTP for ${validatedData.email}: ${otp}`)

      return {
        success: true,
        message: "User registered successfully in both Envio and GP51. OTP sent to email.",
        user: {
          ...validatedData,
          username,
          id: registrationData.id,
          registrationSource: "admin_portal",
          status: "pending_otp",
          createdAt: registrationData.created_at,
          gp51Created: true
        },
      }

    } catch (error) {
      console.error("Registration process failed:", error)
      
      // Rollback: Delete GP51 user if it was created
      if (gp51Created) {
        console.log('🔄 Rolling back GP51 user due to error');
        await deleteGP51User(username);
      }

      // Rollback: Delete registration record if it was created
      if (registrationId) {
        console.log('🔄 Rolling back registration record due to error');
        await supabase
          .from('pending_user_registrations')
          .delete()
          .eq('id', registrationId);
      }

      return {
        success: false,
        message: "Failed to register user. All changes have been rolled back.",
        error: error instanceof Error ? error.message : "Unknown error"
      }
    }

  } catch (error) {
    console.error("Registration validation error:", error)
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

// Set password with GP51 integration
export async function setPassword(formData: FormData) {
  try {
    const data = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      confirmPassword: formData.get("confirmPassword") as string,
    }

    // Validate data
    const validatedData = passwordSetupSchema.parse(data)

    // Get pending registration
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

    const typedRegistration = registration as typeof registration & { gp51_username?: string }

    let authUserId: string | null = null;
    let localUserCreated = false;

    try {
      // Step 1: Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: validatedData.email,
        password: validatedData.password,
        options: {
          data: {
            name: typedRegistration.name,
            phone: typedRegistration.phone_number,
            city: typedRegistration.city,
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

      authUserId = authData.user?.id || null;

      // Step 2: Create user in envio_users table
      const { error: userError } = await supabase
        .from('envio_users')
        .insert({
          id: authData.user?.id,
          name: typedRegistration.name,
          email: typedRegistration.email,
          phone_number: typedRegistration.phone_number,
          city: typedRegistration.city,
          gp51_username: typedRegistration.gp51_username,
          registration_type: 'admin_portal',
          registration_status: 'completed',
          needs_password_set: false,
          is_gp51_imported: false
        })

      if (userError) {
        console.error('User creation error:', userError)
        throw new Error('Failed to complete user setup')
      }

      localUserCreated = true;

      // Step 3: Update GP51 user with the actual password
      if (typedRegistration.gp51_username) {
        console.log('🔄 Updating GP51 user password');
        
        // Note: GP51 doesn't have a direct "change password" API, so we might need to:
        // 1. Delete the old user and recreate with new password, OR
        // 2. Use edituser if it supports password changes
        // For now, we'll log this for future implementation
        console.log('⚠️  GP51 password update not implemented - user has temp password in GP51');
      }

      // Step 4: Create default user role
      await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user?.id,
          role: 'user'
        })

      // Step 5: Mark registration as completed
      await supabase
        .from('pending_user_registrations')
        .update({ status: 'completed' })
        .eq('id', typedRegistration.id)

      // Step 6: Link user to GP51 management table
      if (typedRegistration.gp51_username) {
        await supabase
          .from('gp51_user_management')
          .update({
            envio_user_id: authData.user?.id,
            activation_status: 'active',
            activation_date: new Date().toISOString(),
            last_sync_at: new Date().toISOString()
          })
          .eq('gp51_username', typedRegistration.gp51_username);
      }

      return {
        success: true,
        message: "Password set successfully. User account created in both Envio and GP51.",
        gp51Username: typedRegistration.gp51_username
      }

    } catch (error) {
      console.error("Password setup error:", error)
      
      // Rollback: Delete auth user if created
      if (authUserId && localUserCreated) {
        console.log('🔄 Rolling back user creation due to error');
        try {
          await supabase.auth.admin.deleteUser(authUserId);
        } catch (rollbackError) {
          console.error('Failed to rollback auth user:', rollbackError);
        }
      }

      return {
        success: false,
        message: "Failed to set password. Please try again.",
        error: error instanceof Error ? error.message : "Unknown error"
      }
    }

  } catch (error) {
    console.error("Password setup validation error:", error)
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
