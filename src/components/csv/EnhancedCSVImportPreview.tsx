
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
  FileText,
  Users,
  Car,
  Zap,
  Eye
} from 'lucide-react';
import { EnhancedImportPreviewData } from '@/types/enhanced-csv-import';

interface EnhancedCSVImportPreviewProps {
  previewData: EnhancedImportPreviewData;
  onStartImport: () => void;
  isProcessing: boolean;
  gp51SyncEnabled: boolean;
}

const EnhancedCSVImportPreview: React.FC<EnhancedCSVImportPreviewProps> = ({
  previewData,
  onStartImport,
  isProcessing,
  gp51SyncEnabled
}) => {
  const { summary, valid_rows, invalid_rows, conflicts, gp51_validation } = previewData;
  const hasErrors = invalid_rows.length > 0;
  const hasConflicts = conflicts.length > 0;
  const canImport = valid_rows.length > 0 && !hasErrors;

  return (
    <div className="space-y-6">
      {/* Enhanced Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Enhanced Import Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded">
              <div className="text-2xl font-bold text-blue-600">{summary.total_rows}</div>
              <div className="text-sm text-blue-700">Total Rows</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded">
              <div className="text-2xl font-bold text-green-600">{summary.valid_rows}</div>
              <div className="text-sm text-green-700">Valid Rows</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded">
              <div className="text-2xl font-bold text-purple-600">{summary.unique_users}</div>
              <div className="text-sm text-purple-700">Unique Users</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded">
              <div className="text-2xl font-bold text-orange-600">{summary.unique_devices}</div>
              <div className="text-sm text-orange-700">Unique Devices</div>
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

      {/* GP51 Validation Summary */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Zap className="w-5 h-5" />
            GP51 Conformity Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-white rounded border">
              <div className="text-lg font-bold text-blue-600">{gp51_validation.auto_generated_usernames}</div>
              <div className="text-sm text-blue-700">Auto-generated Usernames</div>
            </div>
            <div className="text-center p-3 bg-white rounded border">
              <div className="text-lg font-bold text-yellow-600">{gp51_validation.username_conflicts}</div>
              <div className="text-sm text-yellow-700">Username Conflicts</div>
            </div>
            <div className="text-center p-3 bg-white rounded border">
              <div className="text-lg font-bold text-orange-600">{gp51_validation.device_type_issues}</div>
              <div className="text-sm text-orange-700">Device Type Mappings</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Alerts */}
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
            {conflicts.length} row(s) have conflicts that need resolution. Review the conflicts below.
          </AlertDescription>
        </Alert>
      )}

      {canImport && !hasConflicts && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            All rows are valid and ready for enhanced import with GP51 synchronization!
          </AlertDescription>
        </Alert>
      )}

      {/* Valid Rows Preview */}
      {valid_rows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Valid User-Vehicle Pairs ({valid_rows.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">User Name</th>
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">GP51 Username</th>
                    <th className="text-left p-2">Device ID</th>
                    <th className="text-left p-2">Device Name</th>
                    <th className="text-left p-2">Assignment</th>
                    <th className="text-left p-2">Flags</th>
                  </tr>
                </thead>
                <tbody>
                  {valid_rows.slice(0, 5).map((row, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2">{row.user_name}</td>
                      <td className="p-2">{row.user_email}</td>
                      <td className="p-2 font-mono">
                        {row.generated_username || row.gp51_username}
                        {row.generated_username && !row.gp51_username && (
                          <Badge variant="secondary" className="ml-1 text-xs">Auto</Badge>
                        )}
                      </td>
                      <td className="p-2 font-mono">{row.device_id}</td>
                      <td className="p-2">{row.device_name}</td>
                      <td className="p-2">
                        <Badge variant="outline">{row.assignment_type}</Badge>
                      </td>
                      <td className="p-2">
                        {row.validation_flags && row.validation_flags.length > 0 && (
                          <div className="flex gap-1">
                            {row.validation_flags.slice(0, 2).map((flag, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {flag.replace('_', ' ')}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </td>
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

      {/* Conflicts */}
      {conflicts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              Data Conflicts ({conflicts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {conflicts.slice(0, 5).map((conflict, index) => (
                <div key={index} className="border border-yellow-200 rounded p-3 bg-yellow-50">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-yellow-800">
                      Row {conflict.row_number}
                    </span>
                    <Badge variant="outline" className="border-yellow-600 text-yellow-800">
                      {conflict.conflict_type.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  {conflict.suggested_resolution && (
                    <p className="text-sm text-yellow-700 mt-1">
                      <strong>Suggestion:</strong> {conflict.suggested_resolution}
                    </p>
                  )}
                </div>
              ))}
              {conflicts.length > 5 && (
                <p className="text-sm text-gray-600 text-center">
                  And {conflicts.length - 5} more conflicts...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Actions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Ready for Enhanced Import?</h3>
              <p className="text-sm text-gray-600">
                {canImport && !hasConflicts 
                  ? `${valid_rows.length} rows will create ${summary.unique_users} users and ${summary.unique_devices} vehicles`
                  : hasErrors 
                    ? 'Please fix validation errors before importing'
                    : 'Review and resolve conflicts before importing'
                }
              </p>
              {gp51SyncEnabled && (
                <p className="text-sm text-blue-600 mt-1">
                  GP51 synchronization is enabled - data will be synced automatically
                </p>
              )}
            </div>
            <Button 
              onClick={onStartImport}
              disabled={!canImport || isProcessing}
              size="lg"
            >
              <Upload className="w-4 h-4 mr-2" />
              Start Enhanced Import
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedCSVImportPreview;
