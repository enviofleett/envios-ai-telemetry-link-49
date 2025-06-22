
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Trophy, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Shield,
  Zap,
  Clock,
  Gauge
} from 'lucide-react';

interface DriverScore {
  driverId: string;
  driverName: string;
  overallScore: number;
  safetyScore: number;
  efficiencyScore: number;
  complianceScore: number;
  totalMiles: number;
  totalTrips: number;
  incidents: number;
  fuelEfficiency: number;
  trend: 'up' | 'down' | 'stable';
  rank: number;
}

interface BehaviorMetrics {
  totalDrivers: number;
  averageScore: number;
  topPerformers: number;
  needsImprovement: number;
  totalIncidents: number;
  improvementRate: number;
}

const DriverBehaviorAnalytics: React.FC = () => {
  const [selectedMetric, setSelectedMetric] = useState('overall');
  const [timeRange, setTimeRange] = useState('30d');

  // Mock data - in real implementation, this would come from telematics service
  const [metrics] = useState<BehaviorMetrics>({
    totalDrivers: 89,
    averageScore: 78.5,
    topPerformers: 23,
    needsImprovement: 12,
    totalIncidents: 7,
    improvementRate: 15.2
  });

  const [drivers] = useState<DriverScore[]>([
    {
      driverId: 'DRV-001',
      driverName: 'Sarah Johnson',
      overallScore: 94,
      safetyScore: 96,
      efficiencyScore: 92,
      complianceScore: 95,
      totalMiles: 2845,
      totalTrips: 156,
      incidents: 0,
      fuelEfficiency: 8.7,
      trend: 'up',
      rank: 1
    },
    {
      driverId: 'DRV-002',
      driverName: 'Michael Chen',
      overallScore: 89,
      safetyScore: 91,
      efficiencyScore: 87,
      complianceScore: 90,
      totalMiles: 3120,
      totalTrips: 178,
      incidents: 1,
      fuelEfficiency: 8.2,
      trend: 'stable',
      rank: 2
    },
    {
      driverId: 'DRV-003',
      driverName: 'Emily Rodriguez',
      overallScore: 85,
      safetyScore: 88,
      efficiencyScore: 82,
      complianceScore: 86,
      totalMiles: 2654,
      totalTrips: 142,
      incidents: 1,
      fuelEfficiency: 7.9,
      trend: 'up',
      rank: 3
    },
    {
      driverId: 'DRV-004',
      driverName: 'David Williams',
      overallScore: 72,
      safetyScore: 75,
      efficiencyScore: 68,
      complianceScore: 74,
      totalMiles: 3456,
      totalTrips: 201,
      incidents: 3,
      fuelEfficiency: 7.1,
      trend: 'down',
      rank: 4
    },
    {
      driverId: 'DRV-005',
      driverName: 'Jennifer Adams',
      overallScore: 68,
      safetyScore: 71,
      efficiencyScore: 65,
      complianceScore: 70,
      totalMiles: 2987,
      totalTrips: 167,
      incidents: 4,
      fuelEfficiency: 6.8,
      trend: 'down',
      rank: 5
    }
  ]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <div className="h-4 w-4 bg-gray-400 rounded-full"></div>;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-yellow-600';
    if (score >= 70) return 'text-orange-600';
    return 'text-red-600';
  };

  const getPerformanceBadge = (score: number) => {
    if (score >= 90) return { label: 'Excellent', color: 'bg-green-100 text-green-800' };
    if (score >= 80) return { label: 'Good', color: 'bg-blue-100 text-blue-800' };
    if (score >= 70) return { label: 'Average', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'Needs Improvement', color: 'bg-red-100 text-red-800' };
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-4 w-4 text-yellow-500" />;
    if (rank <= 3) return <Trophy className="h-4 w-4 text-gray-400" />;
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Driver Analytics Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Driver Behavior Analytics
          </h2>
          <p className="text-gray-600">Comprehensive driver performance and safety analysis</p>
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

      {/* Driver Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Score</p>
                <p className="text-2xl font-bold text-blue-600">{metrics.averageScore}</p>
              </div>
              <Gauge className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Top Performers</p>
                <p className="text-2xl font-bold text-green-600">{metrics.topPerformers}</p>
              </div>
              <Trophy className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Safety Incidents</p>
                <p className="text-2xl font-bold text-red-600">{metrics.totalIncidents}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Improvement Rate</p>
                <p className="text-2xl font-bold text-purple-600">{metrics.improvementRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metric Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
          <div className="flex gap-2">
            {[
              { key: 'overall', label: 'Overall Score', icon: Gauge },
              { key: 'safety', label: 'Safety', icon: Shield },
              { key: 'efficiency', label: 'Efficiency', icon: Zap },
              { key: 'compliance', label: 'Compliance', icon: Clock }
            ].map(({ key, label, icon: Icon }) => (
              <Button
                key={key}
                variant={selectedMetric === key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedMetric(key)}
              >
                <Icon className="h-4 w-4 mr-1" />
                {label}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {drivers.map((driver) => {
              const badge = getPerformanceBadge(driver.overallScore);
              const scoreToShow = selectedMetric === 'overall' ? driver.overallScore :
                                selectedMetric === 'safety' ? driver.safetyScore :
                                selectedMetric === 'efficiency' ? driver.efficiencyScore :
                                driver.complianceScore;

              return (
                <div key={driver.driverId} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getRankIcon(driver.rank)}
                      <div>
                        <h4 className="font-medium text-gray-900">{driver.driverName}</h4>
                        <p className="text-sm text-gray-600">ID: {driver.driverId}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getTrendIcon(driver.trend)}
                      <Badge className={badge.color}>
                        {badge.label}
                      </Badge>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${getScoreColor(scoreToShow)}`}>
                          {scoreToShow}
                        </div>
                        <div className="text-sm text-gray-500">Rank #{driver.rank}</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Safety Score</span>
                        <span className="font-medium">{driver.safetyScore}/100</span>
                      </div>
                      <Progress value={driver.safetyScore} className="h-2" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Efficiency</span>
                        <span className="font-medium">{driver.efficiencyScore}/100</span>
                      </div>
                      <Progress value={driver.efficiencyScore} className="h-2" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Compliance</span>
                        <span className="font-medium">{driver.complianceScore}/100</span>
                      </div>
                      <Progress value={driver.complianceScore} className="h-2" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Fuel Efficiency</span>
                        <span className="font-medium">{driver.fuelEfficiency} km/L</span>
                      </div>
                      <Progress value={(driver.fuelEfficiency / 10) * 100} className="h-2" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Total Miles:</span> {driver.totalMiles.toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium">Total Trips:</span> {driver.totalTrips}
                    </div>
                    <div>
                      <span className="font-medium">Incidents:</span> 
                      <span className={driver.incidents === 0 ? 'text-green-600' : 'text-red-600'}>
                        {driver.incidents}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Avg/Trip:</span> {(driver.totalMiles / driver.totalTrips).toFixed(1)} mi
                    </div>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline">View Details</Button>
                    <Button size="sm" variant="outline">Training Plan</Button>
                    <Button size="sm" variant="outline">Send Feedback</Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Behavior Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Safety Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Hard Braking Events</span>
                <span className="font-medium text-yellow-600">23 this week</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Speeding Violations</span>
                <span className="font-medium text-red-600">7 this week</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Rapid Acceleration</span>
                <span className="font-medium text-orange-600">15 this week</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Safe Following Distance</span>
                <span className="font-medium text-green-600">94% compliance</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Training Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                <p className="text-sm font-medium">Defensive Driving</p>
                <p className="text-xs text-gray-600">5 drivers recommended</p>
              </div>
              <div className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                <p className="text-sm font-medium">Fuel Efficiency</p>
                <p className="text-xs text-gray-600">8 drivers recommended</p>
              </div>
              <div className="p-3 bg-green-50 border-l-4 border-green-400 rounded">
                <p className="text-sm font-medium">Customer Service</p>
                <p className="text-xs text-gray-600">3 drivers recommended</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DriverBehaviorAnalytics;
