
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useImportPreviewData } from '@/hooks/useImportPreviewData';
import { useImportApproval } from '@/hooks/useImportApproval';
import { CheckCircle, XCircle, AlertTriangle, Database } from 'lucide-react';
import type { Json } from '@/integrations/supabase/types';

// Helper function to safely convert Json to array
function jsonToArray(jsonData: Json): any[] {
  if (Array.isArray(jsonData)) {
    return jsonData;
  }
  if (typeof jsonData === 'string') {
    try {
      const parsed = JSON.parse(jsonData);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

const ImportDataTable: React.FC = () => {
  const { previewData, isLoading, summary } = useImportPreviewData();
  const { approveImport, rejectImport, isProcessing } = useImportApproval();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Preview Data...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!previewData || previewData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Import Preview Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-8">
            <div className="text-gray-500 mb-4">No preview data available</div>
            <p className="text-sm text-gray-400">
              Generate a preview first to see importable data
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleApprove = async (recordId: string) => {
    await approveImport([recordId]);
  };

  const handleReject = async (recordId: string) => {
    await rejectImport([recordId]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Import Preview Data ({previewData.length} records)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-600">{summary.totalRecords}</div>
              <div className="text-xs text-gray-600">Total Records</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-600">{summary.eligible}</div>
              <div className="text-xs text-gray-600">Eligible</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-lg font-bold text-yellow-600">{summary.conflicts}</div>
              <div className="text-xs text-gray-600">Conflicts</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-lg font-bold text-purple-600">{summary.totalVehicles}</div>
              <div className="text-xs text-gray-600">Total Vehicles</div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {previewData.map((record) => {
            const vehicleData = jsonToArray(record.raw_vehicle_data);
            const conflictFlags = jsonToArray(record.conflict_flags);
            
            return (
              <div key={record.id} className="border rounded-lg p-4 bg-white">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="font-medium text-gray-900">{record.gp51_username}</div>
                    <Badge 
                      variant={record.import_eligibility === 'eligible' ? 'default' : 'destructive'}
                    >
                      {record.import_eligibility}
                    </Badge>
                    <Badge 
                      variant={record.review_status === 'approved' ? 'default' : 'secondary'}
                    >
                      {record.review_status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {record.review_status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(record.id)}
                          disabled={isProcessing || record.import_eligibility !== 'eligible'}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(record.id)}
                          disabled={isProcessing}
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Vehicles:</span>
                    <span className="ml-2">{vehicleData.length}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Conflicts:</span>
                    <span className="ml-2">{conflictFlags.length}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Created:</span>
                    <span className="ml-2">{new Date(record.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {conflictFlags.length > 0 && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium">Conflicts Detected</span>
                    </div>
                    <div className="text-sm text-yellow-700 mt-1">
                      {conflictFlags.length} conflict(s) need resolution before import
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default ImportDataTable;
