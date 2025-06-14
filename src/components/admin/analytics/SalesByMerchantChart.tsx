
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface SalesByMerchantChartProps {
  data: { merchant_name: string; total_value: number }[] | undefined;
  isLoading: boolean;
}

export const SalesByMerchantChart: React.FC<SalesByMerchantChartProps> = ({ data, isLoading }) => {
    if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sales by Merchant</CardTitle>
          <CardDescription>Total sales value per merchant.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground">No sales data available for merchants.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales by Merchant</CardTitle>
        <CardDescription>Total sales value per merchant.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" tickFormatter={(value) => `$${(value / 1000)}k`} />
            <YAxis dataKey="merchant_name" type="category" width={150} />
            <Tooltip formatter={(value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)} />
            <Legend />
            <Bar dataKey="total_value" fill="#10b981" name="Sales Value" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
