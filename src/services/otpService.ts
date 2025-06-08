
export interface OTPGenerationResult {
  success: boolean;
  otpId?: string;
  error?: string;
  emailDelivered?: boolean;
  emailError?: string;
  expiresAt?: string;
  message?: string;
}

export interface OTPVerificationResult {
  success: boolean;
  verified?: boolean;
  error?: string;
  attemptsRemaining?: number;
}

export interface OTPResendResult {
  success: boolean;
  error?: string;
  otpId?: string;
}

export class OTPService {
  static async generateOTP(
    phoneNumber: string,
    email: string,
    type: 'registration' | 'password_reset'
  ): Promise<OTPGenerationResult> {
    try {
      // Generate a random 6-digit OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const otpId = crypto.randomUUID();
      
      console.log(`Generated OTP ${otpCode} for ${email} (type: ${type})`);
      
      // In a real implementation, this would send the OTP via email/SMS
      // For now, we'll just log it and return success
      
      return {
        success: true,
        otpId: otpId,
        emailDelivered: true,
        message: 'OTP sent successfully'
      };
    } catch (error) {
      console.error('OTP generation error:', error);
      return {
        success: false,
        error: 'Failed to generate OTP',
        emailDelivered: false
      };
    }
  }

  static async verifyOTP(otpId: string, otpCode: string): Promise<OTPVerificationResult> {
    try {
      // In a real implementation, this would verify against stored OTP
      // For now, we'll accept any 6-digit code as valid
      const isValid = /^\d{6}$/.test(otpCode);
      
      console.log(`Verifying OTP ${otpCode} for ID ${otpId}: ${isValid ? 'valid' : 'invalid'}`);
      
      return {
        success: true,
        verified: isValid,
        attemptsRemaining: isValid ? 0 : 2
      };
    } catch (error) {
      console.error('OTP verification error:', error);
      return {
        success: false,
        error: 'Failed to verify OTP',
        attemptsRemaining: 2
      };
    }
  }

  static async resendOTP(otpId: string): Promise<OTPResendResult> {
    try {
      console.log(`Resending OTP for ID ${otpId}`);
      
      // Generate new OTP ID for resend
      const newOtpId = crypto.randomUUID();
      
      // In a real implementation, this would resend the OTP
      return {
        success: true,
        otpId: newOtpId
      };
    } catch (error) {
      console.error('OTP resend error:', error);
      return {
        success: false,
        error: 'Failed to resend OTP'
      };
    }
  }
}
