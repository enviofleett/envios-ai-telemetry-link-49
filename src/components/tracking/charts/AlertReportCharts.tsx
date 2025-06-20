
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

interface AlertReportChartsProps {
  data: {
    totalAlerts: number;
    resolvedAlerts: number;
    pendingAlerts: number;
    alertsByType: { type: string; count: number; severity: string }[];
    alertsByVehicle: { vehicle: string; count: number }[];
    alertsTrend: { date: string; count: number }[];
  };
}

const AlertReportCharts: React.FC<AlertReportChartsProps> = ({ data }) => {
  // Severity distribution
  const severityDistribution = [
    { name: 'High', value: data.alertsByType.filter(a => a.severity === 'high').reduce((sum, a) => sum + a.count, 0), color: '#ef4444' },
    { name: 'Medium', value: data.alertsByType.filter(a => a.severity === 'medium').reduce((sum, a) => sum + a.count, 0), color: '#f59e0b' },
    { name: 'Low', value: data.alertsByType.filter(a => a.severity === 'low').reduce((sum, a) => sum + a.count, 0), color: '#10b981' }
  ];

  // Status distribution
  const statusDistribution = [
    { name: 'Resolved', value: data.resolvedAlerts, color: '#10b981' },
    { name: 'Pending', value: data.pendingAlerts, color: '#f59e0b' }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Alerts by Type */}
      <Card>
        <CardHeader>
          <CardTitle>Alerts by Type</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.alertsByType}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Alerts by Vehicle */}
      <Card>
        <CardHeader>
          <CardTitle>Top Vehicles by Alert Count</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.alertsByVehicle.slice(0, 8)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="vehicle" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Alerts Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Alerts Trend Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.alertsTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#ef4444" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Severity Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Alert Severity Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={severityDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {severityDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default AlertReportCharts;
