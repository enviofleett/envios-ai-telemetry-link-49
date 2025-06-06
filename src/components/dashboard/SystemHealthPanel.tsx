
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Wifi, 
  Database, 
  MessageSquare, 
  Mail,
  RefreshCw,
  Activity,
  AlertCircle,
  CheckCircle,
  Play,
  FileText,
  Settings,
  BarChart3
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

const SystemHealthPanel: React.FC = () => {
  const serviceStatus = [
    {
      name: 'GPS51',
      status: 'online' as const,
      uptime: '99.9%',
      metric: '2ms latency',
      icon: Wifi,
      color: 'green'
    },
    {
      name: 'Database',
      status: 'online' as const,
      uptime: '99.8%',
      metric: '1ms response',
      icon: Database,
      color: 'green'
    },
    {
      name: 'SMS Gateway',
      status: 'degraded' as const,
      uptime: '85%',
      metric: 'delivery rate',
      icon: MessageSquare,
      color: 'yellow'
    },
    {
      name: 'Email Service',
      status: 'offline' as const,
      uptime: '0%',
      metric: 'needs attention',
      icon: Mail,
      color: 'red'
    }
  ];

  // Mock 24-hour performance data
  const performanceData = [
    { time: '00:00', uptime: 100, responseTime: 120 },
    { time: '04:00', uptime: 99.5, responseTime: 150 },
    { time: '08:00', uptime: 98, responseTime: 180 },
    { time: '12:00', uptime: 99.8, responseTime: 130 },
    { time: '16:00', uptime: 99.9, responseTime: 110 },
    { time: '20:00', uptime: 98.5, responseTime: 160 },
    { time: '24:00', uptime: 99.7, responseTime: 125 }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-600 bg-green-50';
      case 'degraded': return 'text-yellow-600 bg-yellow-50';
      case 'offline': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return CheckCircle;
      case 'degraded': return AlertCircle;
      case 'offline': return AlertCircle;
      default: return AlertCircle;
    }
  };

  return (
    <Card className="bg-white border border-gray-200 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">
            System Health
          </CardTitle>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <RefreshCw className="h-4 w-4" />
            <span>Last updated: 2m</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Service Status Grid */}
        <div className="grid grid-cols-2 gap-4">
          {serviceStatus.map((service) => {
            const StatusIcon = getStatusIcon(service.status);
            const IconComponent = service.icon;
            
            return (
              <div 
                key={service.name}
                className="p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <IconComponent className="h-4 w-4 text-gray-600" />
                    <span className="font-medium text-sm text-gray-900">{service.name}</span>
                  </div>
                  <StatusIcon 
                    className={`h-4 w-4 ${
                      service.status === 'online' ? 'text-green-600' :
                      service.status === 'degraded' ? 'text-yellow-600' : 'text-red-600'
                    }`}
                  />
                </div>
                
                <div className="space-y-1">
                  <Badge 
                    variant="secondary" 
                    className={`${getStatusColor(service.status)} text-xs`}
                  >
                    {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                  </Badge>
                  <div className="text-xs text-gray-500">
                    {service.uptime} uptime
                  </div>
                  <div className="text-xs text-gray-600 font-medium">
                    {service.metric}
                  </div>
                </div>
                
                {service.status === 'offline' && (
                  <Button size="sm" variant="outline" className="w-full mt-2 text-xs">
                    Fix Now
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {/* 24h Performance Timeline */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900">24h Performance Timeline</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="uptimeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="time" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                />
                <YAxis 
                  domain={[75, 100]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  formatter={(value: any) => [`${value}%`, 'Uptime']}
                  labelStyle={{ color: '#1f2937' }}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="uptime"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#uptimeGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="text-xs">
              <Play className="h-3 w-3 mr-1" />
              Restart Services
            </Button>
            <Button variant="outline" size="sm" className="text-xs">
              <Activity className="h-3 w-3 mr-1" />
              Run Diagnostics
            </Button>
            <Button variant="outline" size="sm" className="text-xs">
              <FileText className="h-3 w-3 mr-1" />
              View Logs
            </Button>
            <Button variant="outline" size="sm" className="text-xs">
              <BarChart3 className="h-3 w-3 mr-1" />
              System Report
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemHealthPanel;
