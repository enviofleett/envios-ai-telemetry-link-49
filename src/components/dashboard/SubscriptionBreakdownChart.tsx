
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { RefreshCw, Eye } from 'lucide-react';
import { unifiedVehicleDataService } from '@/services/unifiedVehicleData';

const SubscriptionBreakdownChart: React.FC = () => {
  const [metrics, setMetrics] = React.useState(unifiedVehicleDataService.getVehicleMetrics());
  const [isLoading, setIsLoading] = React.useState(!unifiedVehicleDataService.isReady());

  React.useEffect(() => {
    const unsubscribe = unifiedVehicleDataService.subscribe(() => {
      setMetrics(unifiedVehicleDataService.getVehicleMetrics());
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const data = [
    { 
      name: 'Online Vehicles', 
      value: metrics.online, 
      percentage: metrics.total > 0 ? Math.round((metrics.online / metrics.total) * 100) : 0, 
      color: '#0f172a' 
    },
    { 
      name: 'Offline Vehicles', 
      value: metrics.offline, 
      percentage: metrics.total > 0 ? Math.round((metrics.offline / metrics.total) * 100) : 0, 
      color: '#475569' 
    },
    { 
      name: 'Alert Vehicles', 
      value: metrics.alerts, 
      percentage: metrics.total > 0 ? Math.round((metrics.alerts / metrics.total) * 100) : 0, 
      color: '#0d9488' 
    }
  ];

  const totalVehicles = metrics.total;
  const revenueImpact = totalVehicles * 25; // Estimate $25 per vehicle per month

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">
            {`Vehicles: ${data.value.toLocaleString()} (${data.percentage}%)`}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex items-center justify-center gap-6 mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-gray-700">
              {entry.value}: {data[index].value.toLocaleString()} ({data[index].percentage}%)
            </span>
          </div>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle>Vehicle Status Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 animate-pulse bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border border-gray-200 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Vehicle Status Breakdown
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="text-xs">
              <RefreshCw className="h-3 w-3 mr-1" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" className="text-xs">
              <Eye className="h-3 w-3 mr-1" />
              View
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Donut Chart */}
        <div className="h-80 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={2}
                dataKey="value"
                animationBegin={0}
                animationDuration={1200}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
              
              {/* Center Text */}
              <text 
                x="50%" 
                y="50%" 
                textAnchor="middle" 
                dominantBaseline="middle" 
                className="fill-gray-900 text-lg font-bold"
              >
                {totalVehicles.toLocaleString()}
              </text>
              <text 
                x="50%" 
                y="50%" 
                dy={20}
                textAnchor="middle" 
                dominantBaseline="middle" 
                className="fill-gray-600 text-sm"
              >
                Total Vehicles
              </text>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Statistics */}
        <div className="pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <div className="font-medium text-gray-900">Total Active</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {totalVehicles.toLocaleString()}
              </div>
              <div className="text-gray-600">vehicles</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-gray-900">Revenue Impact</div>
              <div className="text-2xl font-bold text-green-600 mt-1">
                ${revenueImpact.toLocaleString()}
              </div>
              <div className="text-gray-600">/month</div>
            </div>
          </div>
          
          {/* Breakdown Details */}
          <div className="mt-4 space-y-2">
            {data.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-gray-700">{item.name}</span>
                </div>
                <div className="text-gray-900 font-medium">
                  {item.value.toLocaleString()} ({item.percentage}%)
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionBreakdownChart;
