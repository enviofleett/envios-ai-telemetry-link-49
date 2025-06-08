
import React from 'react';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Car, CheckCircle } from 'lucide-react';
import VehicleInspectionModal from '@/components/vehicles/VehicleInspectionModal';
import { useVehicleInspection } from '@/hooks/useVehicleInspection';

// Mock vehicle data for demonstration
const mockVehicles = [
  {
    deviceid: "FL-001",
    devicename: "Ford Transit 2022",
    plateNumber: "ABC-1234",
    status: "maintenance",
    is_active: true,
    mileage: 45000,
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
    plateNumber: "XYZ-5678",
    status: "active",
    is_active: true,
    mileage: 32000,
    lastPosition: {
      lat: 40.7589,
      lon: -73.9851,
      speed: 45,
      course: 90,
      updatetime: new Date().toISOString(),
      statusText: "Moving"
    },
    envio_user_id: "user-456"
  },
  {
    deviceid: "FL-003",
    devicename: "Iveco Daily 2021",
    plateNumber: "DEF-9012",
    status: "active",
    is_active: true,
    mileage: 67000,
    lastPosition: {
      lat: 40.7589,
      lon: -73.9851,
      speed: 25,
      course: 180,
      updatetime: new Date().toISOString(),
      statusText: "Moving"
    },
    envio_user_id: "user-789"
  }
];

const VehicleInspectionPage: React.FC = () => {
  const {
    selectedVehicle,
    isInspectionModalOpen,
    openInspectionModal,
    closeInspectionModal,
  } = useVehicleInspection();

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
            <CheckCircle className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Vehicle Inspections</h1>
              <p className="text-sm text-muted-foreground">
                Conduct comprehensive vehicle inspections with intelligent scoring and reporting
              </p>
            </div>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Fleet Inspection Overview</CardTitle>
              <CardDescription>Select a vehicle to start a new inspection</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle ID</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Plate Number</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Mileage</TableHead>
                    <TableHead>Last Update</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockVehicles.map((vehicle) => (
                    <TableRow key={vehicle.deviceid}>
                      <TableCell className="font-medium">{vehicle.deviceid}</TableCell>
                      <TableCell>{vehicle.devicename}</TableCell>
                      <TableCell>{vehicle.plateNumber}</TableCell>
                      <TableCell>{getStatusBadge(vehicle.status)}</TableCell>
                      <TableCell>{vehicle.mileage?.toLocaleString()} miles</TableCell>
                      <TableCell>
                        {vehicle.lastPosition ? 
                          new Date(vehicle.lastPosition.updatetime).toLocaleString() : 
                          'No data'
                        }
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => openInspectionModal(vehicle)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Start Inspection
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <VehicleInspectionModal
            vehicle={selectedVehicle}
            isOpen={isInspectionModalOpen}
            onClose={closeInspectionModal}
          />
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default VehicleInspectionPage;
