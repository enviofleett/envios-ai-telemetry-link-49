
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useImportPreviewData } from '@/hooks/useImportPreviewData';
import { useImportApproval } from '@/hooks/useImportApproval';
import { Play, FileCheck, Download, RotateCcw } from 'lucide-react';

const ImportActionControls: React.FC = () => {
  const [jobName, setJobName] = useState('');
  const [targetUsernames, setTargetUsernames] = useState('');
  const { 
    initiatePreview, 
    approveImport, 
    rejectImport, 
    isProcessing 
  } = useImportApproval();
  const { previewData, summary } = useImportPreviewData();

  const handleInitiatePreview = async () => {
    if (!jobName.trim()) {
      alert('Please enter a job name');
      return;
    }

    const usernames = targetUsernames
      .split(',')
      .map(u => u.trim())
      .filter(u => u.length > 0);

    if (usernames.length === 0) {
      alert('Please enter at least one GP51 username');
      return;
    }

    await initiatePreview({
      jobName: jobName.trim(),
      targetUsernames: usernames
    });
  };

  const handleApproveAll = async () => {
    if (!previewData || previewData.length === 0) {
      alert('No preview data available to approve');
      return;
    }

    const eligibleRecords = previewData.filter(
      record => record.import_eligibility === 'eligible' && record.review_status === 'pending'
    );

    if (eligibleRecords.length === 0) {
      alert('No eligible records to approve');
      return;
    }

    await approveImport(eligibleRecords.map(r => r.id));
  };

  const handleExportReport = () => {
    if (!previewData || previewData.length === 0) {
      alert('No data available to export');
      return;
    }

    const reportData = previewData.map(record => {
      const vehicleData = Array.isArray(record.raw_vehicle_data) ? record.raw_vehicle_data : [];
      const conflictFlags = Array.isArray(record.conflict_flags) ? record.conflict_flags : [];
      
      return {
        gp51_username: record.gp51_username,
        review_status: record.review_status,
        import_eligibility: record.import_eligibility,
        vehicle_count: vehicleData.length,
        conflicts: conflictFlags.length,
        created_at: record.created_at
      };
    });

    const csvContent = [
      ['Username', 'Status', 'Eligibility', 'Vehicles', 'Conflicts', 'Created'],
      ...reportData.map(row => [
        row.gp51_username,
        row.review_status,
        row.import_eligibility,
        row.vehicle_count,
        row.conflicts,
        new Date(row.created_at).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gp51-import-review-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Initiate Data Preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="job-name">Job Name</Label>
            <Input
              id="job-name"
              value={jobName}
              onChange={(e) => setJobName(e.target.value)}
              placeholder="Enter descriptive job name"
            />
          </div>
          
          <div>
            <Label htmlFor="target-usernames">GP51 Usernames</Label>
            <Input
              id="target-usernames"
              value={targetUsernames}
              onChange={(e) => setTargetUsernames(e.target.value)}
              placeholder="Enter usernames separated by commas"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Example: user1, user2, user3
            </p>
          </div>
          
          <Button 
            onClick={handleInitiatePreview}
            disabled={isProcessing}
            className="w-full"
          >
            <Play className="h-4 w-4 mr-2" />
            {isProcessing ? 'Processing...' : 'Start Data Preview'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Review Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {summary && (
            <div className="text-sm space-y-1 mb-4">
              <div>Total Records: {summary.totalRecords}</div>
              <div>Eligible for Import: {summary.eligible}</div>
              <div>Conflicts: {summary.conflicts}</div>
            </div>
          )}
          
          <Button 
            onClick={handleApproveAll}
            disabled={isProcessing || !summary?.eligible}
            className="w-full"
            variant="default"
          >
            <FileCheck className="h-4 w-4 mr-2" />
            Approve Eligible Records ({summary?.eligible || 0})
          </Button>
          
          <Button 
            onClick={handleExportReport}
            disabled={!previewData || previewData.length === 0}
            className="w-full"
            variant="outline"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Review Report
          </Button>
          
          <Button 
            onClick={() => window.location.reload()}
            className="w-full"
            variant="outline"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImportActionControls;
