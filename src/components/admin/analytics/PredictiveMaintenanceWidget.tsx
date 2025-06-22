
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, 
  Wrench, 
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface MaintenanceAlert {
  id: string;
  vehicleId: string;
  vehicleName: string;
  alertType: 'critical' | 'warning' | 'info';
  component: string;
  prediction: string;
  daysUntilMaintenance: number;
  mileageUntilMaintenance: number;
  confidence: number;
  recommendedAction: string;
  estimatedCost: number;
}

interface MaintenanceMetrics {
  totalVehicles: number;
  vehiclesNeedingMaintenance: number;
  predictiveAccuracy: number;
  costSavings: number;
  avgMaintenanceInterval: number;
}

const PredictiveMaintenanceWidget: React.FC = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');

  // Mock data - in real implementation, this would come from ML service
  const [metrics] = useState<MaintenanceMetrics>({
    totalVehicles: 156,
    vehiclesNeedingMaintenance: 12,
    predictiveAccuracy: 87.3,
    costSavings: 34250,
    avgMaintenanceInterval: 185
  });

  const [alerts] = useState<MaintenanceAlert[]>([
    {
      id: '1',
      vehicleId: 'FLT-001',
      vehicleName: 'Toyota Camry - FLT-001',
      alertType: 'critical',
      component: 'Brake System',
      prediction: 'Brake pad replacement needed',
      daysUntilMaintenance: 3,
      mileageUntilMaintenance: 850,
      confidence: 94,
      recommendedAction: 'Schedule brake inspection immediately',
      estimatedCost: 450
    },
    {
      id: '2',
      vehicleId: 'FLT-023',
      vehicleName: 'Honda Accord - FLT-023',
      alertType: 'warning',
      component: 'Engine Oil',
      prediction: 'Oil change due soon',
      daysUntilMaintenance: 7,
      mileageUntilMaintenance: 1200,
      confidence: 89,
      recommendedAction: 'Schedule oil change within next week',
      estimatedCost: 85
    },
    {
      id: '3',
      vehicleId: 'FLT-045',
      vehicleName: 'Ford Transit - FLT-045',
      alertType: 'warning',
      component: 'Tire Condition',
      prediction: 'Tire replacement recommended',
      daysUntilMaintenance: 14,
      mileageUntilMaintenance: 2500,
      confidence: 76,
      recommendedAction: 'Monitor tire wear, plan replacement',
      estimatedCost: 680
    },
    {
      id: '4',
      vehicleId: 'FLT-067',
      vehicleName: 'Nissan Sentra - FLT-067',
      alertType: 'info',
      component: 'Air Filter',
      prediction: 'Air filter replacement due',
      daysUntilMaintenance: 21,
      mileageUntilMaintenance: 3200,
      confidence: 82,
      recommendedAction: 'Replace air filter during next service',
      estimatedCost: 35
    }
  ]);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default: return <CheckCircle className="h-4 w-4 text-blue-500" />;
    }
  };

  const getAlertBadgeColor = (type: string) => {
    switch (type) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getPriorityAlerts = () => {
    return alerts.filter(alert => alert.daysUntilMaintenance <= 7).length;
  };

  return (
    <div className="space-y-6">
      {/* Predictive Maintenance Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Wrench className="h-5 w-5 text-blue-600" />
            Predictive Maintenance Intelligence
          </h2>
          <p className="text-gray-600">AI-powered maintenance predictions and optimization</p>
        </div>
        <div className="flex gap-2">
          {['7d', '30d', '90d'].map((timeframe) => (
            <Button
              key={timeframe}
              variant={selectedTimeframe === timeframe ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTimeframe(timeframe)}
            >
              {timeframe}
            </Button>
          ))}
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Alerts</p>
                <p className="text-2xl font-bold text-red-600">{getPriorityAlerts()}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Prediction Accuracy</p>
                <p className="text-2xl font-bold text-green-600">{metrics.predictiveAccuracy}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Cost Savings</p>
                <p className="text-2xl font-bold text-blue-600">${metrics.costSavings.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Interval</p>
                <p className="text-2xl font-bold text-purple-600">{metrics.avgMaintenanceInterval}d</p>
              </div>
              <Clock className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Maintenance Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Maintenance Predictions
          </CardTitle>
          <CardDescription>
            AI-powered predictions based on vehicle usage patterns, sensor data, and historical maintenance records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div key={alert.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getAlertIcon(alert.alertType)}
                    <div className="space-y-1">
                      <h4 className="font-medium text-gray-900">{alert.vehicleName}</h4>
                      <p className="text-sm text-gray-600">{alert.component} - {alert.prediction}</p>
                      <p className="text-sm text-gray-500">{alert.recommendedAction}</p>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <Badge className={getAlertBadgeColor(alert.alertType)}>
                      {alert.alertType}
                    </Badge>
                    <p className="text-sm font-medium">${alert.estimatedCost}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Days until maintenance</span>
                      <span className="font-medium">{alert.daysUntilMaintenance} days</span>
                    </div>
                    <Progress value={(30 - alert.daysUntilMaintenance) / 30 * 100} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Miles until maintenance</span>
                      <span className="font-medium">{alert.mileageUntilMaintenance.toLocaleString()} mi</span>
                    </div>
                    <Progress value={(5000 - alert.mileageUntilMaintenance) / 5000 * 100} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Prediction confidence</span>
                      <span className="font-medium">{alert.confidence}%</span>
                    </div>
                    <Progress value={alert.confidence} className="h-2" />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Button size="sm" variant="outline">
                    <Calendar className="h-4 w-4 mr-1" />
                    Schedule Maintenance
                  </Button>
                  <Button size="sm" variant="outline">
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Maintenance Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Maintenance Cost Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">This Month</span>
                <span className="font-medium">$8,450</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Last Month</span>
                <span className="font-medium">$12,200</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Savings</span>
                <span className="font-medium text-green-600">-$3,750 (30.7%)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Component Health Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { component: 'Engine Systems', health: 85, status: 'good' },
                { component: 'Brake Systems', health: 72, status: 'warning' },
                { component: 'Transmission', health: 91, status: 'good' },
                { component: 'Suspension', health: 78, status: 'good' }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm">{item.component}</span>
                  <div className="flex items-center gap-2">
                    <Progress value={item.health} className="w-20 h-2" />
                    <span className="text-sm font-medium w-8">{item.health}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PredictiveMaintenanceWidget;
