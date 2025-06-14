
import React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltipContent } from "@/components/ui/chart"

interface AgentEarningsChartProps {
  data: { name: string; total: number }[];
}

const chartConfig = {
  total: {
    label: "Commissions",
    color: "#2563eb",
  },
} satisfies ChartConfig

const AgentEarningsChart: React.FC<AgentEarningsChartProps> = ({ data }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Commission Earnings</CardTitle>
        <CardDescription>Your paid commission over the last 6 months.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
            <BarChart data={data}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="name"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value.slice(0, 3)}
              />
              <YAxis tickFormatter={(value) => `$${value}`} />
              <Tooltip content={<ChartTooltipContent formatter={(value) => `$${(value as number).toFixed(2)}`} />} />
              <Bar dataKey="total" fill="var(--color-total)" radius={4} />
            </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default AgentEarningsChart;
