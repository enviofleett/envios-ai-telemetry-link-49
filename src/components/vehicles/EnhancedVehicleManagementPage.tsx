
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  Car,
  Plus,
  Search,
  Filter,
  Download,
  CheckCircle,
  Calendar,
  Tag,
  Clock,
  BarChart3,
  FileSpreadsheet,
  ChevronRight,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { VehicleStatsCards } from './VehicleStatsCards';
import { VehicleFilters } from './VehicleFilters';
import { AddVehicleDialog } from './AddVehicleDialog';
import { EnhancedVehicleDetailsModal } from './EnhancedVehicleDetailsModal';
import { QuickActionsPanel } from './QuickActionsPanel';
import type { Vehicle } from '@/services/unifiedVehicleData';

// Mock enhanced vehicle data
const mockEnhancedVehicles = [
  {
    id: "VH-7842",
    deviceid: "VH-7842",
    devicename: "Ford Transit 2022",
    plateNumber: "ABC-123",
    make: "Ford",
    model: "Transit",
    year: 2022,
    status: "active",
    is_active: true,
    type: "Van",
    assignedTo: "John Smith",
    lastService: "2025-05-15",
    nextService: "2025-08-15",
    fuelType: "Diesel",
    fuelLevel: 85,
    odometer: 45230,
    mileage: 45230,
    registrationExpiry: "2026-03-22",
    insuranceExpiry: "2026-04-15",
    tags: ["Delivery", "North Region"],
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
    id: "VH-3456",
    deviceid: "VH-3456",
    devicename: "Mercedes Sprinter 2023",
    plateNumber: "XYZ-789",
    make: "Mercedes",
    model: "Sprinter",
    year: 2023,
    status: "active",
    is_active: true,
    type: "Van",
    assignedTo: "Sarah Johnson",
    lastService: "2025-05-28",
    nextService: "2025-08-28",
    fuelType: "Diesel",
    fuelLevel: 92,
    odometer: 32150,
    mileage: 32150,
    registrationExpiry: "2026-07-12",
    insuranceExpiry: "2026-07-30",
    tags: ["Express", "South Region"],
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
    id: "VH-9012",
    deviceid: "VH-9012",
    devicename: "Iveco Daily 2021",
    plateNumber: "DEF-456",
    make: "Iveco",
    model: "Daily",
    year: 2021,
    status: "maintenance",
    is_active: true,
    type: "Truck",
    assignedTo: "Michael Brown",
    lastService: "2025-04-10",
    nextService: "2025-07-10",
    fuelType: "Diesel",
    fuelLevel: 67,
    odometer: 67890,
    mileage: 67890,
    registrationExpiry: "2026-01-05",
    insuranceExpiry: "2026-02-15",
    tags: ["Heavy Load", "Central Region"],
    lastPosition: {
      lat: 40.7589,
      lon: -73.9851,
      speed: 25,
      course: 180,
      updatetime: new Date().toISOString(),
      statusText: "Moving"
    },
    envio_user_id: "user-789"
  },
  {
    id: "VH-5678",
    deviceid: "VH-5678",
    devicename: "Toyota Hilux 2023",
    plateNumber: "GHI-789",
    make: "Toyota",
    model: "Hilux",
    year: 2023,
    status: "inactive",
    is_active: false,
    type: "Pickup",
    assignedTo: "Unassigned",
    lastService: "2025-03-20",
    nextService: "2025-06-20",
    fuelType: "Petrol",
    fuelLevel: 100,
    odometer: 12450,
    mileage: 12450,
    registrationExpiry: "2026-05-18",
    insuranceExpiry: "2026-06-01",
    tags: ["New Vehicle", "Maintenance"],
    lastPosition: {
      lat: 40.7128,
      lon: -74.0060,
      speed: 0,
      course: 0,
      updatetime: "2025-03-20T10:00:00Z",
      statusText: "Parked"
    },
    envio_user_id: "user-000"
  },
];

export interface EnhancedVehicle extends Vehicle {
  plateNumber: string;
  make: string;
  model: string;
  year: number;
  type: string;
  assignedTo: string;
  lastService: string;
  nextService: string;
  fuelType: string;
  fuelLevel: number;
  odometer: number;
  mileage: number;
  registrationExpiry: string;
  insuranceExpiry: string;
  tags: string[];
}

export const EnhancedVehicleManagementPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState<EnhancedVehicle | null>(null);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [showVehicleDetails, setShowVehicleDetails] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const filteredVehicles = mockEnhancedVehicles.filter((vehicle) => {
    const matchesSearch =
      vehicle.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.assignedTo.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || vehicle.status === statusFilter;
    const matchesType = typeFilter === "all" || vehicle.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "maintenance":
        return <Badge variant="destructive">Maintenance</Badge>;
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const handleViewVehicle = (vehicle: EnhancedVehicle) => {
    setSelectedVehicle(vehicle);
    setShowVehicleDetails(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Vehicle Management</h2>
          <p className="text-muted-foreground">Manage and monitor your fleet vehicles with enhanced tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowAddVehicle(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Vehicle
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <VehicleStatsCards vehicles={mockEnhancedVehicles} />

      {/* Main Vehicle Table */}
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Inventory</CardTitle>
          <CardDescription>Manage and monitor your fleet vehicles</CardDescription>
        </CardHeader>
        <CardContent>
          <VehicleFilters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
          />

          {/* Vehicle Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Plate Number</TableHead>
                  <TableHead>Make & Model</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Next Service</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVehicles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      No vehicles found matching your criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVehicles.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell className="font-medium">{vehicle.id}</TableCell>
                      <TableCell>{vehicle.plateNumber}</TableCell>
                      <TableCell>
                        {vehicle.make} {vehicle.model} ({vehicle.year})
                      </TableCell>
                      <TableCell>{getStatusBadge(vehicle.status)}</TableCell>
                      <TableCell>{vehicle.type}</TableCell>
                      <TableCell>{vehicle.assignedTo}</TableCell>
                      <TableCell>{new Date(vehicle.nextService).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleViewVehicle(vehicle)}>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions Panel */}
      <QuickActionsPanel vehicles={mockEnhancedVehicles} />

      {/* Dialogs */}
      <AddVehicleDialog
        isOpen={showAddVehicle}
        onClose={() => setShowAddVehicle(false)}
      />

      <EnhancedVehicleDetailsModal
        vehicle={selectedVehicle}
        isOpen={showVehicleDetails}
        onClose={() => setShowVehicleDetails(false)}
      />
    </div>
  );
};
