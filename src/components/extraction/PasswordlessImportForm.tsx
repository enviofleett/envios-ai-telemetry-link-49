
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { UserPlus, AlertCircle, Info, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

interface PasswordlessImportFormProps {
  onJobStarted: () => void;
}

const PasswordlessImportForm: React.FC<PasswordlessImportFormProps> = ({ onJobStarted }) => {
  const [jobName, setJobName] = useState('');
  const [usernamesText, setUsernamesText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  // Check GP51 connection status
  const { data: gp51Status, isLoading: statusLoading } = useQuery({
    queryKey: ['gp51-status'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('settings-management', {
        body: { action: 'get-gp51-status' }
      });
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const parseUsernames = (text: string) => {
    const lines = text.trim().split('\n').filter(line => line.trim());
    return lines.map(line => line.trim());
  };

  const startPasswordlessImport = async () => {
    if (!jobName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a job name",
        variant: "destructive"
      });
      return;
    }

    const usernames = parseUsernames(usernamesText);
    if (usernames.length === 0) {
      toast({
        title: "Error",
        description: "Please enter at least one username to import",
        variant: "destructive"
      });
      return;
    }

    if (!gp51Status?.connected) {
      toast({
        title: "Error",
        description: "GP51 credentials not configured. Please set up connection in Admin Settings.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      const response = await supabase.functions.invoke('passwordless-gp51-import', {
        body: {
          jobName: jobName.trim(),
          targetUsernames: usernames
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast({
        title: "Success",
        description: `Started automated passwordless import for ${usernames.length} users using stored GP51 credentials`,
      });

      setJobName('');
      setUsernamesText('');
      onJobStarted();

    } catch (error) {
      console.error('Passwordless import failed:', error);
      toast({
        title: "Error",
        description: `Failed to start import: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getConnectionStatus = () => {
    if (statusLoading) return { icon: null, text: 'Checking...', variant: 'secondary' as const };
    if (gp51Status?.connected) {
      return { 
        icon: <CheckCircle className="h-4 w-4" />, 
        text: 'Connected', 
        variant: 'default' as const 
      };
    }
    return { 
      icon: <XCircle className="h-4 w-4" />, 
      text: 'Not Connected', 
      variant: 'destructive' as const 
    };
  };

  const status = getConnectionStatus();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          Automated Passwordless User Import
          <Badge variant="outline" className="text-xs">
            Uses Stored Credentials
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Import GP51 users using stored admin credentials. No manual password input required.
          </AlertDescription>
        </Alert>

        {/* GP51 Connection Status */}
        <div className="p-3 border rounded-lg bg-gray-50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">GP51 Connection Status:</span>
            <Badge variant={status.variant} className="flex items-center gap-1">
              {status.icon}
              {status.text}
            </Badge>
          </div>
          {gp51Status?.connected && gp51Status?.username && (
            <p className="text-xs text-gray-600 mt-1">
              Connected as: {gp51Status.username}
            </p>
          )}
          {gp51Status?.connected && gp51Status?.expiresAt && (
            <p className="text-xs text-gray-600">
              Token expires: {new Date(gp51Status.expiresAt).toLocaleString()}
            </p>
          )}
        </div>

        {!gp51Status?.connected && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              GP51 credentials not configured. Please set up the connection in Admin Settings before proceeding.
            </AlertDescription>
          </Alert>
        )}

        <div>
          <Label htmlFor="jobName">Job Name</Label>
          <Input
            id="jobName"
            value={jobName}
            onChange={(e) => setJobName(e.target.value)}
            placeholder="e.g., Q1 2024 User Migration"
            disabled={isProcessing}
          />
        </div>

        <div>
          <Label htmlFor="usernames">GP51 Usernames to Import</Label>
          <Textarea
            id="usernames"
            value={usernamesText}
            onChange={(e) => setUsernamesText(e.target.value)}
            placeholder="username1&#10;username2&#10;username3"
            rows={6}
            disabled={isProcessing}
          />
          <p className="text-sm text-gray-600 mt-1">
            Enter one username per line
          </p>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This will create Envio accounts for the specified GP51 users using the stored admin credentials. 
            Users will receive temporary accounts and must set their passwords through GP51 validation.
          </AlertDescription>
        </Alert>

        <Button 
          onClick={startPasswordlessImport} 
          disabled={isProcessing || !gp51Status?.connected}
          className="w-full"
        >
          {isProcessing ? 'Processing...' : 'Start Automated Import'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PasswordlessImportForm;
