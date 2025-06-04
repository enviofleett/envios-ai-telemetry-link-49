
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ImportReviewSummary from '@/components/review/ImportReviewSummary';
import ImportDataTable from '@/components/review/ImportDataTable';
import ImportActionControls from '@/components/review/ImportActionControls';
import { Database, FileCheck, AlertTriangle } from 'lucide-react';

const DataImportReview: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">GP51 Data Import Review</h1>
        <p className="text-gray-600 mt-2">
          Review and approve GP51 data before importing into Envio system
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Preview Mode</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Safe Review</div>
            <p className="text-xs text-muted-foreground">
              Review data without affecting live system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conflict Detection</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Auto-Detect</div>
            <p className="text-xs text-muted-foreground">
              Identify duplicates and conflicts automatically
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approval Workflow</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Staged Import</div>
            <p className="text-xs text-muted-foreground">
              Approve changes before final import
            </p>
          </CardContent>
        </Card>
      </div>

      <ImportReviewSummary />
      <ImportActionControls />
      <ImportDataTable />
    </div>
  );
};

export default DataImportReview;
