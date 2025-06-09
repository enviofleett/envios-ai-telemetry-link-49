
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle, 
  Upload,
  FileText
} from 'lucide-react';
import { ImportPreviewData } from '@/types/csv-import';

interface CSVImportPreviewProps {
  previewData: ImportPreviewData;
  onStartImport: () => void;
  isProcessing: boolean;
}

const CSVImportPreview: React.FC<CSVImportPreviewProps> = ({
  previewData,
  onStartImport,
  isProcessing
}) => {
  const { summary, valid_rows, invalid_rows, conflicts } = previewData;
  const hasErrors = invalid_rows.length > 0;
  const hasConflicts = conflicts.length > 0;
  const canImport = valid_rows.length > 0 && !hasErrors;

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Import Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded">
              <div className="text-2xl font-bold text-blue-600">{summary.total_rows}</div>
              <div className="text-sm text-blue-700">Total Rows</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded">
              <div className="text-2xl font-bold text-green-600">{summary.valid_rows}</div>
              <div className="text-sm text-green-700">Valid Rows</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded">
              <div className="text-2xl font-bold text-red-600">{summary.invalid_rows}</div>
              <div className="text-sm text-red-700">Invalid Rows</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded">
              <div className="text-2xl font-bold text-yellow-600">{summary.conflicts}</div>
              <div className="text-sm text-yellow-700">Conflicts</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {hasErrors && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {invalid_rows.length} row(s) contain validation errors and must be fixed before importing.
          </AlertDescription>
        </Alert>
      )}

      {hasConflicts && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {conflicts.length} row(s) have conflicts that need to be resolved.
          </AlertDescription>
        </Alert>
      )}

      {canImport && !hasConflicts && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            All rows are valid and ready for import!
          </AlertDescription>
        </Alert>
      )}

      {/* Valid Rows Preview */}
      {valid_rows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Valid Rows ({valid_rows.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Device ID</th>
                    <th className="text-left p-2">Device Name</th>
                    <th className="text-left p-2">Type</th>
                    <th className="text-left p-2">SIM Number</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Assigned User</th>
                  </tr>
                </thead>
                <tbody>
                  {valid_rows.slice(0, 5).map((row, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2 font-mono">{row.device_id}</td>
                      <td className="p-2">{row.device_name}</td>
                      <td className="p-2">{row.device_type || '-'}</td>
                      <td className="p-2">{row.sim_number || '-'}</td>
                      <td className="p-2">
                        <Badge variant="outline">{row.status}</Badge>
                      </td>
                      <td className="p-2">{row.assigned_user_email || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {valid_rows.length > 5 && (
                <p className="text-sm text-gray-600 mt-2 text-center">
                  And {valid_rows.length - 5} more rows...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invalid Rows */}
      {invalid_rows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Invalid Rows ({invalid_rows.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {invalid_rows.slice(0, 5).map((row, index) => (
                <div key={index} className="border border-red-200 rounded p-3 bg-red-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-red-800">Row {row.row_number}</span>
                    <Badge variant="destructive">{row.errors.length} error(s)</Badge>
                  </div>
                  <div className="space-y-1">
                    {row.errors.map((error, errorIndex) => (
                      <div key={errorIndex} className="text-sm text-red-700">
                        <span className="font-medium">{error.field_name}:</span> {error.error_message}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {invalid_rows.length > 5 && (
                <p className="text-sm text-gray-600 text-center">
                  And {invalid_rows.length - 5} more invalid rows...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conflicts */}
      {conflicts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              Conflicts ({conflicts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {conflicts.map((conflict, index) => (
                <div key={index} className="border border-yellow-200 rounded p-3 bg-yellow-50">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-yellow-800">
                      Row {conflict.row_number}: {conflict.device_id}
                    </span>
                    <Badge variant="outline" className="border-yellow-600 text-yellow-800">
                      {conflict.conflict_type === 'duplicate_device_id' ? 'Duplicate Device' : 'User Not Found'}
                    </Badge>
                  </div>
                  {conflict.conflict_type === 'duplicate_device_id' && (
                    <p className="text-sm text-yellow-700 mt-1">
                      Device ID already exists in the system
                    </p>
                  )}
                  {conflict.conflict_type === 'user_not_found' && (
                    <p className="text-sm text-yellow-700 mt-1">
                      Assigned user email not found in the system
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Actions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Ready to import?</h3>
              <p className="text-sm text-gray-600">
                {canImport && !hasConflicts 
                  ? `${valid_rows.length} valid row(s) will be imported`
                  : hasErrors 
                    ? 'Please fix validation errors before importing'
                    : 'Please resolve conflicts before importing'
                }
              </p>
            </div>
            <Button 
              onClick={onStartImport}
              disabled={!canImport || hasConflicts || isProcessing}
              size="lg"
            >
              <Upload className="w-4 h-4 mr-2" />
              Start Import
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CSVImportPreview;
