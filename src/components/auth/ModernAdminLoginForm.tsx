
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Key, AlertCircle, Crown, Shield } from 'lucide-react';
import { useConsolidatedGP51Auth } from '@/hooks/useConsolidatedGP51Auth';
import { useNavigate } from 'react-router-dom';

const ModernAdminLoginForm: React.FC = () => {
  const navigate = useNavigate();
  const { login, checkStoredCredentials, isLoading, error, clearError } = useConsolidatedGP51Auth();
  
  const [password, setPassword] = useState('');
  const [hasStoredCredentials, setHasStoredCredentials] = useState(false);

  const adminUsername = 'octopus';

  useEffect(() => {
    const checkCredentials = async () => {
      const hasStored = await checkStoredCredentials(adminUsername);
      setHasStoredCredentials(hasStored);
    };
    
    checkCredentials();
  }, [checkStoredCredentials]);

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (error) clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) return;
    
    const result = await login(adminUsername, password);
    
    if (result.success) {
      navigate('/');
    }
  };

  const handleQuickLogin = async () => {
    if (!hasStoredCredentials) return;
    
    const result = await login(adminUsername, 'stored_credentials');
    
    if (result.success) {
      navigate('/');
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
          <Shield className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h2>
        <p className="text-gray-600">Access your EnvioFleet admin dashboard</p>
      </div>

      {/* Quick Login Option */}
      {hasStoredCredentials && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Key className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900">Quick Access Available</p>
                <p className="text-xs text-blue-700">Use stored admin credentials</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleQuickLogin}
              disabled={isLoading}
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Quick Login'
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="username" className="text-sm font-medium text-gray-900">
            Admin Username
          </Label>
          <div className="relative">
            <Input
              id="username"
              type="text"
              value={adminUsername}
              disabled={true}
              className="bg-gray-50 border-gray-200 text-gray-700 font-mono h-12 px-4 rounded-xl"
            />
            <Badge 
              variant="secondary" 
              className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-blue-100 text-blue-800 text-xs px-2 py-1"
            >
              Admin
            </Badge>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-gray-900">
            GP51 Password
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => handlePasswordChange(e.target.value)}
            required
            className="h-12 px-4 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
            disabled={isLoading}
          />
          {hasStoredCredentials && (
            <p className="text-xs text-green-600 flex items-center space-x-1">
              <span className="w-1 h-1 bg-green-500 rounded-full"></span>
              <span>Stored credentials available</span>
            </p>
          )}
        </div>
        
        {error && (
          <Alert className="border-red-200 bg-red-50 rounded-xl">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Authentication Failed:</strong> {error}
            </AlertDescription>
          </Alert>
        )}

        <Button
          type="submit"
          className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
          disabled={isLoading || !password.trim()}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Authenticating...
            </>
          ) : (
            <>
              <Crown className="mr-2 h-4 w-4" />
              Access Admin Portal
            </>
          )}
        </Button>
      </form>

      {/* Footer Info */}
      <div className="mt-8 text-center">
        <p className="text-xs text-gray-500">
          Secure administrative access to EnvioFleet management system
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Powered by GP51 • Enterprise Security
        </p>
      </div>
    </div>
  );
};

export default ModernAdminLoginForm;
