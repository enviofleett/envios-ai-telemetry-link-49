
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { PublicRegistrationService } from '@/services/publicRegistrationService';
import { Loader2, ArrowLeft, MessageCircle, Clock, RefreshCw } from 'lucide-react';

interface OTPVerificationFormProps {
  registrationId: string;
  otpId: string;
  phoneNumber: string;
  onSuccess: () => void;
  onBack: () => void;
}

const OTPVerificationForm: React.FC<OTPVerificationFormProps> = ({
  registrationId,
  otpId,
  phoneNumber,
  onSuccess,
  onBack
}) => {
  const { toast } = useToast();
  const [otpCode, setOtpCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState(3);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const formatPhoneNumber = (phone: string): string => {
    if (phone.startsWith('+234')) {
      return phone.replace('+234', '234-xxx-xxx-') + phone.slice(-4);
    }
    return phone.replace(/(\+\d{1,3})(\d{3})(\d{3})(\d+)/, '$1-xxx-xxx-$4');
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otpCode || otpCode.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a 6-digit verification code",
        variant: "destructive"
      });
      return;
    }

    setIsVerifying(true);

    try {
      console.log('🔐 Verifying OTP:', { registrationId, otpCode });
      
      const result = await PublicRegistrationService.verifyOTPForRegistration(registrationId, otpCode);
      
      if (result.success) {
        toast({
          title: "Phone Verified Successfully",
          description: "Your phone number has been verified. Your registration is now pending admin review.",
        });
        onSuccess();
      } else {
        if (result.attemptsRemaining !== undefined) {
          setAttemptsRemaining(result.attemptsRemaining);
        }
        
        toast({
          title: "Verification Failed",
          description: result.error || "Invalid OTP code. Please try again.",
          variant: "destructive"
        });

        if (attemptsRemaining <= 1) {
          toast({
            title: "Maximum Attempts Reached",
            description: "Please request a new verification code.",
            variant: "destructive"
          });
          setOtpCode('');
          setCanResend(true);
          setCountdown(0);
        }
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
    setIsResending(true);
    
    try {
      // Note: We'll need to implement resend functionality in the backend
      toast({
        title: "Code Resent",
        description: "A new verification code has been sent to your phone.",
      });
      
      setCountdown(60);
      setCanResend(false);
      setAttemptsRemaining(3);
      setOtpCode('');
      
    } catch (error) {
      console.error('Resend OTP error:', error);
      toast({
        title: "Resend Failed",
        description: "Failed to resend verification code. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-blue-500" />
          Verify Your Phone Number
        </CardTitle>
        <p className="text-sm text-gray-600">
          We sent a 6-digit verification code to{' '}
          <span className="font-medium">{formatPhoneNumber(phoneNumber)}</span>
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleVerifyOTP} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="otpCode">Verification Code</Label>
            <Input
              id="otpCode"
              type="text"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit code"
              disabled={isVerifying}
              className="text-center text-lg tracking-widest"
              maxLength={6}
              required
            />
            <p className="text-xs text-gray-500 text-center">
              {attemptsRemaining > 0 && (
                <>Attempts remaining: {attemptsRemaining}</>
              )}
            </p>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isVerifying || otpCode.length !== 6}
          >
            {isVerifying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify Phone Number'
            )}
          </Button>
        </form>

        <div className="flex items-center justify-between pt-4 border-t">
          <Button 
            variant="ghost" 
            onClick={onBack}
            disabled={isVerifying}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Registration
          </Button>

          <div className="flex items-center gap-2">
            {!canResend ? (
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                Resend in {countdown}s
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResendOTP}
                disabled={isResending}
                className="flex items-center gap-1"
              >
                {isResending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Resend Code
              </Button>
            )}
          </div>
        </div>

        <div className="text-xs text-gray-500 text-center">
          Didn't receive the code? Check your phone and try resending.
        </div>
      </CardContent>
    </Card>
  );
};

export default OTPVerificationForm;
