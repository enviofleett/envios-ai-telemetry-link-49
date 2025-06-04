
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ExtractionJob } from '@/types/extraction';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ExtractionForm from './extraction/ExtractionForm';
import PasswordlessImportForm from './extraction/PasswordlessImportForm';
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
      <Tabs defaultValue="extraction" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="extraction">Data Extraction</TabsTrigger>
          <TabsTrigger value="passwordless">Passwordless Import</TabsTrigger>
        </TabsList>
        
        <TabsContent value="extraction" className="space-y-6">
          <ExtractionForm onJobStarted={loadJobs} />
        </TabsContent>
        
        <TabsContent value="passwordless" className="space-y-6">
          <PasswordlessImportForm onJobStarted={loadJobs} />
        </TabsContent>
      </Tabs>

      <JobsList jobs={jobs} />
    </div>
  );
};

export default BulkExtractionManager;
