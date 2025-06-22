
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Route, 
  Navigation, 
  Clock,
  Fuel,
  TrendingUp,
  MapPin,
  Zap,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface RouteOptimization {
  id: string;
  routeName: string;
  vehicleId: string;
  originalDistance: number;
  optimizedDistance: number;
  timeSaving: number;
  fuelSaving: number;
  status: 'implemented' | 'pending' | 'analyzing';
  confidence: number;
  recommendations: string[];
}

interface RouteMetrics {
  totalRoutes: number;
  optimizedRoutes: number;
  avgTimeSaving: number;
  avgFuelSaving: number;
  totalDistanceSaved: number;
  costSavings: number;
}

const RouteOptimizationPanel: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  // Mock data - in real implementation, this would come from route optimization service
  const [metrics] = useState<RouteMetrics>({
    totalRoutes: 284,
    optimizedRoutes: 221,
    avgTimeSaving: 12.5,
    avgFuelSaving: 8.3,
    totalDistanceSaved: 1250,
    costSavings: 4320
  });

  const [optimizations] = useState<RouteOptimization[]>([
    {
      id: '1',
      routeName: 'Downtown Delivery Circuit',
      vehicleId: 'FLT-001',
      originalDistance: 45.2,
      optimizedDistance: 38.7,
      timeSaving: 18,
      fuelSaving: 14.4,
      status: 'implemented',
      confidence: 94,
      recommendations: [
        'Avoid peak traffic hours (8-10 AM)',
        'Use highway bypass for better efficiency',
        'Consolidate stops in same area'
      ]
    },
    {
      id: '2',
      routeName: 'Suburban Service Route',
      vehicleId: 'FLT-023',
      originalDistance: 67.8,
      optimizedDistance: 58.3,
      timeSaving: 25,
      fuelSaving: 20.1,
      status: 'pending',
      confidence: 87,
      recommendations: [
        'Reorder stops by proximity',
        'Use alternative route through industrial area',
        'Schedule during off-peak hours'
      ]
    },
    {
      id: '3',
      routeName: 'Express Delivery Route',
      vehicleId: 'FLT-045',
      originalDistance: 32.1,
      optimizedDistance: 29.8,
      timeSaving: 8,
      fuelSaving: 7.2,
      status: 'analyzing',
      confidence: 76,
      recommendations: [
        'Minor route adjustments possible',
        'Consider traffic pattern changes',
        'Optimize delivery windows'
      ]
    }
  ]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'implemented': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'implemented': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const calculateEfficiencyGain = (original: number, optimized: number) => {
    return ((original - optimized) / original * 100).toFixed(1);
  };

  return (
    <div className="space-y-6">
      {/* Route Optimization Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Route className="h-5 w-5 text-blue-600" />
            Route Optimization Engine
          </h2>
          <p className="text-gray-600">AI-powered route planning for maximum efficiency</p>
        </div>
        <div className="flex gap-2">
          {['day', 'week', 'month'].map((period) => (
            <Button
              key={period}
              variant={selectedPeriod === period ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod(period)}
            >
              {period}
            </Button>
          ))}
        </div>
      </div>

      {/* Optimization Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Optimization Rate</p>
                <p className="text-2xl font-bold text-blue-600">
                  {((metrics.optimizedRoutes / metrics.totalRoutes) * 100).toFixed(1)}%
                </p>
              </div>
              <Navigation className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Time Saved</p>
                <p className="text-2xl font-bold text-green-600">{metrics.avgTimeSaving}%</p>
              </div>
              <Clock className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Fuel Saved</p>
                <p className="text-2xl font-bold text-orange-600">{metrics.avgFuelSaving}%</p>
              </div>
              <Fuel className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Cost Savings</p>
                <p className="text-2xl font-bold text-purple-600">${metrics.costSavings}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Route Optimizations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Active Route Optimizations
          </CardTitle>
          <CardDescription>
            AI-generated route improvements and efficiency recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {optimizations.map((optimization) => (
              <div key={optimization.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getStatusIcon(optimization.status)}
                    <div className="space-y-1">
                      <h4 className="font-medium text-gray-900">{optimization.routeName}</h4>
                      <p className="text-sm text-gray-600">Vehicle: {optimization.vehicleId}</p>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <Badge className={getStatusBadge(optimization.status)}>
                      {optimization.status}
                    </Badge>
                    <p className="text-sm text-gray-500">
                      Confidence: {optimization.confidence}%
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">Distance</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Original:</span>
                        <span>{optimization.originalDistance} km</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Optimized:</span>
                        <span className="text-green-600">{optimization.optimizedDistance} km</span>
                      </div>
                      <div className="flex justify-between text-sm font-medium">
                        <span>Saved:</span>
                        <span className="text-green-600">
                          {calculateEfficiencyGain(optimization.originalDistance, optimization.optimizedDistance)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">Time Saving</span>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{optimization.timeSaving}</div>
                      <div className="text-sm text-gray-500">minutes</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Fuel className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">Fuel Saving</span>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{optimization.fuelSaving}%</div>
                      <div className="text-sm text-gray-500">efficiency</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">Confidence</span>
                    </div>
                    <div className="space-y-2">
                      <Progress value={optimization.confidence} className="h-2" />
                      <div className="text-center text-sm text-gray-600">
                        {optimization.confidence}%
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-gray-900">Recommendations:</h5>
                  <ul className="space-y-1">
                    {optimization.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  {optimization.status === 'pending' && (
                    <Button size="sm">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Implement Route
                    </Button>
                  )}
                  <Button size="sm" variant="outline">
                    View Route Map
                  </Button>
                  <Button size="sm" variant="outline">
                    Export Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Optimization Impact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Distance Reduced</span>
                <span className="font-medium">{metrics.totalDistanceSaved} km</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Time Saved</span>
                <span className="font-medium">45.2 hours</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Fuel Saved</span>
                <span className="font-medium">156 liters</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">CO₂ Reduced</span>
                <span className="font-medium text-green-600">368 kg</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { day: 'Monday', efficiency: 94, routes: 12 },
                { day: 'Tuesday', efficiency: 87, routes: 15 },
                { day: 'Wednesday', efficiency: 91, routes: 14 },
                { day: 'Thursday', efficiency: 89, routes: 13 },
                { day: 'Friday', efficiency: 96, routes: 16 }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm w-20">{item.day}</span>
                  <div className="flex items-center gap-2 flex-1">
                    <Progress value={item.efficiency} className="flex-1 h-2" />
                    <span className="text-sm font-medium w-8">{item.efficiency}%</span>
                  </div>
                  <span className="text-sm text-gray-500 w-16 text-right">
                    {item.routes} routes
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RouteOptimizationPanel;
