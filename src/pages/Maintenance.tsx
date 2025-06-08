
import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WorkshopMarketplace } from '@/components/admin/WorkshopMarketplace';
import { WorkshopConnection } from '@/components/admin/WorkshopConnection';
import { MaintenanceStats } from '@/components/maintenance/MaintenanceStats';
import { MaintenanceList } from '@/components/maintenance/MaintenanceList';
import { ConnectedWorkshopsList } from '@/components/maintenance/ConnectedWorkshopsList';
import { MaintenanceHistory } from '@/components/maintenance/MaintenanceHistory';
import { Plus, MapPin } from 'lucide-react';
import type { MaintenanceItem, Workshop as MaintenanceWorkshop, Vehicle } from '@/components/maintenance/types';

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

const mockWorkshops: MaintenanceWorkshop[] = [
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
  const [selectedWorkshop, setSelectedWorkshop] = useState<MaintenanceWorkshop | null>(null);
  const [showWorkshopMarketplace, setShowWorkshopMarketplace] = useState(false);
  const [showWorkshopConnection, setShowWorkshopConnection] = useState(false);

  const handleWorkshopSelect = (workshop: any) => {
    // Convert the workshop from WorkshopMarketplace to our MaintenanceWorkshop type
    const maintenanceWorkshop: MaintenanceWorkshop = {
      id: workshop.id,
      name: workshop.name,
      representativeName: workshop.representativeName || 'Not provided',
      email: workshop.email || 'Not provided',
      phone: workshop.phone || 'Not provided',
      city: workshop.city || 'Not provided',
      country: workshop.country || 'Not provided',
      serviceTypes: workshop.serviceTypes || [],
      rating: workshop.rating || 0,
      reviewCount: workshop.reviewCount || 0,
      activationFee: workshop.activationFee || 0,
      operatingHours: workshop.operatingHours || 'Not specified',
      verified: workshop.verified || false
    };
    
    setSelectedWorkshop(maintenanceWorkshop);
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

        <MaintenanceStats maintenanceItems={mockMaintenanceItems} />

        <Tabs defaultValue="maintenance" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="maintenance">Maintenance Schedule</TabsTrigger>
            <TabsTrigger value="workshops">Connected Workshops</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="maintenance" className="space-y-4">
            <MaintenanceList maintenanceItems={mockMaintenanceItems} />
          </TabsContent>

          <TabsContent value="workshops" className="space-y-4">
            <ConnectedWorkshopsList workshops={mockWorkshops} />
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <MaintenanceHistory />
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
