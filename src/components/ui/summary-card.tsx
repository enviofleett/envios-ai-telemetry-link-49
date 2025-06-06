
import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
  className?: string;
}

export function SummaryCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  onClick,
  className,
}: SummaryCardProps) {
  return (
    <Card 
      className={cn(
        "border-border transition-all duration-200", 
        onClick && "cursor-pointer hover:bg-muted/50 hover:shadow-md",
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-2xl font-bold text-foreground">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {trend && (
          <div className={cn(
            "flex items-center text-xs",
            trend.isPositive ? "text-green-600" : "text-red-600"
          )}>
            {trend.isPositive ? (
              <TrendingUp className="h-3 w-3 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 mr-1" />
            )}
            {trend.isPositive ? "+" : "-"}{Math.abs(trend.value)}% from last month
          </div>
        )}
      </CardContent>
    </Card>
  );
}
