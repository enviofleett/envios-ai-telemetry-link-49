
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { PackageMappingService } from '@/services/packageMappingService';
import { OTPService } from '@/services/otpService';
import AIBrandingPanel from './AIBrandingPanel';
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';

const ProfessionalLoginPage: React.FC = () => {
  const {
    signIn,
    signUp,
    user
  } = useAuth();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpId, setOtpId] = useState('');
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [signupData, setSignupData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: '',
    company: '',
    packageId: 'basic'
  });

  // Redirect authenticated users
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const {
        error
      } = await signIn(loginData.email, loginData.password);
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please check your credentials and try again.');
        } else if (error.message.includes('Email not confirmed')) {
          setError('Please verify your email address before signing in.');
        } else {
          setError(error.message);
        }
      } else {
        toast({
          title: "Welcome back!",
          description: "Successfully signed in to Envio."
        });
        navigate('/');
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validate passwords match
    if (signupData.password !== signupData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    // Validate password strength
    if (signupData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    // Validate package selection
    const packageValidation = PackageMappingService.validatePackage(signupData.packageId);
    if (!packageValidation.isValid) {
      setError(packageValidation.error || 'Invalid package selection');
      setIsLoading(false);
      return;
    }
    
    try {
      // For now, skip OTP and directly create account
      // TODO: Re-enable OTP verification once edge function is fixed
      const fullName = `${signupData.firstName} ${signupData.lastName}`;
      const {
        error
      } = await signUp(signupData.email, signupData.password, fullName, signupData.packageId);
      
      if (error) {
        setError(error.message);
      } else {
        const packageInfo = PackageMappingService.getPackageInfo(signupData.packageId);
        toast({
          title: "Registration Successful!",
          description: packageInfo?.requiresApproval ? "Your account has been created. Admin approval may be required for your selected package." : "Your account has been created successfully."
        });
        // Reset form
        setSignupData({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          confirmPassword: '',
          userType: '',
          company: '',
          packageId: 'basic'
        });
      }
    } catch (error) {
      setError('Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      // Verify OTP
      const verifyResult = await OTPService.verifyOTP(otpId, otpCode);
      if (!verifyResult.success || !verifyResult.verified) {
        setError(verifyResult.error || 'Invalid verification code');
        setIsLoading(false);
        return;
      }

      // OTP verified, create the user account
      const fullName = `${signupData.firstName} ${signupData.lastName}`;
      const {
        error
      } = await signUp(signupData.email, signupData.password, fullName, signupData.packageId);
      if (error) {
        setError(error.message);
      } else {
        const packageInfo = PackageMappingService.getPackageInfo(signupData.packageId);
        toast({
          title: "Registration Successful!",
          description: packageInfo?.requiresApproval ? "Your account has been created. Admin approval may be required for your selected package." : "Your account has been created successfully."
        });
        setOtpStep(false);
        // Reset form
        setSignupData({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          confirmPassword: '',
          userType: '',
          company: '',
          packageId: 'basic'
        });
        setOtpCode('');
      }
    } catch (error) {
      setError('Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    try {
      const resendResult = await OTPService.resendOTP(otpId);
      if (resendResult.success) {
        toast({
          title: "Code Resent",
          description: "A new verification code has been sent to your email"
        });
      } else {
        setError(resendResult.error || 'Failed to resend code');
      }
    } catch (error) {
      setError('Failed to resend verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const userTypes = [{
    value: 'fleet-manager',
    label: 'Fleet Manager'
  }, {
    value: 'driver',
    label: 'Driver'
  }, {
    value: 'admin',
    label: 'System Administrator'
  }, {
    value: 'analyst',
    label: 'Data Analyst'
  }, {
    value: 'maintenance',
    label: 'Maintenance Supervisor'
  }];

  const availablePackages = PackageMappingService.getAvailablePackages();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-7xl grid lg:grid-cols-2 gap-12 items-center">
        {/* Left side - AI Branding */}
        <AIBrandingPanel />

        {/* Right side - Authentication Form */}
        <div className="w-full max-w-md mx-auto">
          {!otpStep ? (
            <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
              <CardHeader className="space-y-2 text-center pb-6">
                <CardTitle className="text-2xl font-bold">Welcome to Envio</CardTitle>
                <CardDescription className="text-base">
                  Access your intelligent vehicle management platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="login" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="login">Sign In</TabsTrigger>
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                  </TabsList>

                  {/* Login Tab */}
                  <TabsContent value="login" className="space-y-4">
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-email">Email address</Label>
                        <Input 
                          id="login-email" 
                          type="email" 
                          placeholder="Enter your email" 
                          value={loginData.email} 
                          onChange={e => setLoginData({
                            ...loginData,
                            email: e.target.value
                          })} 
                          className="h-11" 
                          required 
                          disabled={isLoading} 
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="login-password">Password</Label>
                        <div className="relative">
                          <Input 
                            id="login-password" 
                            type={showPassword ? 'text' : 'password'} 
                            placeholder="Enter your password" 
                            value={loginData.password} 
                            onChange={e => setLoginData({
                              ...loginData,
                              password: e.target.value
                            })} 
                            className="h-11 pr-10" 
                            required 
                            disabled={isLoading} 
                          />
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" 
                            onClick={() => setShowPassword(!showPassword)} 
                            disabled={isLoading}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4 text-slate-500" /> : <Eye className="h-4 w-4 text-slate-500" />}
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="remember" 
                            checked={loginData.rememberMe} 
                            onCheckedChange={checked => setLoginData({
                              ...loginData,
                              rememberMe: checked as boolean
                            })} 
                            disabled={isLoading} 
                          />
                          <Label htmlFor="remember" className="text-sm text-slate-600">
                            Remember me
                          </Label>
                        </div>
                        <Button variant="link" className="px-0 text-sm text-blue-600 hover:text-blue-700">
                          Forgot password?
                        </Button>
                      </div>

                      {error && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}

                      <Button 
                        type="submit" 
                        className="w-full h-11 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700" 
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Signing In...
                          </>
                        ) : (
                          'Sign In'
                        )}
                      </Button>
                    </form>
                  </TabsContent>

                  {/* Signup Tab */}
                  <TabsContent value="signup" className="space-y-4">
                    <form onSubmit={handleSignup} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <Input 
                            id="firstName" 
                            placeholder="John" 
                            value={signupData.firstName} 
                            onChange={e => setSignupData({
                              ...signupData,
                              firstName: e.target.value
                            })} 
                            className="h-11" 
                            required 
                            disabled={isLoading} 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input 
                            id="lastName" 
                            placeholder="Doe" 
                            value={signupData.lastName} 
                            onChange={e => setSignupData({
                              ...signupData,
                              lastName: e.target.value
                            })} 
                            className="h-11" 
                            required 
                            disabled={isLoading} 
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email address</Label>
                        <Input 
                          id="signup-email" 
                          type="email" 
                          placeholder="john.doe@company.com" 
                          value={signupData.email} 
                          onChange={e => setSignupData({
                            ...signupData,
                            email: e.target.value
                          })} 
                          className="h-11" 
                          required 
                          disabled={isLoading} 
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="package">Package</Label>
                        <Select 
                          value={signupData.packageId} 
                          onValueChange={value => setSignupData({
                            ...signupData,
                            packageId: value
                          })} 
                          disabled={isLoading}
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select a package" />
                          </SelectTrigger>
                          <SelectContent>
                            {availablePackages.map(pkg => (
                              <SelectItem key={pkg.packageId} value={pkg.packageId}>
                                <div>
                                  <div className="font-medium">{pkg.packageName}</div>
                                  <div className="text-xs text-slate-500">{pkg.description}</div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Password</Label>
                        <div className="relative">
                          <Input 
                            id="signup-password" 
                            type={showPassword ? 'text' : 'password'} 
                            placeholder="Create a password" 
                            value={signupData.password} 
                            onChange={e => setSignupData({
                              ...signupData,
                              password: e.target.value
                            })} 
                            className="h-11 pr-10" 
                            required 
                            disabled={isLoading} 
                          />
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" 
                            onClick={() => setShowPassword(!showPassword)} 
                            disabled={isLoading}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4 text-slate-500" /> : <Eye className="h-4 w-4 text-slate-500" />}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <div className="relative">
                          <Input 
                            id="confirmPassword" 
                            type={showConfirmPassword ? 'text' : 'password'} 
                            placeholder="Confirm your password" 
                            value={signupData.confirmPassword} 
                            onChange={e => setSignupData({
                              ...signupData,
                              confirmPassword: e.target.value
                            })} 
                            className="h-11 pr-10" 
                            required 
                            disabled={isLoading} 
                          />
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" 
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                            disabled={isLoading}
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4 text-slate-500" /> : <Eye className="h-4 w-4 text-slate-500" />}
                          </Button>
                        </div>
                      </div>

                      {error && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}

                      <Button 
                        type="submit" 
                        className="w-full h-11 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700" 
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
                    </form>
                  </TabsContent>
                </Tabs>

                <div className="relative mt-6">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-slate-500">Or continue with</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <Button variant="outline" className="h-11" disabled>
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Google
                  </Button>
                  <Button variant="outline" className="h-11" disabled>
                    <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.024-.105-.949-.199-2.403.041-3.439.219-.937 1.219-5.160 1.219-5.160s-.312-.623-.312-1.543c0-1.444.83-2.521 1.863-2.521.878 0 1.303.659 1.303 1.449 0 .882-.562 2.203-.849 3.427-.241 1.019.511 1.848 1.517 1.848 1.821 0 3.222-1.923 3.222-4.694 0-2.455-1.764-4.169-4.289-4.169-2.921 0-4.634 2.188-4.634 4.448 0 .882.341 1.829.766 2.341.084.102.096.191.071.295-.078.325-.251 1.025-.285 1.169-.043.184-.142.223-.328.134-1.249-.581-2.03-2.407-2.03-3.874 0-3.154 2.292-6.052 6.608-6.052 3.469 0 6.165 2.473 6.165 5.776 0 3.447-2.173 6.22-5.19 6.22-1.013 0-1.966-.527-2.292-1.155l-.623 2.378c-.226.869-.835 1.958-1.244 2.621.937.29 1.931.446 2.962.446 6.624 0 11.99-5.367 11.99-11.987C24.007 5.367 18.641.001 12.017.001z" />
                    </svg>
                    Microsoft
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            // OTP Verification Step
            <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
              <CardHeader className="space-y-2 text-center pb-6">
                <CardTitle className="text-2xl font-bold">Verify Your Email</CardTitle>
                <CardDescription className="text-base">
                  Enter the 6-digit verification code sent to {signupData.email}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleOTPVerification} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp-code">Verification Code</Label>
                    <Input 
                      id="otp-code" 
                      type="text" 
                      placeholder="Enter 6-digit code" 
                      value={otpCode} 
                      onChange={e => setOtpCode(e.target.value)} 
                      maxLength={6} 
                      className="text-center text-lg tracking-wider h-11" 
                      required 
                      disabled={isLoading} 
                    />
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full h-11 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Complete Registration'
                    )}
                  </Button>

                  <div className="text-center space-y-2">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={handleResendOTP} 
                      disabled={isLoading} 
                      className="text-sm"
                    >
                      Resend Code
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setOtpStep(false);
                        setError('');
                        setOtpCode('');
                      }} 
                      className="w-full text-sm"
                    >
                      Back to Registration
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="mt-8 text-center text-xs text-blue-200">
            <p>© 2024 Envio Vehicle Management System. All rights reserved.</p>
            <div className="mt-2 space-x-4">
              <Button variant="link" className="px-0 text-xs text-blue-300 hover:text-white">
                Privacy Policy
              </Button>
              <Button variant="link" className="px-0 text-xs text-blue-300 hover:text-white">
                Terms of Service
              </Button>
              <Button variant="link" className="px-0 text-xs text-blue-300 hover:text-white">
                Support
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalLoginPage;
