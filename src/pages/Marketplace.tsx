
import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { WorkshopMarketplace } from '@/components/admin/WorkshopMarketplace';
import { WorkshopRegistration } from '@/components/admin/WorkshopRegistration';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Building2, Star, MapPin } from 'lucide-react';

const Marketplace: React.FC = () => {
  const [showRegistration, setShowRegistration] = useState(false);
  const [selectedWorkshop, setSelectedWorkshop] = useState<any>(null);

  const handleWorkshopSelect = (workshop: any) => {
    setSelectedWorkshop(workshop);
    console.log('Selected workshop:', workshop);
  };

  const handleRegistrationSubmit = (data: any) => {
    console.log('Workshop registration data:', data);
    // Here you would typically send the data to your backend
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Workshop Marketplace</h1>
            <p className="text-muted-foreground">
              Connect with certified workshops for your fleet maintenance needs
            </p>
          </div>
          <Button onClick={() => setShowRegistration(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Register Workshop
          </Button>
        </div>

        {/* Marketplace Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verified Workshops</CardTitle>
              <Building2 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">+3 this month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <Star className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4.7</div>
              <p className="text-xs text-muted-foreground">Based on 340 reviews</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cities Covered</CardTitle>
              <MapPin className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">Nationwide coverage</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Connections</CardTitle>
              <Building2 className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">Your connections</p>
            </CardContent>
          </Card>
        </div>

        {/* Workshop Marketplace */}
        <WorkshopMarketplace onWorkshopSelect={handleWorkshopSelect} />

        {/* Workshop Registration Modal */}
        <WorkshopRegistration
          isOpen={showRegistration}
          onClose={() => setShowRegistration(false)}
          onSubmit={handleRegistrationSubmit}
          userRole="admin"
        />
      </div>
    </Layout>
  );
};

export default Marketplace;
