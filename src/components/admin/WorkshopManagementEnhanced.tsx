
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, CheckCircle, Clock } from 'lucide-react';
import WorkshopApprovalSystem from './WorkshopApprovalSystem';
import { useWorkshopManagement } from '@/hooks/useWorkshopManagement';

const WorkshopManagementEnhanced: React.FC = () => {
  const {
    allWorkshops,
    isLoading,
    approveWorkshop,
    rejectWorkshop,
    isApproving,
    isRejecting,
    workshopStats
  } = useWorkshopManagement();

  const handleApproveWorkshop = (workshopId: string, notes?: string) => {
    approveWorkshop({ workshopId, notes });
  };

  const handleRejectWorkshop = (workshopId: string, reason: string) => {
    rejectWorkshop({ workshopId, reason });
  };

  const statsCards = [
    {
      title: 'Total Workshops',
      value: workshopStats?.total || 0,
      icon: Building2,
      color: 'text-blue-600'
    },
    {
      title: 'Pending Approval',
      value: workshopStats?.pending || 0,
      icon: Clock,
      color: 'text-yellow-600'
    },
    {
      title: 'Approved',
      value: workshopStats?.approved || 0,
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      title: 'Active Connections',
      value: '0', // This would come from connections data
      icon: Users,
      color: 'text-purple-600'
    }
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Workshop Management</h1>
          <p className="text-muted-foreground">Loading workshops...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Workshop Management</h1>
          <p className="text-muted-foreground">
            Manage workshop registrations and approvals
          </p>
        </div>
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

      {/* Workshop Approval System */}
      <WorkshopApprovalSystem
        workshops={allWorkshops || []}
        onApprove={handleApproveWorkshop}
        onReject={handleRejectWorkshop}
        isLoading={isApproving || isRejecting}
      />
    </div>
  );
};

export default WorkshopManagementEnhanced;
