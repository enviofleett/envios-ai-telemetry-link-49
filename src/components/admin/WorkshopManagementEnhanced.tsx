
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Building2, 
  Users, 
  CheckCircle, 
  Clock, 
  Search,
  Eye,
  UserCheck,
  Ban,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Workshop {
  id: string;
  name: string;
  representative_name: string;
  email: string;
  phone?: string;
  city?: string;
  country?: string;
  service_types: string[] | any; // Handle both string[] and Json types
  verified: boolean;
  is_active: boolean;
  created_at: string;
}

const WorkshopManagementEnhanced: React.FC = () => {
  const { toast } = useToast();
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadWorkshops();
  }, []);

  const loadWorkshops = async () => {
    try {
      const { data, error } = await supabase
        .from('workshops')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Handle the service_types conversion from Json to string[]
      const processedData = (data || []).map(workshop => ({
        ...workshop,
        service_types: Array.isArray(workshop.service_types) 
          ? workshop.service_types 
          : workshop.service_types 
            ? [workshop.service_types].flat()
            : []
      }));
      
      setWorkshops(processedData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load workshops",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const approveWorkshop = async (workshopId: string) => {
    setActionLoading(workshopId);
    try {
      const { error } = await supabase
        .from('workshops')
        .update({ 
          verified: true, 
          is_active: true 
        })
        .eq('id', workshopId);

      if (error) throw error;

      toast({
        title: "Workshop Approved",
        description: "Workshop has been approved and activated"
      });

      loadWorkshops();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to approve workshop",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const rejectWorkshop = async (workshopId: string) => {
    setActionLoading(workshopId);
    try {
      const { error } = await supabase
        .from('workshops')
        .update({ 
          verified: false, 
          is_active: false 
        })
        .eq('id', workshopId);

      if (error) throw error;

      toast({
        title: "Workshop Rejected",
        description: "Workshop has been rejected and deactivated"
      });

      loadWorkshops();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to reject workshop",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const accessWorkshopDashboard = (workshop: Workshop) => {
    // Store impersonation session
    localStorage.setItem('admin_workshop_session', JSON.stringify({
      originalUser: 'admin',
      workshop: workshop,
      user: {
        id: 'admin-' + workshop.id,
        name: 'Admin Access',
        role: 'owner',
        email: workshop.email
      }
    }));

    // Open workshop dashboard in new tab
    window.open('/workshop-dashboard', '_blank');
  };

  const filteredWorkshops = workshops.filter(workshop =>
    workshop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workshop.representative_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workshop.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workshop.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingWorkshops = filteredWorkshops.filter(w => !w.verified);
  const activeWorkshops = filteredWorkshops.filter(w => w.verified && w.is_active);
  const inactiveWorkshops = filteredWorkshops.filter(w => !w.is_active);

  const statsCards = [
    {
      title: 'Total Workshops',
      value: workshops.length,
      icon: Building2,
      color: 'text-blue-600'
    },
    {
      title: 'Pending Approval',
      value: pendingWorkshops.length,
      icon: Clock,
      color: 'text-yellow-600'
    },
    {
      title: 'Active Workshops',
      value: activeWorkshops.length,
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      title: 'Total Inspectors',
      value: 0, // This would come from workshop_users count
      icon: Users,
      color: 'text-purple-600'
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading workshops...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Workshop Management</h1>
          <p className="text-muted-foreground">
            Manage workshop registrations, approvals, and access dashboards
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

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search workshops by name, email, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Workshop Tabs */}
      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">
            Pending Approval ({pendingWorkshops.length})
          </TabsTrigger>
          <TabsTrigger value="active">
            Active Workshops ({activeWorkshops.length})
          </TabsTrigger>
          <TabsTrigger value="inactive">
            Inactive ({inactiveWorkshops.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingWorkshops.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Pending Approvals</h3>
                <p className="text-muted-foreground">
                  All workshops have been reviewed
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pendingWorkshops.map((workshop) => (
                <Card key={workshop.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">{workshop.name}</h3>
                          <Badge variant="secondary">Pending</Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <Users className="h-4 w-4" />
                              <span>{workshop.representative_name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-4 w-4" />
                              <span>{workshop.email}</span>
                            </div>
                            {workshop.phone && (
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-4 w-4" />
                                <span>{workshop.phone}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="h-4 w-4" />
                              <span>{workshop.city}, {workshop.country}</span>
                            </div>
                            <div className="text-sm">
                              <strong>Services:</strong> {workshop.service_types.join(', ')}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => accessWorkshopDashboard(workshop)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => approveWorkshop(workshop.id)}
                          disabled={actionLoading === workshop.id}
                        >
                          <UserCheck className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => rejectWorkshop(workshop.id)}
                          disabled={actionLoading === workshop.id}
                        >
                          <Ban className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          {activeWorkshops.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Active Workshops</h3>
                <p className="text-muted-foreground">
                  Approved workshops will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {activeWorkshops.map((workshop) => (
                <Card key={workshop.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">{workshop.name}</h3>
                          <Badge variant="default">Active</Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <Users className="h-4 w-4" />
                              <span>{workshop.representative_name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-4 w-4" />
                              <span>{workshop.email}</span>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="h-4 w-4" />
                              <span>{workshop.city}, {workshop.country}</span>
                            </div>
                            <div className="text-sm">
                              <strong>Services:</strong> {workshop.service_types.slice(0, 3).join(', ')}
                              {workshop.service_types.length > 3 && ` +${workshop.service_types.length - 3} more`}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => accessWorkshopDashboard(workshop)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Access Dashboard
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => rejectWorkshop(workshop.id)}
                          disabled={actionLoading === workshop.id}
                        >
                          <Ban className="h-4 w-4 mr-2" />
                          Deactivate
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="inactive" className="space-y-4">
          {inactiveWorkshops.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Ban className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Inactive Workshops</h3>
                <p className="text-muted-foreground">
                  Deactivated workshops will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {inactiveWorkshops.map((workshop) => (
                <Card key={workshop.id} className="opacity-75">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">{workshop.name}</h3>
                          <Badge variant="secondary">Inactive</Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <Users className="h-4 w-4" />
                              <span>{workshop.representative_name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-4 w-4" />
                              <span>{workshop.email}</span>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="h-4 w-4" />
                              <span>{workshop.city}, {workshop.country}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => approveWorkshop(workshop.id)}
                          disabled={actionLoading === workshop.id}
                        >
                          <UserCheck className="h-4 w-4 mr-2" />
                          Reactivate
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WorkshopManagementEnhanced;
