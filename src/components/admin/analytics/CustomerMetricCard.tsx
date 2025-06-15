
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';

interface CustomerMetricCardProps {
  title: string;
  metric: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
}

const CustomerMetricCard: React.FC<CustomerMetricCardProps> = ({ title, metric, description, icon, onClick }) => {
  return (
    <Card onClick={onClick} className="cursor-pointer hover:bg-muted/50 transition-colors">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{metric}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
};

export default CustomerMetricCard;
