
import React from 'react';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Car } from 'lucide-react';
import VehicleDetailsModal from '@/components/vehicles/VehicleDetailsModal';
import { useVehicleDetails } from '@/hooks/useVehicleDetails';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Mock vehicle data for demonstration
const mockVehicles = [
  {
    deviceid: "FL-001",
    devicename: "Ford Transit 2022",
    status: "maintenance",
    is_active: true,
    lastPosition: {
      lat: 40.7128,
      lon: -74.0060,
      speed: 0,
      course: 180,
      updatetime: "2024-01-15T10:30:00Z",
      statusText: "Parked"
    },
    envio_user_id: "user-123"
  },
  {
    deviceid: "FL-002", 
    devicename: "Mercedes Sprinter 2023",
    status: "active",
    is_active: true,
    lastPosition: {
      lat: 40.7589,
      lon: -73.9851,
      speed: 45,
      course: 90,
      updatetime: new Date().toISOString(),
      statusText: "Moving"
    },
    envio_user_id: "user-456"
  }
];

const VehicleManagementPage: React.FC = () => {
  const {
    selectedVehicle,
    isDetailsModalOpen,
    openDetailsModal,
    closeDetailsModal,
  } = useVehicleDetails();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>;
      case "maintenance":
        return <Badge variant="destructive">Maintenance Required</Badge>;
      case "warning":
        return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Car className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Vehicle Management</h1>
              <p className="text-sm text-muted-foreground">
                Manage your fleet vehicles with detailed information and maintenance tracking
              </p>
            </div>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Fleet Overview</CardTitle>
              <CardDescription>Complete list of vehicles in your fleet</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle ID</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Update</TableHead>
                    <TableHead>Speed</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockVehicles.map((vehicle) => (
                    <TableRow key={vehicle.deviceid}>
                      <TableCell className="font-medium">{vehicle.deviceid}</TableCell>
                      <TableCell>{vehicle.devicename}</TableCell>
                      <TableCell>{getStatusBadge(vehicle.status)}</TableCell>
                      <TableCell>
                        {vehicle.lastPosition ? 
                          new Date(vehicle.lastPosition.updatetime).toLocaleString() : 
                          'No data'
                        }
                      </TableCell>
                      <TableCell>
                        {vehicle.lastPosition ? `${vehicle.lastPosition.speed} km/h` : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {vehicle.lastPosition ? 
                          `${vehicle.lastPosition.lat.toFixed(4)}, ${vehicle.lastPosition.lon.toFixed(4)}` : 
                          'Unknown'
                        }
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => openDetailsModal(vehicle)}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <VehicleDetailsModal
            vehicle={selectedVehicle}
            isOpen={isDetailsModalOpen}
            onClose={closeDetailsModal}
          />
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default VehicleManagementPage;
