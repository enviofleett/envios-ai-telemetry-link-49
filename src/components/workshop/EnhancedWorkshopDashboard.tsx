
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, Users, CheckCircle, Clock, Settings, Plus } from 'lucide-react';

const EnhancedWorkshopDashboard: React.FC = () => {
  const workshopStats = {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    connected: 0
  };

  const mockWorkshops = [
    {
      id: '1',
      name: 'Premium Auto Service',
      location: 'Downtown',
      status: 'approved',
      connectionStatus: 'connected',
      lastActivity: '2024-01-15'
    },
    {
      id: '2', 
      name: 'Quick Fix Garage',
      location: 'Suburb',
      status: 'pending',
      connectionStatus: 'pending',
      lastActivity: '2024-01-14'
    }
  ];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      approved: { color: 'bg-green-100 text-green-800', text: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800', text: 'Rejected' },
      connected: { color: 'bg-blue-100 text-blue-800', text: 'Connected' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { 
      color: 'bg-gray-100 text-gray-800', 
      text: status 
    };
    
    return (
      <Badge className={config.color}>
        {config.text}
      </Badge>
    );
  };

  const statsCards = [
    {
      title: 'Total Workshops',
      value: workshopStats.total,
      icon: Building2,
      color: 'text-blue-600'
    },
    {
      title: 'Connected',
      value: workshopStats.connected,
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      title: 'Pending',
      value: workshopStats.pending,
      icon: Clock,
      color: 'text-yellow-600'
    },
    {
      title: 'Active Services',
      value: 0,
      icon: Settings,
      color: 'text-purple-600'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Workshop Management</h1>
          <p className="text-muted-foreground">
            Connect and manage automotive workshops for vehicle services
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Connect Workshop
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Workshop Connections */}
      <Card>
        <CardHeader>
          <CardTitle>Workshop Connections</CardTitle>
        </CardHeader>
        <CardContent>
          {mockWorkshops.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Workshops Connected</h3>
              <p className="text-gray-600 mb-4">
                Connect with automotive workshops to enable maintenance services.
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Find Workshops
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {mockWorkshops.map((workshop) => (
                <div key={workshop.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium">{workshop.name}</h3>
                    <p className="text-sm text-gray-500">{workshop.location}</p>
                    <p className="text-sm text-gray-500">Last activity: {workshop.lastActivity}</p>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {getStatusBadge(workshop.status)}
                    {getStatusBadge(workshop.connectionStatus)}
                    <Button variant="outline" size="sm">
                      Manage
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedWorkshopDashboard;
