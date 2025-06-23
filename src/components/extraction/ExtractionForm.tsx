
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ExtractionFormProps {
  onJobStarted: () => void;
}

const ExtractionForm: React.FC<ExtractionFormProps> = ({ onJobStarted }) => {
  const [jobName, setJobName] = useState('');
  const [credentialsText, setCredentialsText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const parseCredentials = (text: string) => {
    const lines = text.trim().split('\n').filter(line => line.trim());
    const credentials = [];

    for (const line of lines) {
      const parts = line.split(',').map(p => p.trim());
      if (parts.length >= 2) {
        credentials.push({
          username: parts[0],
          password: parts[1]
        });
      }
    }

    return credentials;
  };

  const startExtraction = async () => {
    if (!jobName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a job name",
        variant: "destructive"
      });
      return;
    }

    const credentials = parseCredentials(credentialsText);
    if (credentials.length === 0) {
      toast({
        title: "Error",
        description: "Please enter valid credentials (username,password per line)",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      const response = await supabase.functions.invoke('bulk-gp51-extraction', {
        body: {
          jobName: jobName.trim(),
          credentials
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast({
        title: "Success",
        description: `Started extraction job for ${credentials.length} accounts`,
      });

      setJobName('');
      setCredentialsText('');
      onJobStarted();

    } catch (error) {
      console.error('Extraction failed:', error);
      toast({
        title: "Error",
        description: `Failed to start extraction: ${error.message}`,
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
          <Upload className="w-5 h-5" />
          Start New Bulk Extraction
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="jobName">Job Name</Label>
          <Input
            id="jobName"
            value={jobName}
            onChange={(e) => setJobName(e.target.value)}
            placeholder="e.g., Production Migration - December 2024"
            disabled={isProcessing}
          />
        </div>

        <div>
          <Label htmlFor="credentials">GP51 Credentials</Label>
          <Textarea
            id="credentials"
            value={credentialsText}
            onChange={(e) => setCredentialsText(e.target.value)}
            placeholder="username1,password1&#10;username2,password2&#10;username3,password3"
            rows={6}
            disabled={isProcessing}
          />
          <p className="text-sm text-gray-600 mt-1">
            Enter one credential pair per line in format: username,password
          </p>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This will authenticate with each GP51 account and extract all associated vehicle data. 
            The process includes rate limiting to respect API limits.
          </AlertDescription>
        </Alert>

        <Button 
          onClick={startExtraction} 
          disabled={isProcessing}
          className="w-full"
        >
          {isProcessing ? 'Processing...' : 'Start Bulk Extraction'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ExtractionForm;
