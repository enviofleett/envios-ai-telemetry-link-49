
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from "sonner";

import DeviceTable from './DeviceTable';
import GroupGrid from './GroupGrid';
import StatisticsCards from './StatisticsCards';
import { gp51DataService } from '@/services/gp51/GP51DataService';
import type { GP51Group, GP51DeviceData } from '@/types/gp51-unified';

// Define proper dashboard summary type
interface GP51DashboardSummary {
  totalUsers: number;
  totalDevices: number;
  activeDevices: number;
  offlineDevices: number;
  totalGroups: number;
  lastUpdateTime: Date;
  connectionStatus: "error" | "disconnected" | "connected";
  apiResponseTime: number;
  total_users: number;
  total_devices: number;
  active_devices: number;
  offline_devices: number;
  total_groups: number;
}

interface GP51User {
  id?: string;
  username?: string;
  nickname?: string;
  showname?: string;
  gp51_username?: string;
  company_name?: string;
  companyname?: string;
  is_active?: boolean;
}

interface DashboardData {
  groups: GP51Group[];
  devices: GP51DeviceData[];
  users: GP51User[];
  summary: GP51DashboardSummary;
}

const GPS51Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData>({
    groups: [],
    devices: [],
    users: [],
    summary: {
      totalUsers: 0,
      totalDevices: 0,
      activeDevices: 0,
      offlineDevices: 0,
      totalGroups: 0,
      lastUpdateTime: new Date(),
      connectionStatus: 'disconnected',
      apiResponseTime: 0,
      total_users: 0,
      total_devices: 0,
      active_devices: 0,
      offline_devices: 0,
      total_groups: 0
    }
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const getUserProps = (user: GP51User) => ({
    id: user.id || user.username,
    nickname: user.nickname || user.showname,
    gp51_username: user.gp51_username || user.username,
    company_name: user.company_name || user.companyname,
    is_active: user.is_active ?? true
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Loading GP51 dashboard data...');
      
      // Use existing method instead of getDataDirectly
      const devices = await gp51DataService.getDeviceList();
      const liveVehicles = await gp51DataService.getLiveVehicles();
      
      const dashboardData: DashboardData = {
        groups: [],
        devices: devices,
        users: [],
        summary: {
          totalUsers: 0,
          totalDevices: devices.length,
          activeDevices: devices.filter(d => d.isActive).length,
          offlineDevices: devices.filter(d => !d.isActive).length,
          totalGroups: 0,
          lastUpdateTime: new Date(),
          connectionStatus: 'connected',
          apiResponseTime: 0,
          total_users: 0,
          total_devices: devices.length,
          active_devices: devices.filter(d => d.isActive).length,
          offline_devices: devices.filter(d => !d.isActive).length,
          total_groups: 0
        }
      };

      setData(dashboardData);
      setLastUpdated(new Date());
      toast.success('Dashboard data loaded successfully');
      
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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">GP51 Dashboard</CardTitle>
              <p className="text-muted-foreground">
                Monitor your GP51 devices, groups, and users
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

      {loading && (
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading GP51 data...</span>
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
          <StatisticsCards summary={data.summary} />
          <GroupGrid 
            groups={data.groups} 
            loading={loading} 
            onRefresh={handleRefresh}
          />
          <DeviceTable 
            devices={data.devices} 
            loading={loading} 
            onRefresh={handleRefresh}
          />

          {data.users.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>GP51 Users ({data.users.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {data.users.slice(0, 6).map((user) => {
                    const props = getUserProps(user);
                    return (
                      <div key={props.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{props.nickname}</h4>
                            <p className="text-sm text-muted-foreground">@{props.gp51_username}</p>
                            <p className="text-sm text-muted-foreground">{props.company_name}</p>
                          </div>
                          <Badge variant={props.is_active ? "default" : "secondary"}>
                            {props.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
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
