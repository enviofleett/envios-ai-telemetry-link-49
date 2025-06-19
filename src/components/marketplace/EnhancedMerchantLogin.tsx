
import React, { useState } from 'react';
import { useMarketplaceAuth } from '@/hooks/useMarketplaceAuth';
import { useSecurityContext } from '@/components/security/SecurityProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface EnhancedMerchantLoginProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const EnhancedMerchantLogin: React.FC<EnhancedMerchantLoginProps> = ({ 
  onSuccess, 
  onCancel 
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>('');
  const { checkRateLimit } = useSecurityContext();

  const { handleAuthAttempt, attemptCount, isLoading } = useMarketplaceAuth({
    onSuccess: () => {
      setError('');
      onSuccess?.();
    },
    onError: (errorMsg) => {
      setError(errorMsg);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Check rate limiting - fix the timestamp issue here
    const rateLimitCheck = checkRateLimit(email);
    
    if (!rateLimitCheck.allowed && rateLimitCheck.resetTime) {
      // rateLimitCheck.resetTime is already a number (timestamp), no need for .getTime()
      const timeUntilReset = Math.ceil((rateLimitCheck.resetTime - Date.now()) / 1000 / 60);
      setError(`Rate limit exceeded. Try again in ${timeUntilReset} minutes.`);
      return;
    }

    await handleAuthAttempt(email, password);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Merchant Login</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
          <div>
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {attemptCount > 0 && (
            <div className="text-sm text-muted-foreground">
              Login attempts: {attemptCount}
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              type="submit" 
              disabled={isLoading || !email || !password}
              className="flex-1"
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
            {onCancel && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default EnhancedMerchantLogin;
