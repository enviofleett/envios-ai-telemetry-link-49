
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mail, User, Phone, MapPin, CheckCircle, AlertCircle } from 'lucide-react';
import { PublicRegistrationService } from '@/services/publicRegistrationService';
import { OTPService } from '@/services/otpService';
import { useToast } from '@/hooks/use-toast';

type RegistrationStep = 'details' | 'otp' | 'success';

const RegistrationForm: React.FC = () => {
  const [step, setStep] = useState<RegistrationStep>('details');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [registrationId, setRegistrationId] = useState('');
  const [otpId, setOtpId] = useState('');
  const { toast } = useToast();

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    city: ''
  });

  const [otpCode, setOtpCode] = useState('');

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validate required fields
    if (!formData.name || !formData.email || !formData.phoneNumber || !formData.city) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    try {
      const result = await PublicRegistrationService.submitRegistration(formData);
      
      if (result.success) {
        setRegistrationId(result.registrationId!);
        setOtpId(result.otpId!);
        setStep('otp');
        toast({
          title: "Registration Submitted",
          description: result.message || "Please check your email for the verification code.",
        });
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!otpCode || otpCode.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      setIsLoading(false);
      return;
    }

    try {
      const result = await PublicRegistrationService.verifyOTPForRegistration(registrationId, otpCode);
      
      if (result.success) {
        setStep('success');
        toast({
          title: "Registration Verified",
          description: result.message || "Your registration is pending admin review.",
        });
      } else {
        setError(result.error || 'OTP verification failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!otpId) return;
    
    setIsLoading(true);
    try {
      const result = await OTPService.resendOTP(otpId);
      if (result.success) {
        toast({
          title: "OTP Resent",
          description: "A new verification code has been sent to your email.",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to resend OTP. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-green-600 mb-4" />
          <CardTitle className="text-green-800">Registration Successful!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-green-700">
            Your registration has been submitted and verified. Our admin team will review your application and contact you shortly.
          </p>
          <div className="text-sm text-green-600 bg-white p-3 rounded-lg">
            <strong>What's next?</strong><br />
            • Admin review (usually within 24 hours)<br />
            • Account activation email<br />
            • Welcome package with login details
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'otp') {
    return (
      <form onSubmit={handleOTPSubmit} className="space-y-4">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Verify Your Email</h3>
          <p className="text-sm text-gray-600">
            We've sent a 6-digit verification code to <strong>{formData.email}</strong>
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="otp" className="text-sm font-medium text-gray-700">
            Verification Code
          </Label>
          <Input
            id="otp"
            type="text"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="Enter 6-digit code"
            className="text-center text-2xl font-mono tracking-widest h-12"
            maxLength={6}
            disabled={isLoading}
            required
          />
        </div>

        {error && (
          <Alert variant="destructive" className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <Button
          type="submit"
          className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium"
          disabled={isLoading || otpCode.length !== 6}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            'Verify Email'
          )}
        </Button>

        <div className="text-center">
          <Button
            type="button"
            variant="link"
            onClick={handleResendOTP}
            disabled={isLoading}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Didn't receive the code? Resend OTP
          </Button>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => setStep('details')}
          disabled={isLoading}
          className="w-full"
        >
          Back to Registration
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleRegistrationSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium text-gray-700">
          Full Name
        </Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Enter your full name"
            className="pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
            disabled={isLoading}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-gray-700">
          Email Address
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="Enter your email address"
            className="pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
            disabled={isLoading}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
          Phone Number
        </Label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            id="phone"
            type="tel"
            value={formData.phoneNumber}
            onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
            placeholder="Enter your phone number"
            className="pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
            disabled={isLoading}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="city" className="text-sm font-medium text-gray-700">
          City
        </Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            id="city"
            type="text"
            value={formData.city}
            onChange={(e) => handleInputChange('city', e.target.value)}
            placeholder="Enter your city"
            className="pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
            disabled={isLoading}
            required
          />
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      <Button
        type="submit"
        className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating Account...
          </>
        ) : (
          'Create Account'
        )}
      </Button>

      <div className="text-xs text-center text-gray-500 bg-gray-50 rounded-lg p-3">
        <div className="font-medium text-gray-700 mb-1">Registration Process:</div>
        <div>• Email verification required</div>
        <div>• Admin approval within 24 hours</div>
        <div>• Account activation via email</div>
      </div>
    </form>
  );
};

export default RegistrationForm;
