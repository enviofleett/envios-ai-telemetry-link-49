
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

interface TripReportChartsProps {
  data: {
    totalTrips: number;
    totalDistance: number;
    totalDuration: number;
    averageSpeed: number;
    trips: any[];
  };
}

const TripReportCharts: React.FC<TripReportChartsProps> = ({ data }) => {
  // Process data for charts
  const dailyTripsData = data.trips.reduce((acc: any[], trip) => {
    const date = new Date(trip.startTime).toLocaleDateString();
    const existing = acc.find(item => item.date === date);
    if (existing) {
      existing.trips += 1;
      existing.distance += trip.distance;
    } else {
      acc.push({ date, trips: 1, distance: trip.distance });
    }
    return acc;
  }, []).slice(0, 7);

  const speedDistribution = [
    { range: '0-30 mph', count: data.trips.filter(t => t.averageSpeed <= 30).length },
    { range: '31-50 mph', count: data.trips.filter(t => t.averageSpeed > 30 && t.averageSpeed <= 50).length },
    { range: '51-70 mph', count: data.trips.filter(t => t.averageSpeed > 50 && t.averageSpeed <= 70).length },
    { range: '70+ mph', count: data.trips.filter(t => t.averageSpeed > 70).length }
  ];

  const durationBreakdown = [
    { name: 'Short (< 1hr)', value: data.trips.filter(t => t.duration < 60).length, color: '#10b981' },
    { name: 'Medium (1-3hr)', value: data.trips.filter(t => t.duration >= 60 && t.duration <= 180).length, color: '#f59e0b' },
    { name: 'Long (> 3hr)', value: data.trips.filter(t => t.duration > 180).length, color: '#ef4444' }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Daily Trips Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Trips Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyTripsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="trips" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Daily Distance */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Distance Covered</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyTripsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value} km`, 'Distance']} />
              <Bar dataKey="distance" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Speed Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Speed Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={speedDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Trip Duration Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Trip Duration Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={durationBreakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {durationBreakdown.map((entry, index) => (
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

export default TripReportCharts;
