import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Users, Car, AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react';
import { SystemImportOptions } from '@/types/system-import';
import { importPreviewService, ImportPreviewData } from '@/services/systemImport/importPreviewService';
import { gp51DataService } from '@/services/gp51/GP51DataService';

interface ImportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  options: SystemImportOptions;
}

const ImportPreviewModal: React.FC<ImportPreviewModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  options
}) => {
  const [previewData, setPreviewData] = useState<ImportPreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      generatePreview();
    }
  }, [isOpen, options]);

  const generatePreview = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Use the GP51DataService to get live data
      const liveDataResult = await gp51DataService.getLiveVehicles();
      
      if (!liveDataResult.success) {
        throw new Error(liveDataResult.error || 'Failed to fetch GP51 data');
      }

      const liveData = liveDataResult.data;
      if (!liveData) {
        throw new Error('No data received from GP51');
      }

      // Process the data for preview
      const processResult = await gp51DataService.processVehicleData(
        liveData.devices, 
        liveData.telemetry
      );

      // Create preview data based on the processing result
      const previewData = {
        summary: {
          totalRecords: liveData.devices.length,
          newRecords: processResult.created,
          conflicts: processResult.errors.length,
          estimatedDuration: `${Math.ceil(liveData.devices.length / 10)} minutes`,
          warnings: processResult.errors.slice(0, 5) // Show first 5 errors as warnings
        },
        users: {
          total: 0,
          new: 0,
          conflicts: 0,
          userList: []
        },
        vehicles: {
          total: liveData.devices.length,
          new: processResult.created,
          conflicts: processResult.errors.length,
          vehicleList: liveData.devices.map(device => ({
            deviceId: device.deviceId,
            deviceName: device.deviceName,
            username: 'N/A',
            conflict: processResult.errors.some(error => error.includes(device.deviceId))
          }))
        },
        settings: {
          importType: options.importType,
          batchSize: options.batchSize || 10,
          performCleanup: options.performCleanup,
          preserveAdminEmail: options.preserveAdminEmail || 'Default admin'
        }
      };
      
      setPreviewData(previewData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate preview');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (hasConflicts: boolean) => {
    return hasConflicts ? (
      <AlertTriangle className="h-4 w-4 text-amber-500" />
    ) : (
      <CheckCircle className="h-4 w-4 text-green-500" />
    );
  };

  const getImportTypeLabel = (type: string) => {
    const labels = {
      users_only: 'Users Only',
      vehicles_only: 'Vehicles Only',
      complete_system: 'Complete System',
      selective: 'Selective Import'
    };
    return labels[type as keyof typeof labels] || type;
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Import Preview: {getImportTypeLabel(options.importType)}
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Analyzing import data...
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {previewData && (
          <div className="space-y-6">
            {/* Summary Section */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">{previewData.summary.totalRecords}</div>
                <div className="text-sm text-blue-600">Total Records</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{previewData.summary.newRecords}</div>
                <div className="text-sm text-green-600">New Records</div>
              </div>
              <div className="bg-amber-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-amber-600">{previewData.summary.conflicts}</div>
                <div className="text-sm text-amber-600">Conflicts</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-600">{previewData.summary.estimatedDuration}</div>
                <div className="text-sm text-purple-600">Est. Duration</div>
              </div>
            </div>

            {/* Warnings */}
            {previewData.summary.warnings.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium">Warnings:</div>
                  <ul className="mt-1 list-disc list-inside">
                    {previewData.summary.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Detailed Tabs */}
            <Tabs defaultValue="users" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="users" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Users ({previewData.users.total})
                </TabsTrigger>
                <TabsTrigger value="vehicles" className="flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  Vehicles ({previewData.vehicles.total})
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Settings
                </TabsTrigger>
              </TabsList>

              <TabsContent value="users" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">User Import Preview</h3>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(previewData.users.conflicts > 0)}
                    <span className="text-sm">
                      {previewData.users.conflicts > 0 ? 'Conflicts Detected' : 'Ready to Import'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-xl font-bold">{previewData.users.total}</div>
                    <div className="text-sm text-gray-600">Total Users</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-600">{previewData.users.new}</div>
                    <div className="text-sm text-gray-600">New Users</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-amber-600">{previewData.users.conflicts}</div>
                    <div className="text-sm text-gray-600">Conflicts</div>
                  </div>
                </div>

                {previewData.users.userList.length > 0 && (
                  <div className="border rounded-lg max-h-64 overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left">Username</th>
                          <th className="px-4 py-2 text-left">Email</th>
                          <th className="px-4 py-2 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.users.userList.slice(0, 50).map((user, index) => (
                          <tr key={index} className="border-t">
                            <td className="px-4 py-2">{user.username}</td>
                            <td className="px-4 py-2">{user.email}</td>
                            <td className="px-4 py-2">
                              {user.conflict ? (
                                <Badge variant="destructive">Conflict</Badge>
                              ) : (
                                <Badge variant="outline">New</Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {previewData.users.userList.length > 50 && (
                      <div className="p-2 text-center text-sm text-gray-500">
                        ... and {previewData.users.userList.length - 50} more users
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="vehicles" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Vehicle Import Preview</h3>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(previewData.vehicles.conflicts > 0)}
                    <span className="text-sm">
                      {previewData.vehicles.conflicts > 0 ? 'Conflicts Detected' : 'Ready to Import'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-xl font-bold">{previewData.vehicles.total}</div>
                    <div className="text-sm text-gray-600">Total Vehicles</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-600">{previewData.vehicles.new}</div>
                    <div className="text-sm text-gray-600">New Vehicles</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-amber-600">{previewData.vehicles.conflicts}</div>
                    <div className="text-sm text-gray-600">Conflicts</div>
                  </div>
                </div>

                {previewData.vehicles.vehicleList.length > 0 && (
                  <div className="border rounded-lg max-h-64 overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left">Device ID</th>
                          <th className="px-4 py-2 text-left">Device Name</th>
                          <th className="px-4 py-2 text-left">Owner</th>
                          <th className="px-4 py-2 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.vehicles.vehicleList.slice(0, 50).map((vehicle, index) => (
                          <tr key={index} className="border-t">
                            <td className="px-4 py-2">{vehicle.deviceId}</td>
                            <td className="px-4 py-2">{vehicle.deviceName}</td>
                            <td className="px-4 py-2">{vehicle.username}</td>
                            <td className="px-4 py-2">
                              {vehicle.conflict ? (
                                <Badge variant="destructive">Conflict</Badge>
                              ) : (
                                <Badge variant="outline">New</Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {previewData.vehicles.vehicleList.length > 50 && (
                      <div className="p-2 text-center text-sm text-gray-500">
                        ... and {previewData.vehicles.vehicleList.length - 50} more vehicles
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="settings" className="space-y-4">
                <h3 className="text-lg font-medium">Import Configuration</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-medium">Import Type:</label>
                    <p>{getImportTypeLabel(options.importType)}</p>
                  </div>
                  <div>
                    <label className="font-medium">Batch Size:</label>
                    <p>{options.batchSize || 10} records per batch</p>
                  </div>
                  <div>
                    <label className="font-medium">Data Cleanup:</label>
                    <p>{options.performCleanup ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <label className="font-medium">Preserve Admin:</label>
                    <p>{options.preserveAdminEmail || 'Default admin'}</p>
                  </div>
                </div>

                {options.importType === 'selective' && options.selectedUsernames && (
                  <div>
                    <label className="font-medium">Selected Users:</label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {options.selectedUsernames.map((username, index) => (
                        <Badge key={index} variant="outline">{username}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={onConfirm} 
            disabled={loading || !previewData}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Generating Preview...
              </>
            ) : (
              'Start Import'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportPreviewModal;
