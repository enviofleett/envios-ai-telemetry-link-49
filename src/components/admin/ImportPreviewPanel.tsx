
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Car, 
  Users, 
  FolderOpen, 
  Database,
  CheckCircle2,
  AlertCircle,
  Wifi,
  WifiOff
} from 'lucide-react';

interface ImportSummary {
  vehicles: number;
  users: number;
  groups: number;
}

interface ImportDetails {
  vehicles: any[];
  users: any[];
  groups: any[];
}

interface PreviewData {
  success: boolean;
  summary: ImportSummary;
  details: ImportDetails;
  message: string;
}

interface ImportPreviewPanelProps {
  previewData: PreviewData | null;
  isLoading: boolean;
}

const ImportPreviewPanel: React.FC<ImportPreviewPanelProps> = ({ 
  previewData, 
  isLoading 
}) => {
  if (!previewData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            GP51 Import Preview & Data Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg">
            <AlertCircle className="h-5 w-5 text-gray-600" />
            <span className="text-gray-700">
              Click "Test Connection" to discover available GP51 data for import
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { success, summary, details, message } = previewData;
  const hasAnyData = summary.vehicles > 0 || summary.users > 0 || summary.groups > 0;
  const isConnected = success;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          GP51 Import Preview & Data Analysis
          {isConnected ? (
            <Wifi className="h-4 w-4 text-green-600" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-600" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Connection Status */}
        <div className={`flex items-center gap-2 p-4 rounded-lg ${
          isConnected ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          {isConnected ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600" />
          )}
          <span className={`font-medium ${
            isConnected ? 'text-green-800' : 'text-red-800'
          }`}>
            {isConnected ? 'GP51 API Connection & Authentication Successful' : 'GP51 API Connection Failed'}
          </span>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Car className="h-6 w-6 text-blue-600" />
              <div>
                <p className="font-semibold text-blue-900">Vehicles</p>
                <p className="text-sm text-blue-700">GP51 Devices/Trackers</p>
              </div>
            </div>
            <Badge variant={summary.vehicles > 0 ? "default" : "secondary"} className="text-lg px-3 py-1">
              {summary.vehicles.toLocaleString()}
            </Badge>
          </div>

          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-semibold text-green-900">Users</p>
                <p className="text-sm text-green-700">GP51 User Accounts</p>
              </div>
            </div>
            <Badge variant={summary.users > 0 ? "default" : "secondary"} className="text-lg px-3 py-1">
              {summary.users.toLocaleString()}
            </Badge>
          </div>

          <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center gap-3">
              <FolderOpen className="h-6 w-6 text-purple-600" />
              <div>
                <p className="font-semibold text-purple-900">Groups</p>
                <p className="text-sm text-purple-700">Device Groups</p>
              </div>
            </div>
            <Badge variant={summary.groups > 0 ? "default" : "secondary"} className="text-lg px-3 py-1">
              {summary.groups.toLocaleString()}
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Data Availability Status */}
        <div className={`flex items-center gap-2 p-4 rounded-lg ${
          hasAnyData ? 'bg-green-50' : 'bg-amber-50'
        }`}>
          {hasAnyData ? (
            <>
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-800">
                Data Available - Ready for Import
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <span className="font-medium text-amber-800">
                {isConnected ? 'No Data Found in GP51 Account' : 'Connection Issue - Check GP51 Settings'}
              </span>
            </>
          )}
        </div>

        {/* Import Status Message */}
        <div className={`p-4 rounded-lg border ${
          hasAnyData ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
        }`}>
          <p className={`text-sm ${
            hasAnyData ? 'text-blue-800' : 'text-gray-700'
          }`}>
            {message}
          </p>
          
          {hasAnyData && (
            <div className="mt-2 text-xs text-blue-600">
              <strong>Next Steps:</strong> Configure import options and click "Start Import" to begin importing this data into your system.
            </div>
          )}
          
          {!hasAnyData && isConnected && (
            <div className="mt-2 text-xs text-gray-600">
              <strong>Possible Causes:</strong>
              <ul className="list-disc list-inside mt-1">
                <li>Your GP51 account may not have any vehicles configured</li>
                <li>The connected user account may not have access to device data</li>
                <li>GP51 API permissions may be restricted for this account</li>
                <li>The account may be configured for a different GP51 server region</li>
              </ul>
            </div>
          )}
        </div>

        {/* Connection Troubleshooting */}
        {!isConnected && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-sm text-red-800">
              <strong>Connection Troubleshooting:</strong>
              <ul className="list-disc list-inside mt-1">
                <li>Verify GP51 credentials in Admin Settings</li>
                <li>Check that GP51 API URL is correct (https://www.gps51.com/webapi)</li>
                <li>Ensure GP51 account has API access enabled</li>
                <li>Verify the account can access querymonitorlist and queryuserdetail actions</li>
                <li>Try re-authenticating with GP51</li>
              </ul>
            </div>
          </div>
        )}

        {/* Sample Data Preview */}
        {hasAnyData && details && (
          <div className="space-y-4">
            <Separator />
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Sample Data Preview</h4>
              
              {details.vehicles.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700 mb-1">Sample Vehicles:</p>
                  <div className="text-xs text-gray-600 space-y-1">
                    {details.vehicles.slice(0, 3).map((vehicle: any, index: number) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="font-mono">{vehicle.deviceid}</span>
                        <span>-</span>
                        <span>{vehicle.devicename || 'Unnamed Device'}</span>
                        {vehicle.simnum && (
                          <>
                            <span>•</span>
                            <span>SIM: {vehicle.simnum}</span>
                          </>
                        )}
                      </div>
                    ))}
                    {details.vehicles.length > 3 && (
                      <div className="text-gray-500">... and {details.vehicles.length - 3} more</div>
                    )}
                  </div>
                </div>
              )}

              {details.groups.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Sample Groups:</p>
                  <div className="text-xs text-gray-600 space-y-1">
                    {details.groups.slice(0, 2).map((group: any, index: number) => (
                      <div key={index}>
                        <span className="font-medium">{group.groupname}</span>
                        <span className="text-gray-500"> ({group.devices?.length || 0} devices)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ImportPreviewPanel;
