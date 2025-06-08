
import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WorkshopMarketplace } from '@/components/admin/WorkshopMarketplace';
import { WorkshopConnection } from '@/components/admin/WorkshopConnection';
import { 
  Calendar, 
  Wrench, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Plus,
  MapPin,
  Phone
} from 'lucide-react';

interface MaintenanceItem {
  id: string;
  vehicleId: string;
  plateNumber: string;
  model: string;
  serviceType: string;
  scheduledDate: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'overdue';
  workshop?: string;
  priority: 'low' | 'medium' | 'high';
}

interface Workshop {
  id: string;
  name: string;
  representativeName: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  serviceTypes: string[];
  rating: number;
  reviewCount: number;
  activationFee: number;
  operatingHours: string;
  verified: boolean;
}

interface Vehicle {
  id: string;
  plateNumber: string;
  model: string;
  year: number;
  status: 'active' | 'inactive' | 'maintenance';
}

const mockMaintenanceItems: MaintenanceItem[] = [
  {
    id: '1',
    vehicleId: 'FL-001',
    plateNumber: 'ABC-1234',
    model: 'Ford Transit 2022',
    serviceType: 'Oil Change',
    scheduledDate: '2024-03-15',
    status: 'scheduled',
    workshop: 'AutoCare Plus',
    priority: 'medium'
  },
  {
    id: '2',
    vehicleId: 'FL-002',
    plateNumber: 'XYZ-5678',
    model: 'Mercedes Sprinter 2023',
    serviceType: 'Brake Inspection',
    scheduledDate: '2024-03-10',
    status: 'overdue',
    priority: 'high'
  },
  {
    id: '3',
    vehicleId: 'FL-003',
    plateNumber: 'DEF-9012',
    model: 'Iveco Daily 2021',
    serviceType: 'General Maintenance',
    scheduledDate: '2024-03-18',
    status: 'in-progress',
    workshop: 'Fleet Masters',
    priority: 'medium'
  }
];

const mockWorkshops: Workshop[] = [
  {
    id: '1',
    name: 'AutoCare Plus',
    representativeName: 'John Smith',
    email: 'john@autocare.com',
    phone: '+1-555-0123',
    city: 'New York',
    country: 'USA',
    serviceTypes: ['Oil Change', 'Brake Service', 'Engine Repair'],
    rating: 4.8,
    reviewCount: 120,
    activationFee: 50,
    operatingHours: '8:00 AM - 6:00 PM',
    verified: true
  },
  {
    id: '2',
    name: 'Fleet Masters',
    representativeName: 'Sarah Johnson',
    email: 'sarah@fleetmasters.com',
    phone: '+1-555-0456',
    city: 'Los Angeles',
    country: 'USA',
    serviceTypes: ['General Maintenance', 'Tire Service', 'Air Conditioning'],
    rating: 4.6,
    reviewCount: 95,
    activationFee: 45,
    operatingHours: '7:00 AM - 7:00 PM',
    verified: true
  }
];

const mockVehicles: Vehicle[] = [
  {
    id: 'FL-001',
    plateNumber: 'ABC-1234',
    model: 'Ford Transit',
    year: 2022,
    status: 'active'
  },
  {
    id: 'FL-002',
    plateNumber: 'XYZ-5678',
    model: 'Mercedes Sprinter',
    year: 2023,
    status: 'active'
  },
  {
    id: 'FL-003',
    plateNumber: 'DEF-9012',
    model: 'Iveco Daily',
    year: 2021,
    status: 'active'
  }
];

const Maintenance: React.FC = () => {
  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null);
  const [showWorkshopMarketplace, setShowWorkshopMarketplace] = useState(false);
  const [showWorkshopConnection, setShowWorkshopConnection] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>;
      case 'in-progress':
        return <Badge className="bg-orange-100 text-orange-800">In Progress</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      case 'low':
        return <Badge className="bg-green-100 text-green-800">Low</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const handleWorkshopSelect = (workshop: Workshop) => {
    setSelectedWorkshop(workshop);
    setShowWorkshopMarketplace(false);
    setShowWorkshopConnection(true);
  };

  const handleWorkshopConnect = (data: any) => {
    console.log('Workshop connection data:', data);
    setShowWorkshopConnection(false);
    setSelectedWorkshop(null);
    // Here you would typically send the data to your backend
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Maintenance Management</h1>
            <p className="text-muted-foreground">
              Schedule and manage vehicle maintenance with approved workshops
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowWorkshopMarketplace(true)}>
              <MapPin className="h-4 w-4 mr-2" />
              Find Workshop
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Schedule Maintenance
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {mockMaintenanceItems.filter(item => item.status === 'scheduled').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Wrench className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {mockMaintenanceItems.filter(item => item.status === 'in-progress').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {mockMaintenanceItems.filter(item => item.status === 'overdue').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {mockMaintenanceItems.filter(item => item.status === 'completed').length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="maintenance" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="maintenance">Maintenance Schedule</TabsTrigger>
            <TabsTrigger value="workshops">Connected Workshops</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="maintenance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Maintenance</CardTitle>
                <CardDescription>
                  Scheduled maintenance activities for your fleet
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockMaintenanceItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Wrench className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{item.plateNumber} - {item.serviceType}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.model} • Scheduled: {item.scheduledDate}
                          </div>
                          {item.workshop && (
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {item.workshop}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getPriorityBadge(item.priority)}
                        {getStatusBadge(item.status)}
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="workshops" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Connected Workshops</CardTitle>
                <CardDescription>
                  Workshops you're connected to for maintenance services
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockWorkshops.map((workshop) => (
                    <div key={workshop.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Wrench className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{workshop.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {workshop.city}, {workshop.country} • Rating: {workshop.rating}★
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {workshop.phone}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-100 text-green-800">Connected</Badge>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Maintenance History</CardTitle>
                <CardDescription>
                  Previous maintenance activities and reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No maintenance history available</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Workshop Marketplace Modal */}
        {showWorkshopMarketplace && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Find Workshop</h2>
                <Button 
                  variant="outline" 
                  onClick={() => setShowWorkshopMarketplace(false)}
                >
                  Close
                </Button>
              </div>
              <WorkshopMarketplace onWorkshopSelect={handleWorkshopSelect} />
            </div>
          </div>
        )}

        {/* Workshop Connection Modal */}
        {showWorkshopConnection && selectedWorkshop && (
          <WorkshopConnection
            workshop={selectedWorkshop}
            userVehicles={mockVehicles}
            isOpen={showWorkshopConnection}
            onClose={() => {
              setShowWorkshopConnection(false);
              setSelectedWorkshop(null);
            }}
            onConnect={handleWorkshopConnect}
          />
        )}
      </div>
    </Layout>
  );
};

export default Maintenance;
