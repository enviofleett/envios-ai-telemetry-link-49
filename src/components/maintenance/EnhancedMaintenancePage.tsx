
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Search,
  Plus,
  Building2,
  MapPin,
  Star,
  Phone,
  Mail,
  Wrench,
  Settings,
  DollarSign,
  CheckCircle,
  Clock,
  Filter,
  Eye,
  BarChart3,
  FileText,
  User,
} from 'lucide-react';
import { MaintenanceStats } from './MaintenanceStats';
import { MaintenanceList } from './MaintenanceList';
import { MaintenanceHistory } from './MaintenanceHistory';
import { ConnectedWorkshopsList } from './ConnectedWorkshopsList';

interface Workshop {
  id: string;
  name: string;
  description: string;
  representativeName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  serviceTypes: string[];
  operatingHours: string;
  certifications: string[];
  website?: string;
  rating: number;
  reviewCount: number;
  verified: boolean;
  featured: boolean;
  activationFee: number;
  joinDate: string;
  status: 'active' | 'pending' | 'suspended';
}

interface Vehicle {
  id: string;
  plateNumber: string;
  model: string;
  year: number;
  status: 'active' | 'inactive' | 'maintenance';
}

const mockWorkshops: Workshop[] = [
  {
    id: 'ws-1',
    name: 'AutoCare Plus',
    description: 'Professional fleet maintenance with over 15 years of experience. Specializing in commercial vehicles and emergency repairs.',
    representativeName: 'John Martinez',
    email: 'john@autocareplus.com',
    phone: '+1 (555) 123-4567',
    address: '456 Service Rd',
    city: 'New York',
    country: 'United States',
    serviceTypes: ['General Maintenance', 'Electrical Services', 'Diagnostics'],
    operatingHours: 'Mon-Fri: 8AM-6PM, Sat: 9AM-3PM',
    certifications: ['ASE Certified', 'ISO 9001'],
    website: 'https://autocareplus.com',
    rating: 4.8,
    reviewCount: 124,
    verified: true,
    featured: true,
    activationFee: 149.99,
    joinDate: '2023-01-15',
    status: 'active',
  },
  {
    id: 'ws-2',
    name: 'Fleet Masters',
    description: 'Specialized in commercial fleet maintenance with mobile service options. Expert diesel technicians available 24/7.',
    representativeName: 'Sarah Johnson',
    email: 'sarah@fleetmasters.com',
    phone: '+1 (555) 987-6543',
    address: '789 Fleet Ave',
    city: 'Los Angeles',
    country: 'United States',
    serviceTypes: ['General Maintenance', 'Mechanical Services', 'Mobile Service'],
    operatingHours: 'Mon-Sat: 7AM-7PM',
    certifications: ['Diesel Specialist', 'Mobile Service Certified'],
    rating: 4.6,
    reviewCount: 98,
    verified: true,
    featured: false,
    activationFee: 199.99,
    joinDate: '2023-03-20',
    status: 'active',
  },
  {
    id: 'ws-3',
    name: 'QuickLube Commercial',
    description: 'Fast and reliable maintenance services for fleet vehicles. Quick turnaround times without sacrificing quality.',
    representativeName: 'Mike Chen',
    email: 'mike@quicklube.com',
    phone: '+1 (555) 456-7890',
    address: '123 Quick St',
    city: 'Chicago',
    country: 'United States',
    serviceTypes: ['General Maintenance', 'Tire Services'],
    operatingHours: 'Mon-Sun: 8AM-8PM',
    certifications: ['Quick Service Certified'],
    rating: 4.3,
    reviewCount: 76,
    verified: true,
    featured: false,
    activationFee: 99.99,
    joinDate: '2023-06-10',
    status: 'active',
  },
];

const mockUserVehicles: Vehicle[] = [
  { id: 'FL-001', plateNumber: 'ABC-1234', model: 'Ford Transit 2022', year: 2022, status: 'active' },
  { id: 'FL-002', plateNumber: 'XYZ-5678', model: 'Mercedes Sprinter 2023', year: 2023, status: 'active' },
  { id: 'FL-003', plateNumber: 'DEF-9012', model: 'Iveco Daily 2021', year: 2021, status: 'maintenance' },
];

