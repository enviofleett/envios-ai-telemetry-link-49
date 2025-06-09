
import React, { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { EmailVerificationService } from '@/services/emailVerificationService';
import { Mail, Loader2, CheckCircle } from 'lucide-react';

interface EmailVerificationBannerProps {
  email: string;
  onVerificationComplete?: () => void;
}

const EmailVerificationBanner: React.FC<EmailVerificationBannerProps> = ({
  email,
  onVerificationComplete
}) => {
  const [isResending, setIsResending] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const { toast } = useToast();

  const handleResendVerification = async () => {
    setIsResending(true);
    try {
      const result = await EmailVerificationService.resendVerification(email);
      
      if (result.success) {
        toast({
          title: "Verification Email Sent",
          description: "Please check your email for the verification link.",
        });
      } else {
        toast({
          title: "Failed to Send Email",
          description: result.error || "Please try again later.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send verification email.",
        variant: "destructive"
      });
    } finally {
      setIsResending(false);
    }
  };

  const checkVerificationStatus = async () => {
    const isVerified = await EmailVerificationService.checkVerificationStatus(email);
    if (isVerified) {
      setIsVerified(true);
      onVerificationComplete?.();
    }
  };

  if (isVerified) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          Your email has been verified successfully!
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="border-yellow-200 bg-yellow-50">
      <Mail className="h-4 w-4 text-yellow-600" />
      <AlertDescription className="text-yellow-800">
        <div className="flex items-center justify-between">
          <span>
            Please verify your email address ({email}) to complete your account setup.
          </span>
          <div className="flex items-center gap-2 ml-4">
            <Button
              variant="outline"
              size="sm"
              onClick={checkVerificationStatus}
              className="text-yellow-800 border-yellow-300 hover:bg-yellow-100"
            >
              Check Status
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResendVerification}
              disabled={isResending}
              className="text-yellow-800 border-yellow-300 hover:bg-yellow-100"
            >
              {isResending ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Sending...
                </>
              ) : (
                'Resend Email'
              )}
            </Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default EmailVerificationBanner;
