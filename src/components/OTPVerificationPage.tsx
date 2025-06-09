
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { OTPService } from '@/services/otpService';
import { Mail, Shield, Timer, RefreshCw } from 'lucide-react';
import Loading from '@/components/Loading';

interface OTPVerificationPageProps {
  email: string;
  otpId: string;
  onVerificationSuccess?: () => void;
}

export default function OTPVerificationPage({ 
  email, 
  otpId,
  onVerificationSuccess 
}: OTPVerificationPageProps) {
  const { toast } = useToast();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [canResend, setCanResend] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState(3);
  const [currentOtpId, setCurrentOtpId] = useState(otpId);

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle OTP input
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  // Handle backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  // Verify OTP
  const handleVerifyOTP = async () => {
    const otpCode = otp.join('');

    if (otpCode.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the complete 6-digit code",
        variant: "destructive"
      });
      return;
    }

    if (!currentOtpId) {
      toast({
        title: "Error",
        description: "No OTP ID provided",
        variant: "destructive"
      });
      return;
    }

    setIsVerifying(true);

    try {
      const result = await OTPService.verifyOTP(currentOtpId, otpCode);

      if (result.success && result.verified) {
        toast({
          title: "Verification Successful",
          description: "Your email has been verified successfully",
        });
        onVerificationSuccess?.();
      } else {
        toast({
          title: "Verification Failed",
          description: result.error || "Invalid verification code",
          variant: "destructive"
        });
        
        // Update attempts remaining if provided
        if (result.attemptsRemaining !== undefined) {
          setAttemptsRemaining(result.attemptsRemaining);
        }
        
        setOtp(['', '', '', '', '', '']);
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      toast({
        title: "Verification Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    if (!currentOtpId) {
      toast({
        title: "Error",
        description: "No OTP ID provided for resending",
        variant: "destructive"
      });
      return;
    }

    setIsResending(true);

    try {
      const result = await OTPService.resendOTP(currentOtpId);
      
      if (result.success && result.otpId) {
        setCurrentOtpId(result.otpId);
        setTimeLeft(600); // Reset timer
        setAttemptsRemaining(3); // Reset attempts
        setOtp(['', '', '', '', '', '']);
        setCanResend(false);
        
        toast({
          title: "OTP Resent",
          description: "A new verification code has been sent to your email",
        });
      } else {
        toast({
          title: "Resend Failed",
          description: result.error || "Failed to resend verification code",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('OTP resend error:', error);
      toast({
        title: "Resend Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsResending(false);
    }
  };

  if (isVerifying) {
    return <Loading variant="fullscreen" message="Verifying your code..." />;
  }

  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, '$1***$3');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="h-6 w-6" />
          </div>
          <CardTitle>Verify Your Email</CardTitle>
          <CardDescription>
            We've sent a 6-digit verification code to
            <br />
            <strong>{maskedEmail}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* OTP Input */}
          <div>
            <Label className="text-center block mb-4">Enter Verification Code</Label>
            <div className="flex justify-center gap-2">
              {otp.map((digit, index) => (
                <Input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-12 text-center text-lg font-semibold"
                  disabled={isVerifying}
                />
              ))}
            </div>
          </div>

          {/* Timer and Attempts */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Timer className="h-4 w-4" />
              {timeLeft > 0 ? (
                <span>Code expires in {formatTime(timeLeft)}</span>
              ) : (
                <span className="text-red-500">Code has expired</span>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              Attempts remaining: {attemptsRemaining}/3
            </div>
          </div>

          {/* Verify Button */}
          <Button 
            onClick={handleVerifyOTP} 
            disabled={isVerifying || otp.join('').length !== 6 || timeLeft === 0}
            className="w-full"
          >
            {isVerifying ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify Code'
            )}
          </Button>

          {/* Resend OTP */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Didn't receive the code?</p>
            <Button
              variant="ghost"
              onClick={handleResendOTP}
              disabled={!canResend || isResending || timeLeft > 540} // Allow resend only after 1 minute
              className="text-blue-600 hover:text-blue-700"
            >
              {isResending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Resend Code
                </>
              )}
            </Button>
          </div>

          {/* Help Text */}
          <Alert>
            <Mail className="h-4 w-4" />
            <AlertDescription>
              Check your spam folder if you don't see the email. The code is valid for 10 minutes.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
