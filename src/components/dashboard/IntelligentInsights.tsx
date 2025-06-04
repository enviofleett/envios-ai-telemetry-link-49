import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Wrench, User, AlertCircle, ChevronRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';
interface InsightData {
  fuelEfficiencyTrend: Array<{
    date: string;
    efficiency: number;
  }>;
  maintenanceAlerts: Array<{
    vehicleId: string;
    type: string;
    dueIn: string;
  }>;
  driverBehavior: {
    fleetScore: number;
    topIssues: Array<{
      issue: string;
      percentage: number;
    }>;
  };
  anomalies: Array<{
    vehicleId: string;
    description: string;
    severity: string;
  }>;
}
interface IntelligentInsightsProps {
  insights: InsightData;
  isLoading?: boolean;
}
const IntelligentInsights: React.FC<IntelligentInsightsProps> = ({
  insights,
  isLoading = false
}) => {
  if (isLoading) {
    return <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Fleet Intelligence Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>)}
        </div>
      </div>;
  }
  return;
};
export default IntelligentInsights;