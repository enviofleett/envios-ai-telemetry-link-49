
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle } from 'lucide-react';
import { registerUser, verifyOTP, setPassword } from '@/lib/userRegistrationActions';
import { useToast } from '@/hooks/use-toast';

type RegistrationStep = 'registration' | 'otp' | 'password' | 'completed';

const UserRegistrationForm: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('registration');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const { toast } = useToast();

  const handleRegistration = async (formData: FormData) => {
    setIsLoading(true);
    setError('');
    
    try {
      const result = await registerUser(formData);
      
      if (result.success) {
        setEmail(formData.get('email') as string);
        setCurrentStep('otp');
        toast({
          title: "Registration Successful",
          description: result.message,
        });
      } else {
        setError(result.message);
        if (result.errors) {
          console.error('Validation errors:', result.errors);
        }
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPVerification = async (formData: FormData) => {
    setIsLoading(true);
    setError('');
    
    try {
      formData.append('email', email);
      const result = await verifyOTP(formData);
      
      if (result.success) {
        setCurrentStep('password');
        toast({
          title: "OTP Verified",
          description: result.message,
        });
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
      console.error('OTP verification error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSetup = async (formData: FormData) => {
    setIsLoading(true);
    setError('');
    
    try {
      formData.append('email', email);
      const result = await setPassword(formData);
      
      if (result.success) {
        setCurrentStep('completed');
        toast({
          title: "Account Created",
          description: result.message,
        });
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Password setup error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (currentStep === 'completed') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
          <CardTitle>Account Created Successfully!</CardTitle>
          <CardDescription>
            The user account has been created and they can now log in to the system.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>
          {currentStep === 'registration' && 'Register New User'}
          {currentStep === 'otp' && 'Verify OTP'}
          {currentStep === 'password' && 'Set Password'}
        </CardTitle>
        <CardDescription>
          {currentStep === 'registration' && 'Fill in the user details to create a new account'}
          {currentStep === 'otp' && 'Enter the OTP sent to the user\'s email'}
          {currentStep === 'password' && 'Set a secure password for the account'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {currentStep === 'registration' && (
          <form action={handleRegistration} className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" name="name" required />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" name="phone" required />
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" required />
            </div>
            <div>
              <Label htmlFor="subscriptionPackage">Subscription Package</Label>
              <Select name="subscriptionPackage" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a package" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                'Register User'
              )}
            </Button>
          </form>
        )}

        {currentStep === 'otp' && (
          <form action={handleOTPVerification} className="space-y-4">
            <div>
              <Label htmlFor="otp">OTP Code</Label>
              <Input 
                id="otp" 
                name="otp" 
                placeholder="Enter 6-digit OTP" 
                maxLength={6}
                required 
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify OTP'
              )}
            </Button>
          </form>
        )}

        {currentStep === 'password' && (
          <form action={handlePasswordSetup} className="space-y-4">
            <div>
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                name="password" 
                type="password" 
                placeholder="Enter password (min 8 characters)"
                required 
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input 
                id="confirmPassword" 
                name="confirmPassword" 
                type="password" 
                placeholder="Confirm password"
                required 
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting Password...
                </>
              ) : (
                'Set Password'
              )}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
};

export default UserRegistrationForm;
