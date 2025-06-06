
import React from 'react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import ReportChartContainer from './ReportChartContainer';
import type { AlertReportData } from '@/hooks/useAdvancedReports';

interface AlertReportChartsProps {
  data: AlertReportData[];
  isLoading: boolean;
}

const AlertReportCharts: React.FC<AlertReportChartsProps> = ({ data, isLoading }) => {
  // Severity distribution
  const severityData = data.reduce((acc: any[], alert) => {
    const existing = acc.find(item => item.severity === alert.severity);
    if (existing) {
      existing.count += 1;
    } else {
      const colors = {
        'low': '#22c55e',
        'medium': '#f59e0b',
        'high': '#ff6b35', 
        'critical': '#ef4444'
      };
      acc.push({
        severity: alert.severity,
        count: 1,
        fill: colors[alert.severity as keyof typeof colors] || '#6b7280'
      });
    }
    return acc;
  }, []);

  // Alert trends over time
  const trendData = data.reduce((acc: any[], alert) => {
    const date = new Date(alert.alertTime).toLocaleDateString();
    const existing = acc.find(item => item.date === date);
    
    if (existing) {
      existing.total += 1;
      existing[alert.severity] = (existing[alert.severity] || 0) + 1;
    } else {
      const newEntry: any = {
        date,
        total: 1,
        low: 0,
        medium: 0,
        high: 0,
        critical: 0
      };
      newEntry[alert.severity] = 1;
      acc.push(newEntry);
    }
    
    return acc;
  }, []).slice(0, 7);

  // Alert type distribution
  const typeData = data.reduce((acc: any[], alert) => {
    const existing = acc.find(item => item.type === alert.alertType);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({
        type: alert.alertType.length > 12 ? alert.alertType.substring(0, 12) + '...' : alert.alertType,
        count: 1
      });
    }
    return acc;
  }, []).slice(0, 6);

  const chartConfig = {
    low: {
      label: "Low Severity",
      color: "#22c55e",
    },
    medium: {
      label: "Medium Severity",
      color: "#f59e0b",
    },
    high: {
      label: "High Severity",
      color: "#ff6b35",
    },
    critical: {
      label: "Critical Severity",
      color: "#ef4444",
    },
    total: {
      label: "Total Alerts",
      color: "#8b5cf6",
    },
    count: {
      label: "Alert Count",
      color: "#3b82f6",
    },
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReportChartContainer
          data={[]}
          reportType="alerts"
          isLoading={true}
          title="Severity Distribution"
        />
        <ReportChartContainer
          data={[]}
          reportType="alerts"
          isLoading={true}
          title="Alert Trends"
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Severity Distribution */}
      <ReportChartContainer
        data={data}
        reportType="alerts"
        isLoading={false}
        title="Alert Severity Distribution"
      >
        <ChartContainer config={chartConfig} className="h-64">
          <PieChart>
            <Pie
              data={severityData}
              cx="50%"
              cy="50%"
              outerRadius={80}
              dataKey="count"
              label={({ severity, count }) => `${severity}: ${count}`}
            >
              {severityData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <ChartTooltip
              content={
                <ChartTooltipContent 
                  hideLabel
                  className="w-[150px]"
                  formatter={(value, name) => [
                    `${value} alerts`,
                    `${name} severity`,
                  ]}
                />
              }
            />
          </PieChart>
        </ChartContainer>
      </ReportChartContainer>

      {/* Alert Trends */}
      <ReportChartContainer
        data={data}
        reportType="alerts"
        isLoading={false}
        title="Daily Alert Trends"
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
                    `${value} alerts`,
                    chartConfig[name as keyof typeof chartConfig]?.label || name,
                  ]}
                />
              }
            />
            <Line 
              type="monotone" 
              dataKey="critical" 
              stroke="var(--color-critical)" 
              strokeWidth={2}
              dot={{ r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="high" 
              stroke="var(--color-high)" 
              strokeWidth={2}
              dot={{ r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="medium" 
              stroke="var(--color-medium)" 
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ChartContainer>
      </ReportChartContainer>
    </div>
  );
};

export default AlertReportCharts;
