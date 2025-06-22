
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Fuel, 
  Route,
  Users,
  Clock,
  DollarSign,
  BarChart3,
  PieChart,
  LineChart,
  Activity
} from 'lucide-react';
import PredictiveMaintenanceWidget from './PredictiveMaintenanceWidget';
import RouteOptimizationPanel from './RouteOptimizationPanel';
import DriverBehaviorAnalytics from './DriverBehaviorAnalytics';
import FuelManagementIntelligence from './FuelManagementIntelligence';

interface FleetMetrics {
  totalVehicles: number;
  activeVehicles: number;
  utilization: number;
  totalMileage: number;
  fuelEfficiency: number;
  maintenanceAlerts: number;
  costPerMile: number;
  averageSpeed: number;
}

interface PerformanceIndicator {
  label: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  change: number;
  status: 'good' | 'warning' | 'critical';
}

const FleetAnalyticsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('7d');
  const [isLoading, setIsLoading] = useState(true);

  // Mock data - in real implementation, this would come from analytics service
  const [fleetMetrics] = useState<FleetMetrics>({
    totalVehicles: 156,
    activeVehicles: 142,
    utilization: 87.5,
    totalMileage: 125430,
    fuelEfficiency: 8.4,
    maintenanceAlerts: 12,
    costPerMile: 0.68,
    averageSpeed: 52.3
  });

  const [kpis] = useState<PerformanceIndicator[]>([
    {
      label: 'Fleet Utilization',
      value: 87.5,
      unit: '%',
      trend: 'up',
      change: 3.2,
      status: 'good'
    },
    {
      label: 'Fuel Efficiency',
      value: 8.4,
      unit: 'km/L',
      trend: 'up',
      change: 0.6,
      status: 'good'
    },
    {
      label: 'Maintenance Cost',
      value: 2850,
      unit: '$',
      trend: 'down',
      change: -12.5,
      status: 'good'
    },
    {
      label: 'Driver Score',
      value: 78.2,
      unit: '/100',
      trend: 'up',
      change: 2.1,
      status: 'warning'
    }
  ]);

  useEffect(() => {
    // Simulate loading analytics data
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, [timeRange]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fleet Analytics</h1>
          <p className="text-gray-600">Intelligent insights for optimal fleet performance</p>
        </div>
        <div className="flex items-center gap-2">
          {['24h', '7d', '30d', '90d'].map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(range)}
            >
              {range}
            </Button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">{kpi.label}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{kpi.value}</span>
                    <span className="text-sm text-gray-500">{kpi.unit}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {getTrendIcon(kpi.trend)}
                    <span className={`text-xs font-medium ${
                      kpi.trend === 'up' ? 'text-green-600' : 
                      kpi.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {Math.abs(kpi.change)}%
                    </span>
                  </div>
                </div>
                <Badge className={getStatusColor(kpi.status)}>
                  {kpi.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Maintenance
          </TabsTrigger>
          <TabsTrigger value="routes" className="flex items-center gap-2">
            <Route className="h-4 w-4" />
            Routes
          </TabsTrigger>
          <TabsTrigger value="drivers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Drivers
          </TabsTrigger>
          <TabsTrigger value="fuel" className="flex items-center gap-2">
            <Fuel className="h-4 w-4" />
            Fuel
          </TabsTrigger>
          <TabsTrigger value="costs" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Costs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Fleet Composition
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Light Vehicles</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="w-3/4 h-full bg-blue-500"></div>
                      </div>
                      <span className="text-sm font-medium">75%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Heavy Vehicles</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="w-1/4 h-full bg-green-500"></div>
                      </div>
                      <span className="text-sm font-medium">25%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  Performance Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Efficiency Score</span>
                    <Badge className="bg-green-100 text-green-800">+5.2%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Safety Score</span>
                    <Badge className="bg-yellow-100 text-yellow-800">-1.8%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Cost Optimization</span>
                    <Badge className="bg-green-100 text-green-800">+8.1%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-6">
          <PredictiveMaintenanceWidget />
        </TabsContent>

        <TabsContent value="routes" className="space-y-6">
          <RouteOptimizationPanel />
        </TabsContent>

        <TabsContent value="drivers" className="space-y-6">
          <DriverBehaviorAnalytics />
        </TabsContent>

        <TabsContent value="fuel" className="space-y-6">
          <FuelManagementIntelligence />
        </TabsContent>

        <TabsContent value="costs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cost Analysis</CardTitle>
              <CardDescription>Comprehensive cost breakdown and optimization opportunities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center py-8 text-gray-500">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Cost analysis dashboard coming soon...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FleetAnalyticsDashboard;
