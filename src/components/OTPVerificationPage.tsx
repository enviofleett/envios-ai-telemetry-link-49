
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { OTPService } from '@/services/otpService';
import { Loader2, Shield, Clock, RefreshCw } from 'lucide-react';
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
  const [otpCode, setOtpCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [attemptsRemaining, setAttemptsRemaining] = useState(3);
  const [currentOtpId, setCurrentOtpId] = useState(otpId);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentOtpId]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOtpChange = (value: string) => {
    // Only allow digits and limit to 6 characters
    const numericValue = value.replace(/\D/g, '').slice(0, 6);
    setOtpCode(numericValue);
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otpCode.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a 6-digit verification code",
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
        
        setOtpCode('');
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
        setOtpCode('');
        
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Verify Your Email</h1>
          <p className="mt-2 text-gray-600">
            Enter the verification code sent to your email
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-500" />
              Email Verification
            </CardTitle>
            <p className="text-sm text-gray-600">
              Code sent to {maskedEmail}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otpCode">Verification Code</Label>
                <Input
                  id="otpCode"
                  type="text"
                  value={otpCode}
                  onChange={(e) => handleOtpChange(e.target.value)}
                  placeholder="Enter 6-digit code"
                  disabled={isVerifying}
                  className="text-center text-lg tracking-widest font-mono"
                  maxLength={6}
                  required
                />
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>Expires in {formatTime(timeLeft)}</span>
                </div>
                <span>Attempts: {attemptsRemaining}/3</span>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isVerifying || otpCode.length !== 6 || timeLeft === 0}
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify Code'
                )}
              </Button>

              <Button 
                type="button" 
                variant="outline" 
                onClick={handleResendOTP}
                disabled={isResending || timeLeft > 540} // Allow resend only after 1 minute
                className="w-full"
              >
                {isResending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resending...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Resend Code
                  </>
                )}
              </Button>

              <div className="text-xs text-gray-500 text-center">
                Didn't receive the code? Check your email or try resending after 1 minute.
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
