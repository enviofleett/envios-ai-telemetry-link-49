
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Eye, EyeOff, AlertCircle, CheckCircle, Mail, User } from 'lucide-react';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const OptimizedLoginForm: React.FC = () => {
  const { signIn, signInWithGP51 } = useUnifiedAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('email');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Email login form data
  const [emailData, setEmailData] = useState({
    email: '',
    password: ''
  });
  
  // GP51 login form data
  const [gp51Data, setGP51Data] = useState({
    username: '',
    password: ''
  });

  const validateGP51Username = (username: string): boolean => {
    if (!username || username.length < 3) return false;
    
    // Allow alphanumeric, email format, or phone format
    const validFormats = [
      /^[a-zA-Z0-9_.-]+$/, // Alphanumeric with common chars
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/, // Email format
      /^\+?[\d\s-()]+$/ // Phone format
    ];
    
    return validFormats.some(format => format.test(username.trim()));
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!emailData.email || !emailData.password) {
      setError('Please fill in all fields');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const { error } = await signIn(emailData.email, emailData.password);
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please check your credentials and try again.');
        } else if (error.message.includes('Email not confirmed')) {
          setError('Please verify your email address before signing in.');
        } else {
          setError(error.message);
        }
      } else {
        navigate('/');
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGP51Login = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedUsername = gp51Data.username.trim();
    
    if (!trimmedUsername || !gp51Data.password) {
      setError('Please fill in all fields');
      return;
    }
    
    if (!validateGP51Username(trimmedUsername)) {
      setError('Please enter a valid GP51 username (minimum 3 characters)');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const { error } = await signInWithGP51(trimmedUsername, gp51Data.password);
      
      if (error) {
        if (error.message.includes('Invalid') || error.message.includes('credentials')) {
          setError('Invalid GP51 username or password. Please check your credentials.');
        } else {
          setError(error.message);
        }
      } else {
        navigate('/');
      }
    } catch (error) {
      setError('GP51 authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getUsernameValidationStatus = () => {
    const trimmed = gp51Data.username.trim();
    if (!trimmed) return null;
    
    if (validateGP51Username(trimmed)) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Valid Format
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive">
          <AlertCircle className="h-3 w-3 mr-1" />
          Invalid Format
        </Badge>
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Sign In to FleetIQ</CardTitle>
          <CardDescription>
            Choose your preferred login method
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </TabsTrigger>
              <TabsTrigger value="gp51" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                GP51
              </TabsTrigger>
            </TabsList>

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <TabsContent value="email" className="space-y-4 mt-6">
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={emailData.email}
                    onChange={(e) => setEmailData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter your email"
                    disabled={isLoading}
                    autoComplete="email"
                    className="h-11"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="email-password"
                      type={showPassword ? 'text' : 'password'}
                      value={emailData.password}
                      onChange={(e) => setEmailData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Enter your password"
                      disabled={isLoading}
                      autoComplete="current-password"
                      className="h-11 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-11 px-3"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <Button type="submit" className="w-full h-12" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    'Sign In with Email'
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="gp51" className="space-y-4 mt-6">
              <form onSubmit={handleGP51Login} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="gp51-username">GP51 Username</Label>
                    {getUsernameValidationStatus()}
                  </div>
                  <Input
                    id="gp51-username"
                    type="text"
                    value={gp51Data.username}
                    onChange={(e) => setGP51Data(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="Enter your GP51 username"
                    disabled={isLoading}
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Supports text, email, or phone format usernames
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="gp51-password">GP51 Password</Label>
                  <div className="relative">
                    <Input
                      id="gp51-password"
                      type={showPassword ? 'text' : 'password'}
                      value={gp51Data.password}
                      onChange={(e) => setGP51Data(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Enter your GP51 password"
                      disabled={isLoading}
                      className="h-11 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-11 px-3"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12" 
                  disabled={isLoading || !validateGP51Username(gp51Data.username.trim())}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting to GP51...
                    </>
                  ) : (
                    'Sign In with GP51'
                  )}
                </Button>
              </form>
              
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-xs text-blue-700">
                  <strong>New to FleetIQ?</strong> If you have a GP51 account, we'll automatically create 
                  your FleetIQ account and link it to your GP51 credentials.
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="text-blue-600 hover:underline font-medium"
                disabled={isLoading}
              >
                Create Account
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OptimizedLoginForm;
