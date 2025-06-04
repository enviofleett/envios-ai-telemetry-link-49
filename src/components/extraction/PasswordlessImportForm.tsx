
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import GP51ConnectionStatus from './GP51ConnectionStatus';
import PasswordlessImportFormFields from './PasswordlessImportFormFields';
import PasswordlessImportWarnings from './PasswordlessImportWarnings';

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
        <PasswordlessImportWarnings gp51Connected={gp51Status?.connected || false} />

        <GP51ConnectionStatus 
          gp51Status={gp51Status} 
          statusLoading={statusLoading} 
        />

        <PasswordlessImportFormFields
          jobName={jobName}
          setJobName={setJobName}
          usernamesText={usernamesText}
          setUsernamesText={setUsernamesText}
          isProcessing={isProcessing}
        />

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
