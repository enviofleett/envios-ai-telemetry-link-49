
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Key, AlertCircle, CheckCircle, Crown } from 'lucide-react';
import { useConsolidatedGP51Auth } from '@/hooks/useConsolidatedGP51Auth';
import { useNavigate } from 'react-router-dom';

const AdminOptimizedLoginForm: React.FC = () => {
  const navigate = useNavigate();
  const { login, checkStoredCredentials, isLoading, error, clearError } = useConsolidatedGP51Auth();
  
  const [password, setPassword] = useState('');
  const [hasStoredCredentials, setHasStoredCredentials] = useState(false);
  const [showQuickLogin, setShowQuickLogin] = useState(false);

  // Fixed admin username
  const adminUsername = 'octopus';

  useEffect(() => {
    const checkCredentials = async () => {
      const hasStored = await checkStoredCredentials(adminUsername);
      setHasStoredCredentials(hasStored);
      setShowQuickLogin(hasStored);
    };
    
    checkCredentials();
  }, [checkStoredCredentials]);

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (error) clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      return;
    }
    
    console.log('🔑 Admin login attempt for octopus account...');
    
    const result = await login(adminUsername, password);
    
    if (result.success) {
      console.log('✅ Admin login successful, navigating to dashboard...');
      navigate('/');
    } else {
      console.error('❌ Admin login failed:', result.error);
    }
  };

  const handleQuickLogin = async () => {
    if (!hasStoredCredentials) return;
    
    // Use stored credentials - the backend will handle this
    const result = await login(adminUsername, 'stored_credentials');
    
    if (result.success) {
      console.log('✅ Admin quick login successful, navigating to dashboard...');
      navigate('/');
    } else {
      console.error('❌ Admin quick login failed:', result.error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Admin Quick Access */}
      {hasStoredCredentials && showQuickLogin && (
        <Alert className="border-blue-200 bg-blue-50">
          <Crown className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <div className="flex items-center justify-between">
              <span className="font-medium">Admin credentials detected</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleQuickLogin}
                disabled={isLoading}
                className="ml-3 border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <Key className="mr-2 h-3 w-3" />
                    Quick Admin Login
                  </>
                )}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Standard Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username" className="text-sm font-medium text-gray-700">
            Admin Username
          </Label>
          <div className="relative">
            <Input
              id="username"
              type="text"
              value={adminUsername}
              disabled={true}
              className="bg-gray-50 border-gray-300 text-gray-700 font-mono"
            />
            <Badge 
              variant="secondary" 
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-100 text-blue-800 text-xs"
            >
              Admin
            </Badge>
          </div>
          <p className="text-xs text-gray-500">
            Fixed admin account for system management
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-gray-700">
            GP51 Password
          </Label>
          <Input
            id="password"
            type="password"
            placeholder={hasStoredCredentials 
              ? "Enter password or use Quick Login above" 
              : "Enter your GP51 octopus account password"
            }
            value={password}
            onChange={(e) => handlePasswordChange(e.target.value)}
            required
            className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          {hasStoredCredentials && (
            <p className="text-xs text-green-600">
              ✓ Stored credentials available for quick access
            </p>
          )}
        </div>
        
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Authentication Failed:</strong> {error}
            </AlertDescription>
          </Alert>
        )}

        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-2.5 transition-all duration-200 shadow-lg hover:shadow-xl"
          disabled={isLoading || !password.trim()}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Authenticating with GP51...
            </>
          ) : (
            <>
              <Crown className="mr-2 h-4 w-4" />
              Access Admin Portal
            </>
          )}
        </Button>
      </form>

      {/* Admin Help */}
      <div className="text-xs text-center text-gray-500 bg-gray-50 rounded-lg p-3">
        <div className="font-medium text-gray-700 mb-1">Admin Access Information</div>
        <div>• Uses GP51 octopus account credentials</div>
        <div>• Provides full system administrative access</div>
        <div>• Credentials are securely stored and validated</div>
      </div>
    </div>
  );
};

export default AdminOptimizedLoginForm;
