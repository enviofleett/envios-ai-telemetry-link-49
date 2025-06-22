
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Fuel, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  BarChart3,
  AlertTriangle,
  Lightbulb,
  Gauge,
  MapPin
} from 'lucide-react';

interface FuelMetrics {
  totalConsumption: number;
  averageEfficiency: number;
  totalCost: number;
  costPerMile: number;
  co2Emissions: number;
  savings: number;
  targetEfficiency: number;
  complianceRate: number;
}

interface VehicleFuelData {
  vehicleId: string;
  vehicleName: string;
  currentEfficiency: number;
  targetEfficiency: number;
  fuelConsumed: number;
  costThisMonth: number;
  trend: 'up' | 'down' | 'stable';
  performanceRating: 'excellent' | 'good' | 'average' | 'poor';
  recommendations: string[];
}

interface FuelRecommendation {
  id: string;
  type: 'route' | 'behavior' | 'maintenance' | 'vehicle';
  title: string;
  description: string;
  potentialSavings: number;
  priority: 'high' | 'medium' | 'low';
  implementationEffort: 'easy' | 'medium' | 'complex';
}

const FuelManagementIntelligence: React.FC = () => {
  const [selectedView, setSelectedView] = useState('overview');
  const [timeRange, setTimeRange] = useState('30d');

  // Mock data - in real implementation, this would come from fuel management service
  const [metrics] = useState<FuelMetrics>({
    totalConsumption: 4567,
    averageEfficiency: 8.2,
    totalCost: 6834,
    costPerMile: 0.18,
    co2Emissions: 10.8,
    savings: 1245,
    targetEfficiency: 9.1,
    complianceRate: 87.5
  });

  const [vehicleData] = useState<VehicleFuelData[]>([
    {
      vehicleId: 'FLT-001',
      vehicleName: 'Toyota Camry - FLT-001',
      currentEfficiency: 9.2,
      targetEfficiency: 9.5,
      fuelConsumed: 156,
      costThisMonth: 234,
      trend: 'up',
      performanceRating: 'excellent',
      recommendations: ['Maintain current driving patterns', 'Regular maintenance scheduled']
    },
    {
      vehicleId: 'FLT-023',
      vehicleName: 'Honda Accord - FLT-023',
      currentEfficiency: 8.7,
      targetEfficiency: 9.2,
      fuelConsumed: 189,
      costThisMonth: 283,
      trend: 'down',
      performanceRating: 'good',
      recommendations: ['Reduce idle time', 'Optimize route planning']
    },
    {
      vehicleId: 'FLT-045',
      vehicleName: 'Ford Transit - FLT-045',
      currentEfficiency: 7.1,
      targetEfficiency: 8.0,
      fuelConsumed: 298,
      costThisMonth: 447,
      trend: 'stable',
      performanceRating: 'average',
      recommendations: ['Driver training recommended', 'Check tire pressure']
    }
  ]);

  const [recommendations] = useState<FuelRecommendation[]>([
    {
      id: '1',
      type: 'route',
      title: 'Optimize delivery routes',
      description: 'AI-suggested route optimizations could reduce fuel consumption by 12%',
      potentialSavings: 820,
      priority: 'high',
      implementationEffort: 'easy'
    },
    {
      id: '2',
      type: 'behavior',
      title: 'Driver behavior training',
      description: 'Focus on smooth acceleration and braking techniques',
      potentialSavings: 485,
      priority: 'medium',
      implementationEffort: 'medium'
    },
    {
      id: '3',
      type: 'maintenance',
      title: 'Preventive maintenance scheduling',
      description: 'Regular maintenance can improve fuel efficiency by 8-15%',
      potentialSavings: 675,
      priority: 'high',
      implementationEffort: 'easy'
    }
  ]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <div className="h-4 w-4 bg-gray-400 rounded-full"></div>;
    }
  };

  const getPerformanceColor = (rating: string) => {
    switch (rating) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'average': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-red-100 text-red-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const getEfficiencyPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  return (
    <div className="space-y-6">
      {/* Fuel Management Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Fuel className="h-5 w-5 text-blue-600" />
            Fuel Management Intelligence
          </h2>
          <p className="text-gray-600">Advanced fuel consumption analysis and optimization</p>
        </div>
        <div className="flex gap-2">
          {['7d', '30d', '90d'].map((range) => (
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

      {/* Fuel Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Efficiency</p>
                <p className="text-2xl font-bold text-blue-600">{metrics.averageEfficiency} km/L</p>
              </div>
              <Gauge className="h-8 w-8 text-blue-500" />
            </div>
            <div className="mt-2">
              <Progress 
                value={getEfficiencyPercentage(metrics.averageEfficiency, metrics.targetEfficiency)} 
                className="h-2" 
              />
              <p className="text-xs text-gray-500 mt-1">
                Target: {metrics.targetEfficiency} km/L
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Cost</p>
                <p className="text-2xl font-bold text-red-600">${metrics.totalCost.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-red-500" />
            </div>
            <div className="mt-2">
              <p className="text-xs text-green-600">
                -${metrics.savings} saved this month
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">CO₂ Emissions</p>
                <p className="text-2xl font-bold text-green-600">{metrics.co2Emissions}t</p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-500" />
            </div>
            <div className="mt-2">
              <p className="text-xs text-green-600">
                -15% vs last month
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Cost per Mile</p>
                <p className="text-2xl font-bold text-purple-600">${metrics.costPerMile}</p>
              </div>
              <MapPin className="h-8 w-8 text-purple-500" />
            </div>
            <div className="mt-2">
              <p className="text-xs text-purple-600">
                {metrics.complianceRate}% efficiency target
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Selector */}
      <div className="flex gap-2 border-b">
        {[
          { key: 'overview', label: 'Overview', icon: BarChart3 },
          { key: 'vehicles', label: 'Vehicle Performance', icon: Fuel },
          { key: 'recommendations', label: 'Recommendations', icon: Lightbulb }
        ].map(({ key, label, icon: Icon }) => (
          <Button
            key={key}
            variant={selectedView === key ? 'default' : 'ghost'}
            onClick={() => setSelectedView(key)}
            className="flex items-center gap-2"
          >
            <Icon className="h-4 w-4" />
            {label}
          </Button>
        ))}
      </div>

      {/* Content based on selected view */}
      {selectedView === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Fuel Consumption Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">This Week</span>
                  <span className="font-medium">1,234 L</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Last Week</span>
                  <span className="font-medium">1,456 L</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Change</span>
                  <span className="font-medium text-green-600">-222 L (-15.3%)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Efficiency by Vehicle Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { type: 'Light Commercial', efficiency: 9.2, vehicles: 45 },
                  { type: 'Heavy Trucks', efficiency: 6.8, vehicles: 12 },
                  { type: 'Vans', efficiency: 8.1, vehicles: 28 }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm">{item.type}</span>
                    <div className="flex items-center gap-2">
                      <Progress value={(item.efficiency / 10) * 100} className="w-20 h-2" />
                      <span className="text-sm font-medium w-12">{item.efficiency} km/L</span>
                      <span className="text-xs text-gray-500">({item.vehicles})</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedView === 'vehicles' && (
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Fuel Performance</CardTitle>
            <CardDescription>Individual vehicle fuel efficiency and optimization opportunities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {vehicleData.map((vehicle) => (
                <div key={vehicle.vehicleId} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Fuel className="h-5 w-5 text-blue-500" />
                      <div>
                        <h4 className="font-medium text-gray-900">{vehicle.vehicleName}</h4>
                        <p className="text-sm text-gray-600">
                          Current: {vehicle.currentEfficiency} km/L | Target: {vehicle.targetEfficiency} km/L
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getTrendIcon(vehicle.trend)}
                      <Badge className={getPerformanceColor(vehicle.performanceRating)}>
                        {vehicle.performanceRating}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Efficiency Progress</span>
                        <span className="font-medium">
                          {getEfficiencyPercentage(vehicle.currentEfficiency, vehicle.targetEfficiency).toFixed(1)}%
                        </span>
                      </div>
                      <Progress 
                        value={getEfficiencyPercentage(vehicle.currentEfficiency, vehicle.targetEfficiency)} 
                        className="h-2" 
                      />
                    </div>

                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">{vehicle.fuelConsumed}L</div>
                      <div className="text-sm text-gray-500">Consumed</div>
                    </div>

                    <div className="text-center">
                      <div className="text-lg font-bold text-red-600">${vehicle.costThisMonth}</div>
                      <div className="text-sm text-gray-500">This Month</div>
                    </div>

                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">
                        {((vehicle.targetEfficiency - vehicle.currentEfficiency) * -1).toFixed(1)}
                      </div>
                      <div className="text-sm text-gray-500">vs Target</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-gray-900">Recommendations:</h5>
                    <ul className="space-y-1">
                      {vehicle.recommendations.map((rec, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="text-blue-500 mt-1">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedView === 'recommendations' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              AI-Powered Fuel Optimization Recommendations
            </CardTitle>
            <CardDescription>
              Intelligent suggestions to improve fuel efficiency and reduce costs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recommendations.map((rec) => (
                <div key={rec.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h4 className="font-medium text-gray-900">{rec.title}</h4>
                      <p className="text-sm text-gray-600">{rec.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getPriorityColor(rec.priority)}>
                        {rec.priority} priority
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-500" />
                      <div>
                        <div className="text-sm font-medium">Potential Savings</div>
                        <div className="text-lg font-bold text-green-600">${rec.potentialSavings}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-blue-500" />
                      <div>
                        <div className="text-sm font-medium">Implementation</div>
                        <div className="text-sm text-gray-600 capitalize">{rec.implementationEffort}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-purple-500" />
                      <div>
                        <div className="text-sm font-medium">Category</div>
                        <div className="text-sm text-gray-600 capitalize">{rec.type}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm">
                      Implement
                    </Button>
                    <Button size="sm" variant="outline">
                      Learn More
                    </Button>
                    <Button size="sm" variant="outline">
                      Schedule Review
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FuelManagementIntelligence;
