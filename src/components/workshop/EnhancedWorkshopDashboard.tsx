
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  MapPin, 
  Star, 
  Phone, 
  Clock, 
  Wrench,
  Calendar,
  Users,
  TrendingUp,
  CheckCircle
} from 'lucide-react';

export function EnhancedWorkshopDashboard() {
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data for demonstration
  const workshopStats = {
    totalWorkshops: 45,
    connectedWorkshops: 12,
    activeAppointments: 8,
    completedServices: 156
  };

  const connectedWorkshops = [
    {
      id: '1',
      name: 'AutoTech Pro',
      location: 'Downtown District',
      rating: 4.8,
      distance: '2.3 km',
      specialties: ['Electronics', 'GPS Installation'],
      status: 'active',
      phone: '+1 (555) 123-4567'
    },
    {
      id: '2',
      name: 'Fleet Service Center',
      location: 'Industrial Zone',
      rating: 4.6,
      distance: '5.1 km',
      specialties: ['Fleet Maintenance', 'Diagnostics'],
      status: 'active',
      phone: '+1 (555) 987-6543'
    }
  ];

  const availableWorkshops = [
    {
      id: '3',
      name: 'Quick Fix Auto',
      location: 'Suburb Area',
      rating: 4.5,
      distance: '8.2 km',
      specialties: ['Quick Service', 'Installations'],
      status: 'available'
    },
    {
      id: '4',
      name: 'Premium Auto Care',
      location: 'City Center',
      rating: 4.9,
      distance: '3.7 km',
      specialties: ['Premium Service', 'Electronics'],
      status: 'available'
    }
  ];

  const recentAppointments = [
    {
      id: '1',
      workshop: 'AutoTech Pro',
      service: 'GPS Tracker Installation',
      vehicle: 'Ford Transit - ABC123',
      date: '2024-01-15',
      status: 'completed'
    },
    {
      id: '2',
      workshop: 'Fleet Service Center',
      service: 'System Diagnostics',
      vehicle: 'Toyota Hiace - XYZ789',
      date: '2024-01-18',
      status: 'scheduled'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Workshop Management</h1>
          <p className="text-muted-foreground">
            Connect with workshops and manage your vehicle maintenance services
          </p>
        </div>
        <Button>
          <Search className="h-4 w-4 mr-2" />
          Find Workshops
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Workshops</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workshopStats.totalWorkshops}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workshopStats.connectedWorkshops}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workshopStats.activeAppointments}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Services</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workshopStats.completedServices}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="connected" className="space-y-4">
        <TabsList>
          <TabsTrigger value="connected">Connected Workshops</TabsTrigger>
          <TabsTrigger value="available">Find Workshops</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="history">Service History</TabsTrigger>
        </TabsList>

        <TabsContent value="connected" className="space-y-4">
          <div className="grid gap-4">
            {connectedWorkshops.map((workshop) => (
              <Card key={workshop.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">{workshop.name}</h3>
                        <Badge variant="default">Connected</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {workshop.location} • {workshop.distance}
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          {workshop.rating}
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          {workshop.phone}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {workshop.specialties.map((specialty) => (
                          <Badge key={specialty} variant="secondary">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Calendar className="h-4 w-4 mr-2" />
                        Book Service
                      </Button>
                      <Button size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="available" className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search workshops by name or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button variant="outline">
              <MapPin className="h-4 w-4 mr-2" />
              Near Me
            </Button>
          </div>

          <div className="grid gap-4">
            {availableWorkshops.map((workshop) => (
              <Card key={workshop.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">{workshop.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {workshop.location} • {workshop.distance}
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          {workshop.rating}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {workshop.specialties.map((specialty) => (
                          <Badge key={specialty} variant="secondary">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        View Profile
                      </Button>
                      <Button size="sm">
                        Connect
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="appointments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="font-medium">{appointment.service}</div>
                      <div className="text-sm text-muted-foreground">
                        {appointment.workshop} • {appointment.vehicle}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {appointment.date}
                      </div>
                    </div>
                    <Badge 
                      variant={appointment.status === 'completed' ? 'default' : 'secondary'}
                    >
                      {appointment.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Service History</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                View complete history of all maintenance services and workshop interactions.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
