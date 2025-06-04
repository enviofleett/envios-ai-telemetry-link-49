
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExtractionJob } from '@/types/extraction';
import { supabase } from '@/integrations/supabase/client';
import JobCard from './JobCard';
import ImportMonitor from './ImportMonitor';

interface JobsListProps {
  jobs: ExtractionJob[];
  onJobsUpdate?: () => void;
}

const JobsList: React.FC<JobsListProps> = ({ jobs, onJobsUpdate }) => {
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [activeImportJob, setActiveImportJob] = useState<string | null>(null);
  const [importJobs, setImportJobs] = useState<any[]>([]);

  const loadImportJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('user_import_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setImportJobs(data || []);
      
      // Find any active import job
      const activeJob = data?.find(job => job.status === 'processing');
      if (activeJob) {
        setActiveImportJob(activeJob.id);
      } else {
        setActiveImportJob(null);
      }
    } catch (error) {
      console.error('Failed to load import jobs:', error);
    }
  };

  useEffect(() => {
    loadImportJobs();

    // Set up real-time subscription for import jobs
    const channel = supabase
      .channel('import-jobs-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_import_jobs'
        },
        (payload) => {
          console.log('Import job update:', payload);
          loadImportJobs();
          onJobsUpdate?.();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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

  const downloadImportResults = (job: any) => {
    if (!job.import_results) return;

    const blob = new Blob([JSON.stringify(job.import_results, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${job.job_name}-import-results.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleJobDetails = (jobId: string) => {
    setExpandedJobId(expandedJobId === jobId ? null : jobId);
  };

  return (
    <div className="space-y-6">
      {/* Active Import Monitor */}
      {activeImportJob && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Active Import Monitor</h3>
          <ImportMonitor 
            jobId={activeImportJob} 
            onJobComplete={() => {
              setActiveImportJob(null);
              loadImportJobs();
              onJobsUpdate?.();
            }}
          />
        </div>
      )}

      {/* Import Jobs Section */}
      {importJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Passwordless Import Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {importJobs.map((job) => (
                <div key={job.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{job.job_name}</h3>
                    <div className="flex items-center gap-2">
                      {job.status === 'completed' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Completed
                        </span>
                      )}
                      {job.status === 'processing' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Processing
                        </span>
                      )}
                      {job.status === 'failed' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Failed
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Total Users:</span>
                      <p className="font-medium">{job.total_usernames}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Successful:</span>
                      <p className="font-medium text-green-600">{job.successful_imports}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Failed:</span>
                      <p className="font-medium text-red-600">{job.failed_imports}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Vehicles:</span>
                      <p className="font-medium">{job.total_vehicles_imported}</p>
                    </div>
                  </div>

                  {job.status === 'processing' && job.progress_percentage && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{job.processed_usernames} / {job.total_usernames}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${job.progress_percentage}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                      onClick={() => toggleJobDetails(job.id)}
                    >
                      {expandedJobId === job.id ? 'Hide Details' : 'View Details'}
                    </button>
                    
                    {job.import_results && (
                      <button
                        className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                        onClick={() => downloadImportResults(job)}
                      >
                        Download Results
                      </button>
                    )}
                  </div>

                  {expandedJobId === job.id && (
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
                          <h4 className="font-medium text-red-600 mb-2">Failed Users ({job.error_log.length})</h4>
                          <div className="bg-red-50 p-3 rounded max-h-40 overflow-y-auto">
                            {job.error_log.map((error: any, index: number) => (
                              <div key={index} className="text-sm mb-2">
                                <strong>{error.username}:</strong> {error.error}
                                <div className="text-xs text-gray-500">{new Date(error.timestamp).toLocaleString()}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Regular Extraction Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>Bulk Extraction Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                isExpanded={expandedJobId === job.id}
                onToggleDetails={() => toggleJobDetails(job.id)}
                onDownload={() => downloadResults(job)}
              />
            ))}

            {jobs.length === 0 && importJobs.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No jobs found. Start your first bulk extraction or passwordless import above.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default JobsList;
