
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { PublicRegistrationService, PublicRegistrationData } from '@/services/publicRegistrationService';
import { Loader2, CheckCircle } from 'lucide-react';

interface PublicRegistrationFormProps {
  onSuccess: (registrationId: string, otpId: string, phoneNumber: string) => void;
}

const PublicRegistrationForm: React.FC<PublicRegistrationFormProps> = ({ onSuccess }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<PublicRegistrationData>({
    name: '',
    email: '',
    phoneNumber: '',
    city: ''
  });

  const handleInputChange = (field: keyof PublicRegistrationData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validatePhoneNumber = (phone: string): boolean => {
    // Enhanced phone validation for international formats
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    const nigeriaMobileRegex = /^(\+234|234|0)?[789][01]\d{8}$/;
    const cleanPhone = phone.replace(/\s+/g, '');
    
    return e164Regex.test(cleanPhone) || nigeriaMobileRegex.test(cleanPhone);
  };

  const formatPhoneNumber = (phone: string): string => {
    const cleaned = phone.replace(/[^\d+]/g, '');
    
    // Handle Nigerian numbers specifically
    if (cleaned.match(/^0[789][01]\d{8}$/)) {
      return `+234${cleaned.substring(1)}`;
    }
    
    if (cleaned.match(/^234[789][01]\d{8}$/)) {
      return `+${cleaned}`;
    }
    
    if (!cleaned.startsWith('+') && cleaned.length > 10) {
      return `+${cleaned}`;
    }
    
    return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Enhanced validation
    if (!formData.name || !formData.email || !formData.phoneNumber || !formData.city) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    // Phone validation
    if (!validatePhoneNumber(formData.phoneNumber)) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid phone number (e.g., +2348012345678 or 08012345678)",
        variant: "destructive"
      });
      return;
    }

    // Name validation
    if (formData.name.trim().length < 2) {
      toast({
        title: "Invalid Name",
        description: "Name must be at least 2 characters long",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Format phone number before submission
      const formattedPhoneNumber = formatPhoneNumber(formData.phoneNumber);
      
      const submissionData = {
        ...formData,
        phoneNumber: formattedPhoneNumber
      };

      console.log('🚀 Submitting registration data:', submissionData);

      const result = await PublicRegistrationService.submitRegistration(submissionData);
      
      if (result.success && result.registrationId && result.otpId) {
        toast({
          title: "Registration Submitted",
          description: "Please check your phone for the verification code",
        });
        
        // Pass the formatted phone number to the success callback
        onSuccess(result.registrationId, result.otpId, formattedPhoneNumber);
      } else {
        toast({
          title: "Registration Failed",
          description: result.error || "Failed to submit registration",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Registration Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          Create Your Account
        </CardTitle>
        <p className="text-sm text-gray-600">
          Fill in your details to register for vehicle tracking services
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter your full name"
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Enter your email address"
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number *</Label>
            <Input
              id="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              placeholder="+2348012345678 or 08012345678"
              disabled={isSubmitting}
              required
            />
            <p className="text-xs text-gray-500">
              We'll send a verification code to this number via SMS
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              type="text"
              value={formData.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              placeholder="Enter your city"
              disabled={isSubmitting}
              required
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting Registration...
              </>
            ) : (
              'Submit Registration'
            )}
          </Button>

          <div className="text-xs text-gray-500 text-center">
            By registering, you agree to our terms of service and privacy policy.
            Your registration will be reviewed by our admin team.
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default PublicRegistrationForm;
