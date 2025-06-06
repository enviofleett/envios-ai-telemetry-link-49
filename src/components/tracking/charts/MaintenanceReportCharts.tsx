
import React from 'react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import ReportChartContainer from './ReportChartContainer';
import type { MaintenanceReportData } from '@/hooks/useAdvancedReports';

interface MaintenanceReportChartsProps {
  data: MaintenanceReportData[];
  isLoading: boolean;
}

const MaintenanceReportCharts: React.FC<MaintenanceReportChartsProps> = ({ data, isLoading }) => {
  // Status distribution
  const statusData = data.reduce((acc: any[], maintenance) => {
    const existing = acc.find(item => item.status === maintenance.status);
    if (existing) {
      existing.count += 1;
    } else {
      const colors = {
        'scheduled': '#3b82f6',
        'completed': '#22c55e', 
        'overdue': '#ef4444',
        'in_progress': '#f59e0b'
      };
      acc.push({
        status: maintenance.status,
        count: 1,
        fill: colors[maintenance.status as keyof typeof colors] || '#6b7280'
      });
    }
    return acc;
  }, []);

  // Maintenance type frequency
  const typeData = data.reduce((acc: any[], maintenance) => {
    const existing = acc.find(item => item.type === maintenance.maintenanceType);
    if (existing) {
      existing.count += 1;
      if (maintenance.cost) {
        existing.totalCost += parseFloat(maintenance.cost.replace('$', '')) || 0;
      }
    } else {
      acc.push({
        type: maintenance.maintenanceType.length > 12 ? maintenance.maintenanceType.substring(0, 12) + '...' : maintenance.maintenanceType,
        count: 1,
        totalCost: maintenance.cost ? parseFloat(maintenance.cost.replace('$', '')) || 0 : 0
      });
    }
    return acc;
  }, []).slice(0, 8);

  const chartConfig = {
    scheduled: {
      label: "Scheduled",
      color: "#3b82f6",
    },
    completed: {
      label: "Completed",
      color: "#22c55e",
    },
    overdue: {
      label: "Overdue",
      color: "#ef4444",
    },
    count: {
      label: "Service Count",
      color: "#8b5cf6",
    },
    totalCost: {
      label: "Total Cost ($)",
      color: "#f59e0b",
    },
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReportChartContainer
          data={[]}
          reportType="maintenance"
          isLoading={true}
          title="Status Distribution"
        />
        <ReportChartContainer
          data={[]}
          reportType="maintenance"
          isLoading={true}
          title="Service Types"
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Status Distribution */}
      <ReportChartContainer
        data={data}
        reportType="maintenance"
        isLoading={false}
        title="Maintenance Status Overview"
      >
        <ChartContainer config={chartConfig} className="h-64">
          <PieChart>
            <Pie
              data={statusData}
              cx="50%"
              cy="50%"
              outerRadius={80}
              dataKey="count"
              label={({ status, count }) => `${status}: ${count}`}
            >
              {statusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <ChartTooltip
              content={
                <ChartTooltipContent 
                  hideLabel
                  className="w-[150px]"
                  formatter={(value, name) => [
                    `${value} items`,
                    `${name}`,
                  ]}
                />
              }
            />
          </PieChart>
        </ChartContainer>
      </ReportChartContainer>

      {/* Service Types & Costs */}
      <ReportChartContainer
        data={data}
        reportType="maintenance"
        isLoading={false}
        title="Service Types & Costs"
      >
        <ChartContainer config={chartConfig} className="h-64">
          <BarChart data={typeData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="type" 
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
                    name === 'totalCost' ? `$${value}` : `${value}`,
                    chartConfig[name as keyof typeof chartConfig]?.label || name,
                  ]}
                />
              }
            />
            <Bar 
              dataKey="count" 
              fill="var(--color-count)" 
              radius={4}
            />
          </BarChart>
        </ChartContainer>
      </ReportChartContainer>
    </div>
  );
};

export default MaintenanceReportCharts;
