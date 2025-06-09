
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { EmailVerificationService } from '@/services/emailVerificationService';
import EmailVerificationBanner from './EmailVerificationBanner';
import EnhancedLoginForm from './EnhancedLoginForm';
import EnhancedRegistrationForm from './EnhancedRegistrationForm';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle } from 'lucide-react';

const EnhancedAuthFlow: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('login');
  const [showVerificationBanner, setShowVerificationBanner] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    // Handle email verification callback
    const token = searchParams.get('token');
    const verified = searchParams.get('verified');
    
    if (token) {
      handleEmailVerification(token);
    }

    if (verified === 'true') {
      toast({
        title: "Email Verified",
        description: "Your email has been verified successfully!",
      });
    }

    // Redirect authenticated users
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate, searchParams, toast]);

  const handleEmailVerification = async (token: string) => {
    try {
      const result = await EmailVerificationService.verifyEmail(token);
      
      if (result.success) {
        toast({
          title: "Email Verified",
          description: result.message || "Your email has been verified successfully!",
        });
        
        if (result.redirectUrl) {
          navigate(result.redirectUrl);
        }
      } else {
        toast({
          title: "Verification Failed",
          description: result.error || "Failed to verify email",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Verification Error",
        description: "An error occurred during email verification",
        variant: "destructive"
      });
    }
  };

  const handleRegistrationSuccess = (email: string) => {
    setUserEmail(email);
    setShowVerificationBanner(true);
    setActiveTab('login');
    
    toast({
      title: "Registration Successful",
      description: "Please check your email to verify your account before signing in.",
    });
  };

  const handleVerificationComplete = () => {
    setShowVerificationBanner(false);
    toast({
      title: "Email Verified",
      description: "You can now sign in to your account.",
    });
  };

  // Show verification success message
  if (searchParams.get('verified') === 'true') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Your email has been verified successfully! You can now sign in to your account.
              </AlertDescription>
            </Alert>
            <div className="mt-4 text-center">
              <button
                onClick={() => navigate('/auth')}
                className="text-blue-600 hover:underline font-medium"
              >
                Continue to Sign In
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          {showVerificationBanner && userEmail && (
            <div className="mb-6">
              <EmailVerificationBanner
                email={userEmail}
                onVerificationComplete={handleVerificationComplete}
              />
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="register">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <EnhancedLoginForm />
            </TabsContent>

            <TabsContent value="register">
              <EnhancedRegistrationForm onSuccess={handleRegistrationSuccess} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedAuthFlow;
