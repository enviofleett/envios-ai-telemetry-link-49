
import React from 'react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, ResponsiveContainer } from 'recharts';
import ReportChartContainer from './ReportChartContainer';
import type { TripReportData } from '@/hooks/useAdvancedReports';

interface TripReportChartsProps {
  data: TripReportData[];
  isLoading: boolean;
}

const TripReportCharts: React.FC<TripReportChartsProps> = ({ data, isLoading }) => {
  // Transform data for distance chart
  const distanceChartData = data.slice(0, 10).map((trip, index) => ({
    vehicle: trip.vehicleName.length > 10 ? trip.vehicleName.substring(0, 10) + '...' : trip.vehicleName,
    distance: parseFloat(trip.distance.replace(' km', '')),
    avgSpeed: parseFloat(trip.averageSpeed.replace(' km/h', '')),
    index
  }));

  // Transform data for trend analysis (group by date)
  const trendData = data.reduce((acc: any[], trip) => {
    const date = new Date(trip.startTime).toLocaleDateString();
    const existing = acc.find(item => item.date === date);
    
    if (existing) {
      existing.trips += 1;
      existing.totalDistance += parseFloat(trip.distance.replace(' km', ''));
    } else {
      acc.push({
        date,
        trips: 1,
        totalDistance: parseFloat(trip.distance.replace(' km', ''))
      });
    }
    
    return acc;
  }, []).slice(0, 7);

  const chartConfig = {
    distance: {
      label: "Distance (km)",
      color: "#22c55e",
    },
    avgSpeed: {
      label: "Avg Speed (km/h)",
      color: "#3b82f6",
    },
    trips: {
      label: "Number of Trips",
      color: "#f59e0b",
    },
    totalDistance: {
      label: "Total Distance (km)",
      color: "#ef4444",
    },
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReportChartContainer
          data={[]}
          reportType="trip"
          isLoading={true}
          title="Distance Analysis"
        />
        <ReportChartContainer
          data={[]}
          reportType="trip"
          isLoading={true}
          title="Trip Trends"
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Distance and Speed Chart */}
      <ReportChartContainer
        data={data}
        reportType="trip"
        isLoading={false}
        title="Distance & Speed Analysis"
      >
        <ChartContainer config={chartConfig} className="h-64">
          <BarChart data={distanceChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="vehicle" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis fontSize={12} tickLine={false} axisLine={false} />
            <ChartTooltip
              content={
                <ChartTooltipContent 
                  hideLabel 
                  className="w-[180px]"
                  formatter={(value, name) => [
                    `${value}${name === 'distance' ? ' km' : ' km/h'}`,
                    chartConfig[name as keyof typeof chartConfig]?.label || name,
                  ]}
                />
              }
            />
            <Bar 
              dataKey="distance" 
              fill="var(--color-distance)" 
              radius={4}
            />
          </BarChart>
        </ChartContainer>
      </ReportChartContainer>

      {/* Trip Trends Chart */}
      <ReportChartContainer
        data={data}
        reportType="trip"
        isLoading={false}
        title="Daily Trip Trends"
      >
        <ChartContainer config={chartConfig} className="h-64">
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis fontSize={12} tickLine={false} axisLine={false} />
            <ChartTooltip
              content={
                <ChartTooltipContent 
                  className="w-[180px]"
                  formatter={(value, name) => [
                    `${value}${name === 'totalDistance' ? ' km' : ''}`,
                    chartConfig[name as keyof typeof chartConfig]?.label || name,
                  ]}
                />
              }
            />
            <Line 
              type="monotone" 
              dataKey="trips" 
              stroke="var(--color-trips)" 
              strokeWidth={2}
              dot={{ r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="totalDistance" 
              stroke="var(--color-totalDistance)" 
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ChartContainer>
      </ReportChartContainer>
    </div>
  );
};

export default TripReportCharts;
