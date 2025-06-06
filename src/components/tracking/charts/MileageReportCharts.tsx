
import React from 'react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, RadialBarChart, RadialBar, Legend } from 'recharts';
import ReportChartContainer from './ReportChartContainer';
import type { MileageReportData } from '@/hooks/useAdvancedReports';

interface MileageReportChartsProps {
  data: MileageReportData[];
  isLoading: boolean;
}

const MileageReportCharts: React.FC<MileageReportChartsProps> = ({ data, isLoading }) => {
  // Fuel efficiency comparison
  const efficiencyData = data.slice(0, 8).map(vehicle => ({
    vehicle: vehicle.vehicleName.length > 10 ? vehicle.vehicleName.substring(0, 10) + '...' : vehicle.vehicleName,
    efficiency: parseFloat(vehicle.fuelEfficiency.replace(' km/L', '')),
    utilization: parseInt(vehicle.utilizationRate.replace('%', '')),
    totalDistance: parseFloat(vehicle.totalDistance.replace(' km', ''))
  }));

  // Utilization rate for radial chart
  const utilizationData = data.slice(0, 6).map(vehicle => ({
    name: vehicle.vehicleName.length > 8 ? vehicle.vehicleName.substring(0, 8) + '...' : vehicle.vehicleName,
    utilization: parseInt(vehicle.utilizationRate.replace('%', '')),
    fill: parseInt(vehicle.utilizationRate.replace('%', '')) >= 80 ? '#22c55e' : 
          parseInt(vehicle.utilizationRate.replace('%', '')) >= 60 ? '#f59e0b' : '#ef4444'
  }));

  const chartConfig = {
    efficiency: {
      label: "Fuel Efficiency (km/L)",
      color: "#22c55e",
    },
    utilization: {
      label: "Utilization Rate (%)",
      color: "#3b82f6",
    },
    totalDistance: {
      label: "Total Distance (km)",
      color: "#8b5cf6",
    },
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReportChartContainer
          data={[]}
          reportType="mileage"
          isLoading={true}
          title="Fuel Efficiency"
        />
        <ReportChartContainer
          data={[]}
          reportType="mileage"
          isLoading={true}
          title="Utilization Rates"
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Fuel Efficiency Comparison */}
      <ReportChartContainer
        data={data}
        reportType="mileage"
        isLoading={false}
        title="Fuel Efficiency by Vehicle"
      >
        <ChartContainer config={chartConfig} className="h-64">
          <BarChart data={efficiencyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="vehicle" 
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
                  className="w-[200px]"
                  formatter={(value, name) => [
                    name === 'efficiency' ? `${value} km/L` : 
                    name === 'utilization' ? `${value}%` : 
                    `${value} km`,
                    chartConfig[name as keyof typeof chartConfig]?.label || name,
                  ]}
                />
              }
            />
            <Bar 
              dataKey="efficiency" 
              fill="var(--color-efficiency)" 
              radius={4}
            />
          </BarChart>
        </ChartContainer>
      </ReportChartContainer>

      {/* Utilization Rate Radial Chart */}
      <ReportChartContainer
        data={data}
        reportType="mileage"
        isLoading={false}
        title="Vehicle Utilization Rates"
      >
        <ChartContainer config={chartConfig} className="h-64">
          <RadialBarChart 
            cx="50%" 
            cy="50%" 
            innerRadius="20%" 
            outerRadius="80%" 
            data={utilizationData}
          >
            <RadialBar
              dataKey="utilization"
              cornerRadius={10}
              fill="#8884d8"
            />
            <Legend 
              iconSize={12}
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              wrapperStyle={{
                fontSize: '12px',
                paddingTop: '10px'
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent 
                  hideLabel
                  className="w-[150px]"
                  formatter={(value) => [`${value}%`, 'Utilization Rate']}
                />
              }
            />
          </RadialBarChart>
        </ChartContainer>
      </ReportChartContainer>
    </div>
  );
};

export default MileageReportCharts;
