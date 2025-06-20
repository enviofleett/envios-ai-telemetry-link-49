
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Zap, AlertCircle, CheckCircle, WifiOff } from 'lucide-react';
import { useConsolidatedGP51Auth } from '@/hooks/useConsolidatedGP51Auth';
import { useNavigate } from 'react-router-dom';

const OptimizedLoginForm: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useConsolidatedGP51Auth();
  
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'failed'>('unknown');

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username || !formData.password) {
      return;
    }
    
    console.log('🔑 Submitting GP51 login form...');
    
    const result = await login(formData.username, formData.password);
    
    if (result.success) {
      setConnectionStatus('connected');
      console.log('✅ Login successful, navigating to dashboard...');
      navigate('/');
    } else {
      setConnectionStatus('failed');
      console.error('❌ Login failed:', result.error);
    }
  };

  const getConnectionStatusBadge = () => {
    switch (connectionStatus) {
      case 'connected':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Connected
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive">
            <WifiOff className="h-3 w-3 mr-1" />
            Connection Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <AlertCircle className="h-3 w-3 mr-1" />
            Ready to Connect
          </Badge>
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-12 h-12 bg-gradient-to-r from-blue-500 to-teal-500 rounded-xl flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              FleetIQ Login
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              Connect to GP51 Telemetry System
            </CardDescription>
          </div>
          
          {/* Connection Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">GP51 Status:</span>
            {getConnectionStatusBadge()}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your GP51 username"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                required
                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                required
                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>
            
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white font-medium py-2.5 transition-all duration-200 shadow-lg hover:shadow-xl"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting to GP51...
                </>
              ) : (
                'Connect to Telemetry'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default OptimizedLoginForm;
