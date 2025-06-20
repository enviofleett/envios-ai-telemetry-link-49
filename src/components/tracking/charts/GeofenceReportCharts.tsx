
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

interface GeofenceReportChartsProps {
  data: {
    totalGeofences: number;
    activeGeofences: number;
    violations: number;
    entriesExits: { date: string; entries: number; exits: number }[];
    violationsByZone: { zone: string; violations: number }[];
    violationsByVehicle: { vehicle: string; violations: number }[];
  };
}

const GeofenceReportCharts: React.FC<GeofenceReportChartsProps> = ({ data }) => {
  // Zone type distribution
  const zoneTypeDistribution = [
    { name: 'Inclusion Zones', value: Math.round(data.totalGeofences * 0.7), color: '#10b981' },
    { name: 'Exclusion Zones', value: Math.round(data.totalGeofences * 0.3), color: '#ef4444' }
  ];

  // Compliance rate
  const complianceData = [
    { name: 'Compliant', value: data.totalGeofences - data.violations, color: '#10b981' },
    { name: 'Violations', value: data.violations, color: '#ef4444' }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Entries and Exits Over Time */}
      <Card>
        <CardHeader>
          <CardTitle>Geofence Entries & Exits</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.entriesExits}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="entries" stroke="#10b981" strokeWidth={2} name="Entries" />
              <Line type="monotone" dataKey="exits" stroke="#ef4444" strokeWidth={2} name="Exits" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Violations by Zone */}
      <Card>
        <CardHeader>
          <CardTitle>Violations by Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.violationsByZone.slice(0, 8)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="zone" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="violations" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Violations by Vehicle */}
      <Card>
        <CardHeader>
          <CardTitle>Top Violating Vehicles</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.violationsByVehicle.slice(0, 8)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="vehicle" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="violations" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Zone Type Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Geofence Zone Types</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={zoneTypeDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {zoneTypeDistribution.map((entry, index) => (
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

export default GeofenceReportCharts;
