import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Settings } from 'lucide-react';
import { useActiveServices } from '@/hooks/useActiveServices';
import { ActiveService } from '@/types/active-services';
import ServiceManagementDialog from './ServiceManagementDialog';
import ServiceStatsCards from './ServiceStatsCards';
import ServiceFilters from './ServiceFilters';
import ServiceCard from './ServiceCard';
import ServiceTableView from './ServiceTableView';
import UpcomingRenewals from './UpcomingRenewals';
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
  const filteredServices = activeServices.filter(service => {
    const matchesSearch = service.serviceName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || service.status === statusFilter;
    const matchesType = typeFilter === 'all' || service.serviceType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });
  const handleStatusUpdate = async (serviceId: string, status: 'active' | 'paused') => {
    await handleServiceUpdate(serviceId, {
      status
    });
  };
  const handleManageService = (service: ActiveService) => {
    setSelectedService(service);
    setShowManageSubscriptions(true);
  };
  if (isLoading) {
    return <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => <div key={i} className="animate-pulse">
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>)}
        </div>
      </div>;
  }
  return <div className="space-y-6">
      <div className="flex items-center justify-between">
        
        <Button onClick={() => setShowManageSubscriptions(true)}>
          <Settings className="h-4 w-4 mr-2" />
          Manage Subscriptions
        </Button>
      </div>

      <ServiceStatsCards stats={stats} onCardClick={setSelectedDetailView} />

      <ServiceFilters searchQuery={searchQuery} onSearchChange={setSearchQuery} statusFilter={statusFilter} onStatusFilterChange={setStatusFilter} typeFilter={typeFilter} onTypeFilterChange={setTypeFilter} />

      <Tabs defaultValue="grid" className="w-full">
        <TabsList>
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="table">Table View</TabsTrigger>
        </TabsList>

        <TabsContent value="grid" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredServices.map(service => <ServiceCard key={service.id} service={service} onStatusUpdate={handleStatusUpdate} onManage={handleManageService} getStatusBadge={getStatusBadge} getServiceTypeIcon={getServiceTypeIcon} />)}
          </div>
        </TabsContent>

        <TabsContent value="table" className="space-y-4">
          <ServiceTableView filteredServices={filteredServices} onManage={handleManageService} getStatusBadge={getStatusBadge} />
        </TabsContent>
      </Tabs>

      <UpcomingRenewals activeServices={activeServices} onRenewService={handleRenewService} />

      <ServiceManagementDialog isOpen={showManageSubscriptions} onClose={() => {
      setShowManageSubscriptions(false);
      setSelectedService(null);
    }} selectedService={selectedService} onServiceUpdate={handleServiceUpdate} onServiceCancel={handleCancelService} onServiceRenew={handleRenewService} />
    </div>;
};
export default ActiveServicesManagement;