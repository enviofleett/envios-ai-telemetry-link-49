
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useGP51AuthConsolidated } from '@/hooks/useGP51AuthConsolidated';
import { Loader2, Key, CheckCircle, XCircle, RefreshCw, LogOut } from 'lucide-react';

const GP51AuthenticationPanel: React.FC = () => {
  const {
    isAuthenticated,
    username,
    tokenExpiresAt,
    isLoading,
    error,
    isCheckingStatus,
    login,
    logout,
    refreshStatus,
    clearError
  } = useGP51AuthConsolidated();

  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username.trim() || !formData.password.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter both username and password",
        variant: "destructive",
      });
      return;
    }

    const result = await login(formData.username, formData.password);
    
    if (result.success) {
      setFormData({ username: '', password: '' });
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const formatExpirationTime = (expiresAt: Date) => {
    const now = new Date();
    const timeLeft = expiresAt.getTime() - now.getTime();
    
    if (timeLeft <= 0) {
      return 'Expired';
    }
    
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m remaining`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          GP51 Authentication
        </CardTitle>
        <CardDescription>
          Authenticate with GP51 telemetry system to enable vehicle tracking and management
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Status Display */}
        <div className="p-4 border rounded-lg bg-muted/30">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium">Connection Status</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshStatus}
              disabled={isCheckingStatus}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isCheckingStatus ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {isCheckingStatus ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking status...
            </div>
          ) : isAuthenticated ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <Badge variant="default" className="bg-green-100 text-green-800">
                  Connected
                </Badge>
              </div>
              {username && (
                <p className="text-sm text-muted-foreground">
                  <strong>User:</strong> {username}
                </p>
              )}
              {tokenExpiresAt && (
                <p className="text-sm text-muted-foreground">
                  <strong>Session:</strong> {formatExpirationTime(tokenExpiresAt)}
                </p>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                disabled={isLoading}
                className="mt-2"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Disconnect
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <Badge variant="secondary" className="bg-red-100 text-red-800">
                Not Connected
              </Badge>
            </div>
          )}
        </div>

        {/* Authentication Form */}
        {!isAuthenticated && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gp51-username">GP51 Username</Label>
                <Input
                  id="gp51-username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  placeholder="Enter your GP51 username"
                  disabled={isLoading}
                  autoComplete="username"
                />
                <p className="text-xs text-muted-foreground">
                  Enter your GP51 telemetry system username (not email)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gp51-password">GP51 Password</Label>
                <div className="relative">
                  <Input
                    id="gp51-password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Enter your GP51 password"
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </Button>
                </div>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !formData.username.trim() || !formData.password.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Key className="mr-2 h-4 w-4" />
                  Connect to GP51
                </>
              )}
            </Button>
          </form>
        )}

        <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-md">
          <strong>Note:</strong> This authentication connects to the GP51 telemetry system 
          using your existing GP51 credentials. Once connected, the system can sync vehicle 
          data and provide real-time tracking capabilities.
        </div>
      </CardContent>
    </Card>
  );
};

export default GP51AuthenticationPanel;
