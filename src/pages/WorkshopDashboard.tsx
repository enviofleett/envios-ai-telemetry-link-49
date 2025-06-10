
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar,
  Users,
  ClipboardList,
  Car,
  History,
  Settings,
  LogOut,
  TrendingUp,
  Clock,
  CheckCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WorkshopSession {
  user: any;
  workshop: any;
}

const WorkshopDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [session, setSession] = useState<WorkshopSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalInspections: 0,
    pendingAppointments: 0,
    activeInspectors: 0,
    completedToday: 0
  });

  useEffect(() => {
    const checkSession = () => {
      const savedSession = localStorage.getItem('workshop_session');
      if (savedSession) {
        setSession(JSON.parse(savedSession));
        loadDashboardStats();
      } else {
        navigate('/workshop-login');
      }
      setLoading(false);
    };

    checkSession();
  }, [navigate]);

  const loadDashboardStats = async () => {
    try {
      // Load workshop statistics
      const session = JSON.parse(localStorage.getItem('workshop_session') || '{}');
      const workshopId = session.workshop?.id;
      
      if (!workshopId) return;

      // Get inspection count
      const { count: inspectionCount } = await supabase
        .from('vehicle_inspections')
        .select('*', { count: 'exact', head: true })
        .eq('workshop_id', workshopId);

      // Get pending appointments
      const { count: appointmentCount } = await supabase
        .from('workshop_appointments')
        .select('*', { count: 'exact', head: true })
        .eq('workshop_id', workshopId)
        .eq('appointment_status', 'scheduled');

      // Get active inspectors
      const { count: inspectorCount } = await supabase
        .from('workshop_users')
        .select('*', { count: 'exact', head: true })
        .eq('workshop_id', workshopId)
        .eq('is_active', true);

      // Get today's completed inspections
      const today = new Date().toISOString().split('T')[0];
      const { count: completedToday } = await supabase
        .from('vehicle_inspections')
        .select('*', { count: 'exact', head: true })
        .eq('workshop_id', workshopId)
        .eq('inspection_status', 'completed')
        .gte('completed_at', today);

      setStats({
        totalInspections: inspectionCount || 0,
        pendingAppointments: appointmentCount || 0,
        activeInspectors: inspectorCount || 0,
        completedToday: completedToday || 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('workshop_session');
    toast({
      title: "Logged out",
      description: "You have been successfully logged out"
    });
    navigate('/workshop-login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const statsCards = [
    {
      title: 'Total Inspections',
      value: stats.totalInspections,
      icon: ClipboardList,
      color: 'text-blue-600'
    },
    {
      title: 'Pending Appointments',
      value: stats.pendingAppointments,
      icon: Clock,
      color: 'text-yellow-600'
    },
    {
      title: 'Active Inspectors',
      value: stats.activeInspectors,
      icon: Users,
      color: 'text-green-600'
    },
    {
      title: 'Completed Today',
      value: stats.completedToday,
      icon: CheckCircle,
      color: 'text-purple-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {session.workshop.name}
              </h1>
              <p className="text-sm text-gray-500">
                Welcome back, {session.user.name}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline">
                {session.user.role}
              </Badge>
              <Button variant="ghost" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

        {/* Main Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="inspections">Inspections</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="inspectors">Inspectors</TabsTrigger>
            <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest workshop activities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      No recent activities to display.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Appointments</CardTitle>
                  <CardDescription>Next scheduled inspections</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      No upcoming appointments scheduled.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="inspections">
            <Card>
              <CardHeader>
                <CardTitle>Inspection Management</CardTitle>
                <CardDescription>Create and manage vehicle inspections</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Inspections Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start by creating your first vehicle inspection
                  </p>
                  <Button>
                    Create New Inspection
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appointments">
            <Card>
              <CardHeader>
                <CardTitle>Appointment Calendar</CardTitle>
                <CardDescription>Manage workshop appointments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Appointments</h3>
                  <p className="text-muted-foreground mb-4">
                    Appointments will appear here when scheduled
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inspectors">
            <Card>
              <CardHeader>
                <CardTitle>Inspector Management</CardTitle>
                <CardDescription>Manage workshop inspectors and staff</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Manage Your Team</h3>
                  <p className="text-muted-foreground mb-4">
                    Add and manage inspectors for your workshop
                  </p>
                  <Button>
                    Add Inspector
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vehicles">
            <Card>
              <CardHeader>
                <CardTitle>Vehicle Management</CardTitle>
                <CardDescription>Vehicles assigned to your workshop</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Car className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Assigned Vehicles</h3>
                  <p className="text-muted-foreground mb-4">
                    Vehicles will appear here when assigned to your workshop
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Inspection History</CardTitle>
                <CardDescription>View all past inspections and reports</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No History Available</h3>
                  <p className="text-muted-foreground mb-4">
                    Inspection history will appear here after completing inspections
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default WorkshopDashboard;
