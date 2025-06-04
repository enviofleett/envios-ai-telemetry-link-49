
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ExtractionJob } from '@/types/extraction';
import ExtractionForm from './extraction/ExtractionForm';
import JobsList from './extraction/JobsList';

const BulkExtractionManager: React.FC = () => {
  const [jobs, setJobs] = useState<ExtractionJob[]>([]);
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

  useEffect(() => {
    loadJobs();
  }, []);

  return (
    <div className="space-y-6">
      <ExtractionForm onJobStarted={loadJobs} />
      <JobsList jobs={jobs} />
    </div>
  );
};

export default BulkExtractionManager;
