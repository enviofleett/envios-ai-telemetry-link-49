
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
  AlertCircle
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
  summary: ImportSummary;
  details: ImportDetails;
  message: string;
}

interface ImportPreviewPanelProps {
  previewData: PreviewData;
  isLoading: boolean;
}

const ImportPreviewPanel: React.FC<ImportPreviewPanelProps> = ({ 
  previewData, 
  isLoading 
}) => {
  const { summary, details } = previewData;
  
  const hasAnyData = summary.vehicles > 0 || summary.users > 0 || summary.groups > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Import Preview & Data Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Car className="h-6 w-6 text-blue-600" />
              <div>
                <p className="font-semibold text-blue-900">Vehicles</p>
                <p className="text-sm text-blue-700">GP51 Devices</p>
              </div>
            </div>
            <Badge variant={summary.vehicles > 0 ? "default" : "secondary"} className="text-lg px-3 py-1">
              {summary.vehicles}
            </Badge>
          </div>

          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-semibold text-green-900">Users</p>
                <p className="text-sm text-green-700">User Accounts</p>
              </div>
            </div>
            <Badge variant={summary.users > 0 ? "default" : "secondary"} className="text-lg px-3 py-1">
              {summary.users}
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
              {summary.groups}
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Data Availability Status */}
        <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg">
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
                No Data Found - Check GP51 Connection
              </span>
            </>
          )}
        </div>

        {/* Sample Data Preview */}
        {hasAnyData && (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Sample Data Preview</h4>
            
            {details.vehicles && details.vehicles.length > 0 && (
              <div>
                <h5 className="font-medium text-sm text-gray-700 mb-2">Sample Vehicles</h5>
                <div className="space-y-2">
                  {details.vehicles.slice(0, 3).map((vehicle, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-white border rounded">
                      <div>
                        <span className="font-medium">{vehicle.devicename || 'Unnamed Device'}</span>
                        <span className="text-sm text-gray-500 ml-2">ID: {vehicle.deviceid}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {vehicle.simnum ? 'SIM: ' + vehicle.simnum : 'No SIM'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {details.users && details.users.length > 0 && (
              <div>
                <h5 className="font-medium text-sm text-gray-700 mb-2">Sample Users</h5>
                <div className="space-y-2">
                  {details.users.slice(0, 3).map((user, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-white border rounded">
                      <div>
                        <span className="font-medium">{user.username || 'Unknown User'}</span>
                        {user.email && (
                          <span className="text-sm text-gray-500 ml-2">{user.email}</span>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Type: {user.usertype || 'Unknown'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {details.groups && details.groups.length > 0 && (
              <div>
                <h5 className="font-medium text-sm text-gray-700 mb-2">Device Groups</h5>
                <div className="space-y-2">
                  {details.groups.slice(0, 3).map((group, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-white border rounded">
                      <div>
                        <span className="font-medium">{group.groupname || 'Unnamed Group'}</span>
                        <span className="text-sm text-gray-500 ml-2">ID: {group.groupid}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {group.deviceCount || 0} devices
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Import Readiness Message */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            {hasAnyData 
              ? `Ready to import ${summary.vehicles} vehicles, ${summary.users} users, and ${summary.groups} groups from GP51.`
              : 'No data available for import. Please check your GP51 connection and ensure you have vehicles/users configured in your GP51 account.'
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImportPreviewPanel;
