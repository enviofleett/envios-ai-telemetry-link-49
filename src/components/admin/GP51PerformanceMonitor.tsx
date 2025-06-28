import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Circle, ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useProductionGP51Service } from '@/hooks/useProductionGP51Service';
import { useToast } from '@/hooks/use-toast';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, subDays } from 'date-fns';
import {
  GP51PerformanceMetrics,
  createDefaultPerformanceMetrics,
  formatTimeString
} from '@/types/gp51-unified';

interface PerformanceChartProps {
  metrics: GP51PerformanceMetrics;
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({ metrics }) => {
  const data = [
    { name: '1 day ago', value: metrics.averageResponseTime },
    { name: 'Today', value: metrics.averageResponseTime },
  ];

  return (
    <ResponsiveContainer width="100%" height={150}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Area type="monotone" dataKey="value" stroke="#8884d8" fill="#8884d8" />
      </AreaChart>
    </ResponsiveContainer>
  );
};

const GP51PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<GP51PerformanceMetrics>(createDefaultPerformanceMetrics());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { getPerformanceMetrics } = useProductionGP51Service();

  useEffect(() => {
    const fetchMetrics = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedMetrics = await getPerformanceMetrics();
        setMetrics(fetchedMetrics);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch performance metrics');
        toast({
          title: "Error",
          description: "Failed to fetch performance metrics",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();

    const intervalId = setInterval(fetchMetrics, 60000);

    return () => clearInterval(intervalId);
  }, [getPerformanceMetrics, toast]);

  const getStatusBadge = (value: number): JSX.Element => {
    if (value > 90) {
      return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-500"><CheckCircle className="h-4 w-4 mr-2" /> Excellent</Badge>;
    } else if (value > 70) {
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-500"><AlertTriangle className="h-4 w-4 mr-2" /> Good</Badge>;
    } else {
      return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-500"><XCircle className="h-4 w-4 mr-2" /> Poor</Badge>;
    }
  };

  const getTrendIndicator = (current: number, previous: number): JSX.Element | null => {
    if (current > previous) {
      return <ArrowUpRight className="text-green-500 h-4 w-4 ml-1" />;
    } else if (current < previous) {
      return <ArrowDownRight className="text-red-500 h-4 w-4 ml-1" />;
    } else {
      return null;
    }
  };

  const getUptimeStatus = (uptime: number): string => {
    if (uptime >= 99.99) {
      return "Exceptional";
    } else if (uptime >= 99.9) {
      return "High";
    } else if (uptime >= 99) {
      return "Good";
    } else {
      return "Unreliable";
    }
  };

  const getUptimeColor = (uptime: number): string => {
    if (uptime >= 99.99) {
      return "text-green-500";
    } else if (uptime >= 99.9) {
      return "text-blue-500";
    } else if (uptime >= 99) {
      return "text-yellow-500";
    } else {
      return "text-red-500";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>GP51 Performance Monitoring</CardTitle>
          <CardDescription>Loading performance metrics...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <Circle className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>GP51 Performance Monitoring</CardTitle>
          <CardDescription>Failed to load performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-red-500">{error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>GP51 Performance Monitoring</CardTitle>
        <CardDescription>Real-time performance metrics for GP51 integration</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="bg-blue-50">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.averageResponseTime.toFixed(0)}ms {getTrendIndicator(metrics.averageResponseTime, metrics.averageResponseTime)}</div>
              <p className="text-xs text-muted-foreground">
                Average API response time
              </p>
              <PerformanceChart metrics={metrics} />
            </CardContent>
          </Card>

          <Card className="bg-green-50">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.successRate}% {getTrendIndicator(metrics.successRate, metrics.successRate)}</div>
              <p className="text-xs text-muted-foreground">
                API request success rate
              </p>
              {getStatusBadge(metrics.successRate)}
            </CardContent>
          </Card>

          <Card className="bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Requests/Minute</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.requestsPerMinute}</div>
              <p className="text-xs text-muted-foreground">
                Number of API requests per minute
              </p>
            </CardContent>
          </Card>

          <Card className="bg-purple-50">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Data Quality</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.dataQuality}%</div>
              <p className="text-xs text-muted-foreground">
                Accuracy and completeness of data
              </p>
            </CardContent>
          </Card>

          <Card className="bg-orange-50">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getUptimeColor(metrics.uptime)}`}>{metrics.uptime}%</div>
              <p className="text-xs text-muted-foreground">
                System uptime status: {getUptimeStatus(metrics.uptime)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-teal-50">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Active Devices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.activeDevices}</div>
              <p className="text-xs text-muted-foreground">
                Number of devices currently active
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="border rounded-md p-4 bg-gray-50">
          <h4 className="text-sm font-medium">Recent Activity</h4>
          <div className="text-xs text-muted-foreground">
            Last updated: {formatTimeString(metrics.lastUpdate)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GP51PerformanceMonitor;
