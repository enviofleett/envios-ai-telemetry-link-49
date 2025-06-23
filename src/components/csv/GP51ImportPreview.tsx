
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Car, Play, ArrowLeft } from 'lucide-react';

interface GP51ImportPreviewProps {
  liveData: any;
  importConfig: any;
  isImporting: boolean;
  onStartImport: () => void;
  onBack: () => void;
  onProceedToProgress: () => void;
}

const GP51ImportPreview: React.FC<GP51ImportPreviewProps> = ({
  liveData,
  importConfig,
  isImporting,
  onStartImport,
  onBack,
  onProceedToProgress
}) => {
  const handleStartImport = async () => {
    await onStartImport();
    onProceedToProgress();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Selection
        </Button>
        <Button onClick={handleStartImport} disabled={isImporting}>
          <Play className="h-4 w-4 mr-2" />
          {isImporting ? 'Starting Import...' : 'Start Import'}
        </Button>
      </div>

      {importConfig?.includeUsers && liveData?.users && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Users to Import ({liveData.users.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>GP51 Username</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {liveData.users.slice(0, 5).map((user: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell>{user.name || 'N/A'}</TableCell>
                    <TableCell>{user.email || 'N/A'}</TableCell>
                    <TableCell>{user.username || 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {liveData.users.length > 5 && (
              <p className="text-sm text-muted-foreground mt-2">
                And {liveData.users.length - 5} more users...
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {importConfig?.includeVehicles && liveData?.vehicles && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Vehicles to Import ({liveData.vehicles.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {liveData.vehicles.slice(0, 5).map((vehicle: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell>{vehicle.device_id || 'N/A'}</TableCell>
                    <TableCell>{vehicle.name || 'N/A'}</TableCell>
                    <TableCell>{vehicle.status || 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {liveData.vehicles.length > 5 && (
              <p className="text-sm text-muted-foreground mt-2">
                And {liveData.vehicles.length - 5} more vehicles...
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GP51ImportPreview;
