import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Lock, User, LogOut } from 'lucide-react';
import { OTPService } from '@/services/otpService';
import { useToast } from '@/hooks/use-toast';
import PackageSelectionCard from '@/components/auth/PackageSelectionCard';
import { PackageMappingService } from '@/services/packageMappingService';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedPackage, setSelectedPackage] = useState('basic');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpId, setOtpId] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const { signIn, signUp, signOut, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await signIn(email, password);
    
    if (error) {
      setError(error.message);
    } else {
      navigate('/');
    }
    
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate package selection
    const packageValidation = PackageMappingService.validatePackage(selectedPackage);
    if (!packageValidation.isValid) {
      setError(packageValidation.error || 'Invalid package selection');
      setLoading(false);
      return;
    }

    try {
      // Generate OTP
      const otpResult = await OTPService.generateOTP(
        '', // phone number not required for email OTP
        email,
        'registration'
      );

      if (!otpResult.success) {
        setError(otpResult.error || 'Failed to send verification code');
        setLoading(false);
        return;
      }

      setOtpId(otpResult.otpId!);
      setOtpStep(true);
      toast({
        title: "Verification Code Sent",
        description: "Please check your email for the verification code",
      });
    } catch (error) {
      setError('Failed to send verification code');
    }
    
    setLoading(false);
  };

  const handleOTPVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpLoading(true);
    setError('');

    try {
      // Verify OTP
      const verifyResult = await OTPService.verifyOTP(otpId, otpCode);
      
      if (!verifyResult.success || !verifyResult.verified) {
        setError(verifyResult.error || 'Invalid verification code');
        setOtpLoading(false);
        return;
      }

      // OTP verified, now create the user account with package
      const { error } = await signUp(email, password, name, selectedPackage);
      
      if (error) {
        setError(error.message);
      } else {
        const packageInfo = PackageMappingService.getPackageInfo(selectedPackage);
        toast({
          title: "Registration Successful!",
          description: packageInfo?.requiresApproval
            ? "Your account has been created. Admin approval may be required for your selected package."
            : "Your account has been created successfully.",
        });
        setOtpStep(false);
        // Reset form
        setEmail('');
        setPassword('');
        setName('');
        setSelectedPackage('basic');
        setOtpCode('');
      }
    } catch (error) {
      setError('Registration failed');
    }
    
    setOtpLoading(false);
  };

  const handleResendOTP = async () => {
    setOtpLoading(true);
    try {
      const resendResult = await OTPService.resendOTP(otpId);
      if (resendResult.success) {
        toast({
          title: "Code Resent",
          description: "A new verification code has been sent to your email",
        });
      } else {
        setError(resendResult.error || 'Failed to resend code');
      }
    } catch (error) {
      setError('Failed to resend verification code');
    }
    setOtpLoading(false);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // If user is logged in, show logout option
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Already Signed In</CardTitle>
            <CardDescription>
              You are currently signed in as {user.email}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => navigate('/')} 
              className="w-full"
            >
              Go to Dashboard
            </Button>
            <Button 
              onClick={handleLogout} 
              variant="outline" 
              className="w-full flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Envío Console</CardTitle>
          <CardDescription>
            Sign in to your account or create a new one
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!otpStep ? (
            <Tabs defaultValue="signin" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signin-password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="signup-name"
                          type="text"
                          placeholder="Enter your name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Select Your Package</Label>
                    <div className="grid grid-cols-1 gap-3">
                      {PackageMappingService.getAvailablePackages().map((packageInfo) => (
                        <PackageSelectionCard
                          key={packageInfo.packageId}
                          package={packageInfo}
                          isSelected={selectedPackage === packageInfo.packageId}
                          onSelect={setSelectedPackage}
                        />
                      ))}
                    </div>
                  </div>

                  {error && (
                    <Alert variant={error.includes('check your email') ? 'default' : 'destructive'}>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Sending verification...' : 'Send Verification Code'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold">Verify Your Email</h3>
                <p className="text-sm text-gray-600">
                  Enter the 6-digit verification code sent to {email}
                </p>
              </div>
              
              <form onSubmit={handleOTPVerification} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp-code">Verification Code</Label>
                  <Input
                    id="otp-code"
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    maxLength={6}
                    className="text-center text-lg tracking-wider"
                    required
                  />
                </div>
                
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <Button type="submit" className="w-full" disabled={otpLoading}>
                  {otpLoading ? 'Verifying...' : 'Complete Registration'}
                </Button>
                
                <div className="text-center">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleResendOTP}
                    disabled={otpLoading}
                    className="text-sm"
                  >
                    Resend Code
                  </Button>
                </div>
                
                <div className="text-center">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setOtpStep(false);
                      setError('');
                      setOtpCode('');
                    }}
                    className="text-sm"
                  >
                    Back to Registration
                  </Button>
                </div>
              </form>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link to="/" className="text-sm text-blue-600 hover:underline">
              Back to Home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
