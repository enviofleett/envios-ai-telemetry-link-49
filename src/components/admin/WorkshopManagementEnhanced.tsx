
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, Users, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Workshop } from '@/types/workshop';
import WorkshopApprovalSystem from './WorkshopApprovalSystem';

interface WorkshopStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

const AdminWorkshopManagementEnhanced: React.FC = () => {
  const [allWorkshops, setAllWorkshops] = useState<Workshop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [workshopStats, setWorkshopStats] = useState<WorkshopStats | null>(null);
  const { toast } = useToast();

  const loadWorkshops = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('workshops')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const workshopsData = (data || []).map(workshop => ({
        ...workshop,
        service_types: Array.isArray(workshop.service_types) 
          ? workshop.service_types 
          : workshop.service_types 
            ? JSON.parse(workshop.service_types as string) 
            : []
      })) as Workshop[];
      
      setAllWorkshops(workshopsData);
      
      // Calculate stats
      const stats: WorkshopStats = {
        total: workshopsData.length,
        pending: workshopsData.filter(w => w.status === 'pending').length,
        approved: workshopsData.filter(w => w.status === 'approved').length,
        rejected: workshopsData.filter(w => w.status === 'rejected').length,
      };
      setWorkshopStats(stats);
    } catch (error) {
      console.error('Failed to load workshops:', error);
      toast({
        title: "Error",
        description: "Failed to load workshops",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveWorkshop = async (workshopId: string, notes?: string) => {
    try {
      setIsApproving(true);
      const { error } = await supabase
        .from('workshops')
        .update({ 
          status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('id', workshopId);

      if (error) throw error;
      
      toast({
        title: "Workshop Approved",
        description: "Workshop has been successfully approved.",
      });
      
      loadWorkshops();
    } catch (error) {
      console.error('Failed to approve workshop:', error);
      toast({
        title: "Error",
        description: "Failed to approve workshop",
        variant: "destructive"
      });
    } finally {
      setIsApproving(false);
    }
  };

  const handleRejectWorkshop = async (workshopId: string, reason: string) => {
    try {
      setIsRejecting(true);
      const { error } = await supabase
        .from('workshops')
        .update({ 
          status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', workshopId);

      if (error) throw error;
      
      toast({
        title: "Workshop Rejected",
        description: "Workshop has been rejected.",
      });
      
      loadWorkshops();
    } catch (error) {
      console.error('Failed to reject workshop:', error);
      toast({
        title: "Error",
        description: "Failed to reject workshop",
        variant: "destructive"
      });
    } finally {
      setIsRejecting(false);
    }
  };

  useEffect(() => {
    loadWorkshops();
  }, []);

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
        <Button variant="outline" onClick={loadWorkshops}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
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

export default AdminWorkshopManagementEnhanced;
