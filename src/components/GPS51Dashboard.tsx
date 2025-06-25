
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from "sonner";

import DeviceTable from './DeviceTable';
import GroupGrid from './GroupGrid';
import StatisticsCards from './StatisticsCards';
import { gps51DataService } from '@/services/gp51/GPS51DataService';
import type { GPS51Group, GPS51Device, GPS51User, GPS51DashboardSummary } from '@/types/gp51';

interface DashboardData {
  groups: GPS51Group[];
  devices: GPS51Device[];
  users: GPS51User[];
  summary: GPS51DashboardSummary;
}

const GPS51Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData>({
    groups: [],
    devices: [],
    users: [],
    summary: {
      total_devices: 0,
      active_devices: 0,
      total_groups: 0,
      devices_with_positions: 0,
      total_users: 0
    }
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Loading GPS51 dashboard data...');
      
      const result = await gps51DataService.getDataDirectly();
      
      if (result.success && result.data) {
        setData(result.data);
        setLastUpdated(new Date());
        toast.success('Dashboard data loaded successfully');
      } else {
        throw new Error('Failed to load data');
      }
      
    } catch (err) {
      console.error('❌ Error loading dashboard data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast.error(`Failed to load data: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadData();
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">GPS51 Dashboard</CardTitle>
              <p className="text-muted-foreground">
                Monitor your GPS51 devices, groups, and users
              </p>
            </div>
            <div className="flex items-center gap-2">
              {lastUpdated && (
                <span className="text-sm text-muted-foreground">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
              <Button onClick={handleRefresh} disabled={loading} variant="outline">
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Status Messages */}
      {loading && (
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading GPS51 data...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-destructive">
          <CardContent className="py-6">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-destructive mr-2 mt-0.5" />
              <div>
                <h4 className="font-semibold text-destructive">Error Loading Data</h4>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && !error && (
        <>
          {/* Summary Statistics */}
          <StatisticsCards summary={data.summary} />

          {/* Groups Section */}
          <GroupGrid 
            groups={data.groups} 
            loading={loading} 
            onRefresh={handleRefresh}
          />

          {/* Devices Section */}
          <DeviceTable 
            devices={data.devices} 
            loading={loading} 
            onRefresh={handleRefresh}
          />

          {/* Users Summary */}
          {data.users.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>GPS51 Users ({data.users.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {data.users.slice(0, 6).map((user) => (
                    <div key={user.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{user.nickname}</h4>
                          <p className="text-sm text-muted-foreground">@{user.gp51_username}</p>
                          <p className="text-sm text-muted-foreground">{user.company_name}</p>
                        </div>
                        <Badge variant={user.is_active ? "default" : "secondary"}>
                          {user.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
                {data.users.length > 6 && (
                  <p className="text-center text-muted-foreground text-sm mt-4">
                    ... and {data.users.length - 6} more users
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default GPS51Dashboard;
