
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, Download, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Json } from '@/integrations/supabase/types';

interface ExtractionJob {
  id: string;
  job_name: string;
  status: string;
  total_accounts: number;
  processed_accounts: number;
  successful_accounts: number;
  failed_accounts: number;
  total_vehicles: number;
  created_at: string;
  completed_at?: string | null;
  extracted_data?: Json;
  error_log?: Json;
}

const BulkExtractionManager: React.FC = () => {
  const [jobName, setJobName] = useState('');
  const [credentialsText, setCredentialsText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [jobs, setJobs] = useState<ExtractionJob[]>([]);
  const [currentJob, setCurrentJob] = useState<ExtractionJob | null>(null);
  const { toast } = useToast();

  const loadJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('bulk_extraction_jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Failed to load jobs:', error);
      toast({
        title: "Error",
        description: "Failed to load extraction jobs",
        variant: "destructive"
      });
    }
  };

  React.useEffect(() => {
    loadJobs();
  }, []);

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
      loadJobs();

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

  const downloadResults = (job: ExtractionJob) => {
    if (!job.extracted_data) return;

    const blob = new Blob([JSON.stringify(job.extracted_data, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${job.job_name}-extraction-results.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800"><Clock className="w-3 h-3 mr-1" />Processing</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
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

      <Card>
        <CardHeader>
          <CardTitle>Extraction Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {jobs.map((job) => (
              <div key={job.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{job.job_name}</h3>
                  {getStatusBadge(job.status)}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total Accounts:</span>
                    <p className="font-medium">{job.total_accounts}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Successful:</span>
                    <p className="font-medium text-green-600">{job.successful_accounts}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Failed:</span>
                    <p className="font-medium text-red-600">{job.failed_accounts}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Vehicles:</span>
                    <p className="font-medium">{job.total_vehicles}</p>
                  </div>
                </div>

                {job.status === 'processing' && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{job.processed_accounts} / {job.total_accounts}</span>
                    </div>
                    <Progress 
                      value={(job.processed_accounts / job.total_accounts) * 100} 
                      className="w-full"
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentJob(currentJob?.id === job.id ? null : job)}
                  >
                    {currentJob?.id === job.id ? 'Hide Details' : 'View Details'}
                  </Button>
                  
                  {job.extracted_data && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadResults(job)}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download Results
                    </Button>
                  )}
                </div>

                {currentJob?.id === job.id && (
                  <div className="mt-4 space-y-3 border-t pt-3">
                    <div className="text-sm">
                      <span className="text-gray-600">Started:</span> {new Date(job.created_at).toLocaleString()}
                      {job.completed_at && (
                        <>
                          <br />
                          <span className="text-gray-600">Completed:</span> {new Date(job.completed_at).toLocaleString()}
                        </>
                      )}
                    </div>

                    {job.error_log && Array.isArray(job.error_log) && job.error_log.length > 0 && (
                      <div>
                        <h4 className="font-medium text-red-600 mb-2">Failed Accounts ({job.error_log.length})</h4>
                        <div className="bg-red-50 p-3 rounded max-h-40 overflow-y-auto">
                          {job.error_log.map((error: any, index: number) => (
                            <div key={index} className="text-sm mb-2">
                              <strong>{error.username}:</strong> {error.error}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {jobs.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No extraction jobs found. Start your first bulk extraction above.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BulkExtractionManager;
