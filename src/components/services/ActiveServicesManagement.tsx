
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Search,
  MoreHorizontal,
  Settings,
  Pause,
  Play,
  Calendar,
  DollarSign,
  Car,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { useActiveServices } from '@/hooks/useActiveServices';
import { ActiveService } from '@/types/active-services';
import ServiceManagementDialog from './ServiceManagementDialog';

const ActiveServicesManagement: React.FC = () => {
  const {
    activeServices,
    stats,
    isLoading,
    handleServiceUpdate,
    handleCancelService,
    handleRenewService
  } = useActiveServices();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedDetailView, setSelectedDetailView] = useState<'services' | 'spending' | 'vehicles' | null>(null);
  const [showManageSubscriptions, setShowManageSubscriptions] = useState(false);
  const [selectedService, setSelectedService] = useState<ActiveService | null>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-100 text-yellow-800">Paused</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getServiceTypeIcon = (type: string) => {
    const service = activeServices.find(s => s.serviceType === type);
    return service ? <service.icon className="h-4 w-4" /> : <Settings className="h-4 w-4" />;
  };

  const filteredServices = activeServices.filter((service) => {
    const matchesSearch = service.serviceName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || service.status === statusFilter;
    const matchesType = typeFilter === 'all' || service.serviceType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-32"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Active Services</h2>
        <Button onClick={() => setShowManageSubscriptions(true)}>
          <Settings className="h-4 w-4 mr-2" />
          Manage Subscriptions
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setSelectedDetailView('services')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Services</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCount}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pausedCount} paused
            </p>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setSelectedDetailView('spending')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Spend</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalMonthlySpend.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Per month</p>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setSelectedDetailView('spending')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalSpent.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setSelectedDetailView('vehicles')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vehicles Covered</CardTitle>
            <Car className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.allVehicles.length}</div>
            <p className="text-xs text-muted-foreground">Unique vehicles</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search services..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="telemetry">Telemetry</SelectItem>
            <SelectItem value="insurance">Insurance</SelectItem>
            <SelectItem value="parts">Parts</SelectItem>
            <SelectItem value="platform">Platform</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="grid" className="w-full">
        <TabsList>
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="table">Table View</TabsTrigger>
        </TabsList>

        <TabsContent value="grid" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredServices.map((service) => (
              <Card key={service.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <service.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{service.serviceName}</CardTitle>
                        <CardDescription className="flex items-center gap-1">
                          {getServiceTypeIcon(service.serviceType)}
                          <span className="capitalize">{service.serviceType}</span>
                        </CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(service.status)}
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Vehicles:</span>
                      <span className="font-medium">{service.vehicles.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Monthly Fee:</span>
                      <span className="font-medium">
                        {service.monthlyFee > 0 ? `$${service.monthlyFee.toFixed(2)}` : 'One-time'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Last Used:</span>
                      <span className="font-medium">{service.lastUsed}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Expires:</span>
                      <span className="font-medium">{service.expiryDate}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Features:</h4>
                    <div className="space-y-1">
                      {service.features.slice(0, 3).map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span className="text-muted-foreground">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
                <div className="p-6 pt-0">
                  <div className="flex gap-2">
                    {service.status === 'active' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleServiceUpdate(service.id, { status: 'paused' })}
                      >
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleServiceUpdate(service.id, { status: 'active' })}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Resume
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedService(service);
                        setShowManageSubscriptions(true);
                      }}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="table" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Service Details</CardTitle>
              <CardDescription>Detailed view of all your active services</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Vehicles</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Monthly Fee</TableHead>
                    <TableHead>Total Spent</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredServices.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <service.icon className="h-4 w-4 text-primary" />
                          <span className="font-medium">{service.serviceName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">{service.serviceType}</TableCell>
                      <TableCell>{service.vehicles.length}</TableCell>
                      <TableCell>{getStatusBadge(service.status)}</TableCell>
                      <TableCell>
                        {service.monthlyFee > 0 ? `$${service.monthlyFee.toFixed(2)}` : 'One-time'}
                      </TableCell>
                      <TableCell>${service.totalSpent.toFixed(2)}</TableCell>
                      <TableCell>{service.expiryDate}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedService(service);
                              setShowManageSubscriptions(true);
                            }}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upcoming Renewals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Renewals
          </CardTitle>
          <CardDescription>Services that will renew or expire soon</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activeServices
              .filter((service) => {
                const expiryDate = new Date(service.expiryDate);
                const now = new Date();
                const daysUntilExpiry = Math.ceil(
                  (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                );
                return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
              })
              .map((service) => {
                const expiryDate = new Date(service.expiryDate);
                const now = new Date();
                const daysUntilExpiry = Math.ceil(
                  (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                );

                return (
                  <div key={service.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                      <Clock className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{service.serviceName}</p>
                      <p className="text-sm text-muted-foreground">
                        Expires in {daysUntilExpiry} days ({service.expiryDate})
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newEndDate = new Date(service.expiryDate);
                        newEndDate.setFullYear(newEndDate.getFullYear() + 1);
                        handleRenewService(service.id, newEndDate.toISOString());
                      }}
                    >
                      Renew Now
                    </Button>
                  </div>
                );
              })}
            {activeServices.filter((service) => {
              const expiryDate = new Date(service.expiryDate);
              const now = new Date();
              const daysUntilExpiry = Math.ceil(
                (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
              );
              return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
            }).length === 0 && (
              <p className="text-muted-foreground text-center py-4">
                No services expiring in the next 30 days
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Service Management Dialog */}
      <ServiceManagementDialog
        isOpen={showManageSubscriptions}
        onClose={() => {
          setShowManageSubscriptions(false);
          setSelectedService(null);
        }}
        selectedService={selectedService}
        onServiceUpdate={handleServiceUpdate}
        onServiceCancel={handleCancelService}
        onServiceRenew={handleRenewService}
      />
    </div>
  );
};

export default ActiveServicesManagement;
