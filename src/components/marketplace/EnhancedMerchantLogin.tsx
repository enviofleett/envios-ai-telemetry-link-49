
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Mail, Lock, Eye, EyeOff, Store } from 'lucide-react';
import { SecurityService } from '@/services/security/SecurityService';
import { useToast } from '@/hooks/use-toast';

interface MerchantLoginProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (credentials: { email: string; password: string }) => void;
}

export const EnhancedMerchantLogin: React.FC<MerchantLoginProps> = ({
  isOpen,
  onClose,
  onLogin
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const validateLogin = () => {
    const newErrors: Record<string, string> = {};

    // Validate email using SecurityService
    const emailValidation = SecurityService.validateInput(email, 'email');
    if (!emailValidation.isValid) {
      newErrors.email = emailValidation.error || 'Invalid email format';
    }

    // Basic password validation
    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateLogin()) return;

    // Check rate limiting
    const rateLimitCheck = SecurityService.checkRateLimit(`merchant_login:${email}`, 'user');
    if (!rateLimitCheck.allowed) {
      setErrors({ 
        general: `Too many login attempts. Please try again after ${Math.ceil((rateLimitCheck.resetTime!.getTime() - Date.now()) / 60000)} minutes.` 
      });
      
      SecurityService.logSecurityEvent({
        type: 'rate_limit',
        severity: 'medium',
        description: 'Merchant login rate limit exceeded',
        additionalData: { email, attempts: 'max_exceeded' }
      });
      return;
    }

    setIsLoading(true);
    try {
      // Log authentication attempt
      SecurityService.logSecurityEvent({
        type: 'authentication',
        severity: 'low',
        description: 'Merchant login attempt',
        additionalData: { email, userAgent: navigator.userAgent }
      });

      // Get sanitized email
      const emailValidation = SecurityService.validateInput(email, 'email');
      const sanitizedEmail = emailValidation.sanitizedValue || email;

      await onLogin({ email: sanitizedEmail, password });
      
      // Log successful login
      SecurityService.logSecurityEvent({
        type: 'authentication',
        severity: 'low',
        description: 'Merchant login successful',
        additionalData: { email: sanitizedEmail }
      });

      resetForm();
      onClose();

      toast({
        title: 'Login Successful',
        description: 'Welcome to your merchant dashboard!',
      });

    } catch (error: any) {
      console.error('Merchant login error:', error);
      
      SecurityService.logSecurityEvent({
        type: 'authentication',
        severity: 'medium',
        description: 'Merchant login failed',
        additionalData: { email, error: error.message }
      });

      setErrors({ 
        general: error.message || 'Invalid email or password. Please check your credentials and try again.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail.trim()) {
      setErrors({ forgotEmail: 'Email is required' });
      return;
    }

    const emailValidation = SecurityService.validateInput(forgotEmail, 'email');
    if (!emailValidation.isValid) {
      setErrors({ forgotEmail: emailValidation.error || 'Please enter a valid email address' });
      return;
    }

    // Check rate limiting for password reset
    const rateLimitCheck = SecurityService.checkRateLimit(`password_reset:${forgotEmail}`, 'user');
    if (!rateLimitCheck.allowed) {
      setErrors({ 
        forgotEmail: 'Too many password reset requests. Please try again later.' 
      });
      return;
    }

    try {
      SecurityService.logSecurityEvent({
        type: 'authentication',
        severity: 'low',
        description: 'Merchant password reset requested',
        additionalData: { email: forgotEmail }
      });

      // In a real implementation, this would call an API endpoint
      console.log('Password reset requested for:', forgotEmail);
      
      toast({
        title: 'Reset Link Sent',
        description: 'If an account exists with this email, you will receive a password reset link.',
      });

      setShowForgotPassword(false);
      setForgotEmail('');
      setErrors({});

    } catch (error: any) {
      console.error('Password reset error:', error);
      setErrors({ forgotEmail: 'Failed to send reset email. Please try again later.' });
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setForgotEmail('');
    setErrors({});
    setShowForgotPassword(false);
    setShowPassword(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    
    // Clear email error when user starts typing
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: '' }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    
    // Clear password error when user starts typing
    if (errors.password) {
      setErrors(prev => ({ ...prev, password: '' }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Merchant Login
          </DialogTitle>
          <DialogDescription>
            Sign in to your merchant account to manage your store
          </DialogDescription>
        </DialogHeader>

        {!showForgotPassword ? (
          <div className="space-y-4">
            {errors.general && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-sm text-destructive">{errors.general}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="login-email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="login-email"
                  type="email"
                  className="pl-10"
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="merchant@example.com"
                  disabled={isLoading}
                />
              </div>
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="pl-10 pr-10"
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="Enter your password"
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
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
            </div>

            <div className="flex justify-end">
              <Button 
                type="button" 
                variant="link" 
                className="px-0 text-sm" 
                onClick={() => setShowForgotPassword(true)}
                disabled={isLoading}
              >
                Forgot Password?
              </Button>
            </div>

            <Button onClick={handleLogin} disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </Button>

            <Separator />

            <div className="text-center text-sm text-muted-foreground">
              Don't have a merchant account?{' '}
              <Button 
                type="button" 
                variant="link" 
                className="px-0" 
                onClick={handleClose}
                disabled={isLoading}
              >
                Register here
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold">Reset Password</h3>
              <p className="text-sm text-muted-foreground">
                Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="forgot-email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="forgot-email"
                  type="email"
                  className="pl-10"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="merchant@example.com"
                />
              </div>
              {errors.forgotEmail && <p className="text-sm text-destructive">{errors.forgotEmail}</p>}
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowForgotPassword(false)} 
                className="flex-1"
              >
                Back to Login
              </Button>
              <Button onClick={handleForgotPassword} className="flex-1">
                Send Reset Link
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
