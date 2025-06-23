
import React, { useState, useEffect } from 'react';
import { ExtractionJob } from '@/types/extraction';
import { ImportJob } from '@/types/import-job';
import { supabase } from '@/integrations/supabase/client';
import ImportMonitorEnhanced from './ImportMonitorEnhanced';
import ImportJobsList from './ImportJobsList';
import ExtractionJobsList from './ExtractionJobsList';

interface JobsListProps {
  jobs: ExtractionJob[];
  onJobsUpdate?: () => void;
}

const JobsList: React.FC<JobsListProps> = ({ jobs, onJobsUpdate }) => {
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [activeImportJob, setActiveImportJob] = useState<string | null>(null);
  const [importJobs, setImportJobs] = useState<ImportJob[]>([]);

  const loadImportJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('user_import_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setImportJobs((data || []) as ImportJob[]);
      
      // Find any active import job
      const activeJob = (data || []).find((job: any) => job.status === 'processing');
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

  const downloadExtractionResults = (job: ExtractionJob) => {
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

  const downloadImportResults = (job: ImportJob) => {
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

  const hasAnyJobs = jobs.length > 0 || importJobs.length > 0;

  return (
    <div className="space-y-6">
      {/* Active Import Monitor */}
      {activeImportJob && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Active Import Monitor</h3>
          <ImportMonitorEnhanced 
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
      <ImportJobsList
        importJobs={importJobs}
        expandedJobId={expandedJobId}
        onToggleDetails={toggleJobDetails}
        onDownloadResults={downloadImportResults}
      />

      {/* Extraction Jobs Section */}
      <ExtractionJobsList
        jobs={jobs}
        expandedJobId={expandedJobId}
        onToggleDetails={toggleJobDetails}
        onDownloadResults={downloadExtractionResults}
      />

      {/* No Jobs Message */}
      {!hasAnyJobs && (
        <div className="text-center py-8 text-gray-500">
          No jobs found. Start your first bulk extraction or passwordless import above.
        </div>
      )}
    </div>
  );
};

export default JobsList;
