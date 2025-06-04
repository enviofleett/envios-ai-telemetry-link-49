
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, X, Clock, MapPin, Car } from 'lucide-react';

interface DataPreviewModalProps {
  record: any;
  onClose: () => void;
}

const DataPreviewModal: React.FC<DataPreviewModalProps> = ({ record, onClose }) => {
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const formatLocation = (lat: number, lon: number) => {
    return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            GP51 Data Preview - {record.gp51_username}
            <Badge variant={record.import_eligibility === 'conflict' ? 'destructive' : 'secondary'}>
              {record.import_eligibility}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="vehicles">Vehicles ({record.raw_vehicle_data?.length || 0})</TabsTrigger>
            <TabsTrigger value="raw">Raw Data</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-medium">User Information</h3>
                <div className="text-sm space-y-1">
                  <div><strong>GP51 Username:</strong> {record.gp51_username}</div>
                  <div><strong>Review Status:</strong> {record.review_status}</div>
                  <div><strong>Import Eligibility:</strong> {record.import_eligibility}</div>
                  <div><strong>Created:</strong> {new Date(record.created_at).toLocaleString()}</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium">Vehicle Summary</h3>
                <div className="text-sm space-y-1">
                  <div><strong>Total Vehicles:</strong> {record.raw_vehicle_data?.length || 0}</div>
                  <div><strong>Active Vehicles:</strong> {record.raw_vehicle_data?.filter(v => v.status === '1').length || 0}</div>
                  <div><strong>Conflicts:</strong> {record.conflict_flags?.length || 0}</div>
                </div>
              </div>
            </div>
            
            {record.conflict_flags && record.conflict_flags.length > 0 && (
              <div className="border rounded-lg p-4 bg-red-50">
                <h3 className="font-medium text-red-800 mb-2">Conflicts Detected</h3>
                <div className="space-y-2">
                  {record.conflict_flags.map((conflict, index) => (
                    <div key={index} className="text-sm text-red-700">
                      • {conflict.message || `${conflict.type} conflict`}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="vehicles">
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {record.raw_vehicle_data?.map((vehicle, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4" />
                        <span className="font-medium">{vehicle.devicename || vehicle.deviceid}</span>
                      </div>
                      <Badge variant={vehicle.status === '1' ? 'default' : 'secondary'}>
                        {vehicle.strstatusen || `Status ${vehicle.status}`}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Device ID:</strong> {vehicle.deviceid}
                      </div>
                      <div>
                        <strong>SIM Number:</strong> {vehicle.simnum || 'N/A'}
                      </div>
                      <div>
                        <strong>Speed:</strong> {vehicle.speed || 0} km/h
                      </div>
                      <div>
                        <strong>Course:</strong> {vehicle.course || 0}°
                      </div>
                    </div>
                    
                    {vehicle.lastactivetime && (
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-3 w-3" />
                        <strong>Last Active:</strong> {formatTimestamp(vehicle.lastactivetime)}
                      </div>
                    )}
                    
                    {vehicle.callat && vehicle.callon && (
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3" />
                        <strong>Location:</strong> {formatLocation(vehicle.callat, vehicle.callon)}
                      </div>
                    )}
                  </div>
                )) || (
                  <div className="text-center py-8 text-muted-foreground">
                    No vehicle data available
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="raw">
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">User Data</h3>
                  <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
                    {JSON.stringify(record.raw_user_data, null, 2)}
                  </pre>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Vehicle Data</h3>
                  <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
                    {JSON.stringify(record.raw_vehicle_data, null, 2)}
                  </pre>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DataPreviewModal;
