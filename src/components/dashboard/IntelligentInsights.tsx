
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Wrench, User, AlertCircle, ChevronRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';

interface InsightData {
  fuelEfficiencyTrend: Array<{ date: string; efficiency: number }>;
  maintenanceAlerts: Array<{ vehicleId: string; type: string; dueIn: string }>;
  driverBehavior: {
    fleetScore: number;
    topIssues: Array<{ issue: string; percentage: number }>;
  };
  anomalies: Array<{ vehicleId: string; description: string; severity: string }>;
}

interface IntelligentInsightsProps {
  insights: InsightData;
  isLoading?: boolean;
}

const IntelligentInsights: React.FC<IntelligentInsightsProps> = ({ insights, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Fleet Intelligence Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-2 sm:mb-0">Fleet Intelligence Summary</h2>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          View All Insights
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Fuel Efficiency Trends */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              Fuel Efficiency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-20 mb-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={insights.fuelEfficiencyTrend}>
                  <Line type="monotone" dataKey="efficiency" stroke="#2563eb" strokeWidth={2} dot={false} />
                  <XAxis dataKey="date" hide />
                  <YAxis hide />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-gray-600">
              Trending {insights.fuelEfficiencyTrend.length > 1 && 
                insights.fuelEfficiencyTrend[insights.fuelEfficiencyTrend.length - 1].efficiency > 
                insights.fuelEfficiencyTrend[0].efficiency ? 'up' : 'down'} this week
            </p>
          </CardContent>
        </Card>

        {/* Predictive Maintenance */}
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Wrench className="h-4 w-4 text-orange-600" />
              Maintenance Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700 mb-1">
              {insights.maintenanceAlerts.length}
            </div>
            <p className="text-xs text-gray-600 mb-2">Upcoming services</p>
            {insights.maintenanceAlerts.slice(0, 2).map((alert, index) => (
              <div key={index} className="text-xs text-gray-700 mb-1">
                {alert.vehicleId}: {alert.type} in {alert.dueIn}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Driver Behavior */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4 text-green-600" />
              Driver Behavior
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700 mb-1">
              {insights.driverBehavior.fleetScore}/100
            </div>
            <p className="text-xs text-gray-600 mb-2">Fleet score</p>
            {insights.driverBehavior.topIssues.slice(0, 2).map((issue, index) => (
              <div key={index} className="text-xs text-gray-700 mb-1">
                {issue.issue}: {issue.percentage}%
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Anomaly Detection */}
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              Anomalies Detected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700 mb-1">
              {insights.anomalies.length}
            </div>
            <p className="text-xs text-gray-600 mb-2">Unusual activities</p>
            {insights.anomalies.slice(0, 2).map((anomaly, index) => (
              <div key={index} className="text-xs text-gray-700 mb-1">
                {anomaly.vehicleId}: {anomaly.description}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default IntelligentInsights;