const mockMaintenanceItems = [
  {
    id: '1',
    vehicleId: 'FL-001',
    plateNumber: 'ABC-1234',
    model: 'Ford Transit 2022',
    serviceType: 'Oil Change',
    scheduledDate: '2024-01-15',
    status: 'scheduled' as const,
    workshop: 'AutoCare Plus',
    priority: 'medium' as const,
  },
  {
    id: '2',
    vehicleId: 'FL-002',
    plateNumber: 'XYZ-5678',
    model: 'Mercedes Sprinter 2023',
    serviceType: 'Brake Inspection',
    scheduledDate: '2024-01-20',
    status: 'in-progress' as const,
    workshop: 'Fleet Masters',
    priority: 'high' as const,
  },
];

export const EnhancedMaintenancePage: React.FC = () => {
  const [userRole, setUserRole] = useState<'admin' | 'subscriber' | 'workshop'>('subscriber');
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [serviceTypeFilter, setServiceTypeFilter] = useState('all');
  const [showRegistration, setShowRegistration] = useState(false);
  const [showConnection, setShowConnection] = useState(false);
  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null);
  const [showWorkshopDetails, setShowWorkshopDetails] = useState(false);
  const [currentView, setCurrentView] = useState<'marketplace' | 'dashboard' | 'inspection'>('marketplace');

  const filteredWorkshops = mockWorkshops.filter((workshop) => {
    const matchesSearch =
      workshop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      workshop.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCity = cityFilter === 'all' || workshop.city === cityFilter;
    const matchesServiceType =
      serviceTypeFilter === 'all' ||
      workshop.serviceTypes.some((type) => type.toLowerCase().includes(serviceTypeFilter.toLowerCase()));

    return matchesSearch && matchesCity && matchesServiceType;
  });

  const uniqueCities = Array.from(new Set(mockWorkshops.map((w) => w.city)));
  const uniqueServiceTypes = Array.from(new Set(mockWorkshops.flatMap((w) => w.serviceTypes)));

  const handleWorkshopRegistration = (data: any) => {
    console.log('New workshop registration:', data);
  };

  const handleWorkshopConnection = (connectionData: any) => {
    console.log('Workshop connection:', connectionData);
  };

  const handleViewWorkshop = (workshop: Workshop) => {
    setSelectedWorkshop(workshop);
    setShowWorkshopDetails(true);
  };

  const handleConnectWorkshop = (workshop: Workshop) => {
    setSelectedWorkshop(workshop);
    setShowConnection(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Suspended</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${i < Math.floor(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
          />
        ))}
        <span className="ml-1 text-sm text-muted-foreground">{rating.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Role Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Maintenance Management</h2>
          <p className="text-muted-foreground">
            {userRole === 'admin'
              ? 'Manage workshops and maintenance operations'
              : userRole === 'workshop'
                ? 'Workshop operations and vehicle inspections'
                : 'Connect with approved workshops for vehicle maintenance'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={userRole} onValueChange={(value: any) => setUserRole(value)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="subscriber">Subscriber</SelectItem>
              <SelectItem value="workshop">Workshop</SelectItem>
            </SelectContent>
          </Select>

          {userRole === 'workshop' && (
            <div className="flex gap-2">
              <Button
                variant={currentView === 'dashboard' ? 'default' : 'outline'}
                onClick={() => setCurrentView('dashboard')}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              <Button
                variant={currentView === 'inspection' ? 'default' : 'outline'}
                onClick={() => setCurrentView('inspection')}
              >
                <FileText className="h-4 w-4 mr-2" />
                Inspection
              </Button>
            </div>
          )}

          {(userRole === 'admin' || userRole === 'subscriber') && (
            <Button onClick={() => setShowRegistration(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Workshop
            </Button>
          )}
        </div>
      </div>

      {/* Maintenance Overview */}
      <MaintenanceStats maintenanceItems={mockMaintenanceItems} />

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="workshops">Workshop Marketplace</TabsTrigger>
          <TabsTrigger value="connected">Connected Workshops</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <MaintenanceList maintenanceItems={mockMaintenanceItems} />
        </TabsContent>

        <TabsContent value="workshops" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search workshops..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="City" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {uniqueCities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={serviceTypeFilter} onValueChange={setServiceTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Service Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                {uniqueServiceTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {/* Workshop Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredWorkshops.map((workshop) => (
              <Card key={workshop.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 rounded-md">
                        <AvatarFallback className="rounded-md">
                          {workshop.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base flex items-center gap-1">
                          {workshop.name}
                          {workshop.verified && <CheckCircle className="h-4 w-4 text-blue-500 fill-blue-500" />}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {workshop.city}, {workshop.country}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      {workshop.featured && <Badge className="bg-primary text-primary-foreground">Featured</Badge>}
                      {getStatusBadge(workshop.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <div className="flex items-center justify-between">
                    {renderStars(workshop.rating)}
                    <span className="text-xs text-muted-foreground">{workshop.reviewCount} reviews</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1">
                      {workshop.serviceTypes.slice(0, 3).map((service, index) => (
                        <Badge key={index} variant="outline" className="bg-muted/50 text-xs">
                          {service}
                        </Badge>
                      ))}
                      {workshop.serviceTypes.length > 3 && (
                        <Badge variant="outline" className="bg-muted/50 text-xs">
                          +{workshop.serviceTypes.length - 3} more
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{workshop.description}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Activation Fee:</span>
                      <span className="font-medium">${workshop.activationFee}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{workshop.operatingHours}</span>
                    </div>
                  </div>
                </CardContent>
                <div className="p-6 pt-0">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleViewWorkshop(workshop)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    {userRole === 'subscriber' && (
                      <Button size="sm" onClick={() => handleConnectWorkshop(workshop)}>
                        <Wrench className="h-4 w-4 mr-2" />
                        Connect
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="connected" className="space-y-4">
          <ConnectedWorkshopsList workshops={mockWorkshops.filter(w => w.status === 'active')} />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <MaintenanceHistory />
        </TabsContent>
      </Tabs>

      {/* Workshop Details Dialog */}
      <Dialog open={showWorkshopDetails} onOpenChange={setShowWorkshopDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedWorkshop && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {selectedWorkshop.name}
                  {selectedWorkshop.verified && <CheckCircle className="h-4 w-4 text-blue-500 fill-blue-500" />}
                </DialogTitle>
                <DialogDescription>Complete workshop information and services</DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedWorkshop.representativeName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedWorkshop.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedWorkshop.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {selectedWorkshop.address}, {selectedWorkshop.city}, {selectedWorkshop.country}
                        </span>
                      </div>
                      {selectedWorkshop.website && (
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <a
                            href={selectedWorkshop.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {selectedWorkshop.website}
                          </a>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Workshop Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <span className="text-muted-foreground">Rating: </span>
                        <div className="inline-flex items-center gap-1">
                          {renderStars(selectedWorkshop.rating)}
                          <span className="text-sm text-muted-foreground">
                            ({selectedWorkshop.reviewCount} reviews)
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Operating Hours: </span>
                        <span>{selectedWorkshop.operatingHours}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Activation Fee: </span>
                        <span className="font-semibold">${selectedWorkshop.activationFee}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Member Since: </span>
                        <span>{selectedWorkshop.joinDate}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Status: </span>
                        {getStatusBadge(selectedWorkshop.status)}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{selectedWorkshop.description}</p>
                  </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Service Types</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {selectedWorkshop.serviceTypes.map((service, index) => (
                          <Badge key={index} variant="outline">
                            {service}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Certifications</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {selectedWorkshop.certifications.map((cert, index) => (
                          <Badge key={index} variant="outline" className="bg-green-50 text-green-700">
                            {cert}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setShowWorkshopDetails(false)}>
                    Close
                  </Button>
                  {userRole === 'subscriber' && (
                    <Button
                      onClick={() => {
                        setShowWorkshopDetails(false);
                        handleConnectWorkshop(selectedWorkshop);
                      }}
                    >
                      <Wrench className="h-4 w-4 mr-2" />
                      Connect Workshop
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
