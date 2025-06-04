
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserPlus, AlertCircle, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PasswordlessImportFormProps {
  onJobStarted: () => void;
}

const PasswordlessImportForm: React.FC<PasswordlessImportFormProps> = ({ onJobStarted }) => {
  const [jobName, setJobName] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [usernamesText, setUsernamesText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

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

    if (!adminUsername.trim() || !adminPassword.trim()) {
      toast({
        title: "Error",
        description: "Please enter admin GP51 credentials",
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

    setIsProcessing(true);

    try {
      const response = await supabase.functions.invoke('passwordless-gp51-import', {
        body: {
          jobName: jobName.trim(),
          adminGp51Username: adminUsername.trim(),
          adminGp51Password: adminPassword.trim(),
          targetUsernames: usernames
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast({
        title: "Success",
        description: `Started passwordless import for ${usernames.length} users`,
      });

      setJobName('');
      setAdminUsername('');
      setAdminPassword('');
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
          Passwordless User Import
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Import GP51 users without their passwords. Users will need to set their passwords later using GP51 validation.
          </AlertDescription>
        </Alert>

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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="adminUsername">Admin GP51 Username</Label>
            <Input
              id="adminUsername"
              value={adminUsername}
              onChange={(e) => setAdminUsername(e.target.value)}
              placeholder="Your GP51 admin username"
              disabled={isProcessing}
            />
          </div>
          <div>
            <Label htmlFor="adminPassword">Admin GP51 Password</Label>
            <Input
              id="adminPassword"
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Your GP51 admin password"
              disabled={isProcessing}
            />
          </div>
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
            This will create Envio accounts for the specified GP51 users. Users will receive temporary accounts 
            and must set their passwords through GP51 validation before gaining full access.
          </AlertDescription>
        </Alert>

        <Button 
          onClick={startPasswordlessImport} 
          disabled={isProcessing}
          className="w-full"
        >
          {isProcessing ? 'Processing...' : 'Start Passwordless Import'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PasswordlessImportForm;
