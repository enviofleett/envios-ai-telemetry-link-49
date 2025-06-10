
import React, { useState } from 'react';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Wrench } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WorkshopDashboard } from '@/components/admin/WorkshopDashboard';
import { WorkshopRegistration } from '@/components/admin/WorkshopRegistration';
import { WorkshopConnection } from '@/components/admin/WorkshopConnection';
import { WorkshopActivation } from '@/components/admin/WorkshopActivation';
import { WorkshopMarketplace } from '@/components/admin/WorkshopMarketplace';
import AdminMerchantManagement from '@/components/admin/AdminMerchantManagement';
import WorkshopManagementEnhanced from '@/components/admin/WorkshopManagementEnhanced';

const WorkshopManagement: React.FC = () => {
  const [showRegistration, setShowRegistration] = useState(false);
  const [showConnection, setShowConnection] = useState(false);
  const [showActivation, setShowActivation] = useState(false);

  // Mock data for required props
  const mockWorkshop = {
    id: 'workshop-1',
    name: 'Sample Workshop',
    representativeName: 'John Doe',
    email: 'john@sampleworkshop.com',
    phone: '+1 (555) 123-4567',
    city: 'New York',
    country: 'USA',
    serviceTypes: ['Oil Change', 'Brake Service', 'Tire Replacement'],
    rating: 4.5,
    reviewCount: 128,
    activationFee: 99.99,
    connectionFee: 99.99,
    operatingHours: '8:00 AM - 6:00 PM',
    verified: true
  };

  const mockVehicles = [
    {
      id: 'vehicle-1',
      plateNumber: 'ABC123',
      model: 'Sample Vehicle'
    }
  ];

  const mockUserVehicles = [
    {
      id: 'vehicle-1',
      plateNumber: 'ABC123',
      model: 'Sample Vehicle',
      year: 2023,
      status: 'active' as const
    }
  ];

  const handleRegistrationSubmit = (data: any) => {
    console.log('Registration submitted:', data);
    setShowRegistration(false);
  };

  const handleConnectionSubmit = (data: any) => {
    console.log('Connection submitted:', data);
    setShowConnection(false);
  };

  const handleActivationComplete = () => {
    console.log('Activation completed');
    setShowActivation(false);
  };

  const handleWorkshopSelect = (workshop: any) => {
    console.log('Workshop selected:', workshop);
  };

  return (
    <ProtectedRoute requireAdmin>
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Wrench className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Workshop Management</h1>
              <p className="text-sm text-muted-foreground">
                Manage workshop connections, registrations, and marketplace operations
              </p>
            </div>
          </div>
          
          <Tabs defaultValue="enhanced" className="w-full">
            <TabsList className="grid grid-cols-7 w-full">
              <TabsTrigger value="enhanced">Enhanced Management</TabsTrigger>
              <TabsTrigger value="dashboard">Overview</TabsTrigger>
              <TabsTrigger value="registration">Registration</TabsTrigger>
              <TabsTrigger value="connection">Connection</TabsTrigger>
              <TabsTrigger value="activation">Activation</TabsTrigger>
              <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
              <TabsTrigger value="merchants">Merchants</TabsTrigger>
            </TabsList>

            <TabsContent value="enhanced" className="mt-6">
              <WorkshopManagementEnhanced />
            </TabsContent>

            <TabsContent value="dashboard" className="mt-6">
              <WorkshopDashboard />
            </TabsContent>

            <TabsContent value="registration" className="mt-6">
              <WorkshopRegistration
                isOpen={showRegistration}
                onClose={() => setShowRegistration(false)}
                onSubmit={handleRegistrationSubmit}
                userRole="admin"
              />
            </TabsContent>

            <TabsContent value="connection" className="mt-6">
              <WorkshopConnection
                workshop={mockWorkshop}
                userVehicles={mockUserVehicles}
                isOpen={showConnection}
                onClose={() => setShowConnection(false)}
                onConnect={handleConnectionSubmit}
              />
            </TabsContent>

            <TabsContent value="activation" className="mt-6">
              <WorkshopActivation
                workshop={mockWorkshop}
                vehicles={mockVehicles}
                onCancel={() => setShowActivation(false)}
                onComplete={handleActivationComplete}
              />
            </TabsContent>

            <TabsContent value="marketplace" className="mt-6">
              <WorkshopMarketplace
                onWorkshopSelect={handleWorkshopSelect}
              />
            </TabsContent>

            <TabsContent value="merchants" className="mt-6">
              <AdminMerchantManagement />
            </TabsContent>
          </Tabs>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default WorkshopManagement;
