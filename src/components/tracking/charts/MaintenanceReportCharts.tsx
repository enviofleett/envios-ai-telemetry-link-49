
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

interface MaintenanceReportChartsProps {
  data: {
    totalMaintenanceEvents: number;
    upcomingMaintenance: number;
    overdueMaintenenance: number;
    totalMaintenanceCost: number;
    maintenanceByType: any[];
    events: any[];
  };
}

const MaintenanceReportCharts: React.FC<MaintenanceReportChartsProps> = ({ data }) => {
  // Process cost trends over time
  const costTrends = data.events
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .reduce((acc: any[], event, index) => {
      const date = new Date(event.date).toLocaleDateString();
      const existing = acc.find(item => item.date === date);
      if (existing) {
        existing.cost += event.cost;
        existing.count += 1;
      } else {
        acc.push({ date, cost: event.cost, count: 1 });
      }
      return acc;
    }, []).slice(-10);

  // Status distribution
  const statusDistribution = [
    { name: 'Completed', value: data.events.filter(e => e.status === 'completed').length, color: '#10b981' },
    { name: 'Scheduled', value: data.events.filter(e => e.status === 'scheduled').length, color: '#f59e0b' },
    { name: 'Overdue', value: data.events.filter(e => e.status === 'overdue').length, color: '#ef4444' }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Maintenance by Type */}
      <Card>
        <CardHeader>
          <CardTitle>Maintenance by Type</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.maintenanceByType}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Average Cost by Type */}
      <Card>
        <CardHeader>
          <CardTitle>Average Cost by Type</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.maintenanceByType}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${value}`, 'Average Cost']} />
              <Bar dataKey="avgCost" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Cost Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Trends Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={costTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${value}`, 'Cost']} />
              <Line type="monotone" dataKey="cost" stroke="#ef4444" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Maintenance Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusDistribution.map((entry, index) => (
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

export default MaintenanceReportCharts;
