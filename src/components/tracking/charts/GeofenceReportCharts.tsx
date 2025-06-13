
import React from 'react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import ReportChartContainer from './ReportChartContainer';
import type { GeofenceReportData } from '@/hooks/useAdvancedReports';

interface GeofenceReportChartsProps {
  data: GeofenceReportData[];
  isLoading: boolean;
}

const GeofenceReportCharts: React.FC<GeofenceReportChartsProps> = ({ data, isLoading }) => {
  // Event type distribution
  const eventTypeData = data.reduce((acc: any[], event) => {
    const existing = acc.find(item => item.type === event.eventType);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({
        type: event.eventType,
        count: 1,
        fill: event.eventType === 'enter' ? '#22c55e' : '#ef4444'
      });
    }
    return acc;
  }, []);

  // Geofence activity by location
  const geofenceActivity = data.reduce((acc: any[], event) => {
    const existing = acc.find(item => item.geofence === event.geofenceName);
    if (existing) {
      existing.events += 1;
      if (event.status === 'Violation') existing.violations += 1;
    } else {
      acc.push({
        geofence: event.geofenceName.length > 15 ? event.geofenceName.substring(0, 15) + '...' : event.geofenceName,
        events: 1,
        violations: event.status === 'Violation' ? 1 : 0
      });
    }
    return acc;
  }, []).slice(0, 8);

  const chartConfig = {
    enter: {
      label: "Enter Events",
      color: "#22c55e",
    },
    exit: {
      label: "Exit Events", 
      color: "#ef4444",
    },
    events: {
      label: "Total Events",
      color: "#3b82f6",
    },
    violations: {
      label: "Violations",
      color: "#f59e0b",
    },
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReportChartContainer
          data={[]}
          reportType="geofence"
          isLoading={true}
          title="Event Distribution"
        />
        <ReportChartContainer
          data={[]}
          reportType="geofence"
          isLoading={true}
          title="Geofence Activity"
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Event Type Distribution */}
      <ReportChartContainer
        data={data}
        reportType="geofence"
        isLoading={false}
        title="Entry vs Exit Events"
      >
        <ChartContainer config={chartConfig} className="h-64">
          <PieChart>
            <Pie
              data={eventTypeData}
              cx="50%"
              cy="50%"
              outerRadius={80}
              dataKey="count"
              label={({ type, count }) => `${type}: ${count}`}
            >
              {eventTypeData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <ChartTooltip
              content={
                <ChartTooltipContent 
                  hideLabel
                  className="w-[150px]"
                  formatter={(value, name) => [
                    `${value} events`,
                    `${name} events`,
                  ]}
                />
              }
            />
          </PieChart>
        </ChartContainer>
      </ReportChartContainer>

      {/* Geofence Activity */}
      <ReportChartContainer
        data={data}
        reportType="geofence"
        isLoading={false}
        title="Activity by Geofence"
      >
        <ChartContainer config={chartConfig} className="h-64">
          <BarChart data={geofenceActivity}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="geofence" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis fontSize={12} tickLine={false} axisLine={false} />
            <ChartTooltip
              content={
                <ChartTooltipContent 
                  className="w-[180px]"
                  formatter={(value, name) => [
                    `${value}`,
                    chartConfig[name as keyof typeof chartConfig]?.label || name,
                  ]}
                />
              }
            />
            <Bar 
              dataKey="events" 
              fill="var(--color-events)" 
              radius={4}
            />
            <Bar 
              dataKey="violations" 
              fill="var(--color-violations)" 
              radius={4}
            />
          </BarChart>
        </ChartContainer>
      </ReportChartContainer>
    </div>
  );
};

export default GeofenceReportCharts;
