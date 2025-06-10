
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface WorkshopMetrics {
  totalRevenue: number;
  totalBookings: number;
  averageRating: number;
  completionRate: number;
  revenueGrowth: number;
  bookingGrowth: number;
}

export interface ServicePerformance {
  name: string;
  bookings: number;
  revenue: number;
  avgDuration: number;
  profitMargin: number;
}

export interface FinancialData {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  averageOrderValue: number;
  revenueByPaymentMethod: {
    method: string;
    amount: number;
    percentage: number;
  }[];
}

export interface UsageAnalytics {
  peakHours: { hour: string; bookings: number }[];
  customerRetention: number;
  averageWaitTime: number;
  serviceEfficiency: number;
  seasonalTrends: { month: string; bookings: number; revenue: number }[];
}

export const useWorkshopAnalytics = (workshopId: string) => {
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch workshop metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['workshop-metrics', workshopId, selectedPeriod],
    queryFn: async (): Promise<WorkshopMetrics> => {
      // In a real implementation, this would query your database
      // For now, returning mock data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        totalRevenue: 45250,
        totalBookings: 234,
        averageRating: 4.6,
        completionRate: 94.5,
        revenueGrowth: 12.5,
        bookingGrowth: 8.3
      };
    },
    enabled: !!workshopId
  });

  // Fetch service performance data
  const { data: servicePerformance, isLoading: performanceLoading } = useQuery({
    queryKey: ['service-performance', workshopId, selectedPeriod],
    queryFn: async (): Promise<ServicePerformance[]> => {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      return [
        { name: 'Oil Change', bookings: 85, revenue: 8500, avgDuration: 45, profitMargin: 65 },
        { name: 'Brake Service', bookings: 42, revenue: 12600, avgDuration: 120, profitMargin: 58 },
        { name: 'Tire Replacement', bookings: 38, revenue: 15200, avgDuration: 90, profitMargin: 72 },
        { name: 'Engine Diagnostics', bookings: 29, revenue: 8700, avgDuration: 180, profitMargin: 45 },
        { name: 'Transmission Service', bookings: 15, revenue: 7500, avgDuration: 240, profitMargin: 52 }
      ];
    },
    enabled: !!workshopId
  });

  // Fetch financial data
  const { data: financialData, isLoading: financialLoading } = useQuery({
    queryKey: ['financial-data', workshopId, selectedPeriod],
    queryFn: async (): Promise<FinancialData> => {
      await new Promise(resolve => setTimeout(resolve, 600));
      
      return {
        totalRevenue: 45250,
        totalExpenses: 18900,
        netProfit: 26350,
        profitMargin: 58.2,
        averageOrderValue: 193.37,
        revenueByPaymentMethod: [
          { method: 'Credit Card', amount: 32400, percentage: 71.6 },
          { method: 'Cash', amount: 9050, percentage: 20.0 },
          { method: 'Bank Transfer', amount: 3800, percentage: 8.4 }
        ]
      };
    },
    enabled: !!workshopId
  });

  // Fetch usage analytics
  const { data: usageAnalytics, isLoading: usageLoading } = useQuery({
    queryKey: ['usage-analytics', workshopId, selectedPeriod],
    queryFn: async (): Promise<UsageAnalytics> => {
      await new Promise(resolve => setTimeout(resolve, 700));
      
      return {
        peakHours: [
          { hour: '9:00 AM', bookings: 18 },
          { hour: '10:00 AM', bookings: 25 },
          { hour: '11:00 AM', bookings: 22 },
          { hour: '2:00 PM', bookings: 28 },
          { hour: '3:00 PM', bookings: 31 },
          { hour: '4:00 PM', bookings: 24 }
        ],
        customerRetention: 68.5,
        averageWaitTime: 12.5,
        serviceEfficiency: 87.3,
        seasonalTrends: [
          { month: 'Jan', bookings: 185, revenue: 38000 },
          { month: 'Feb', bookings: 205, revenue: 42000 },
          { month: 'Mar', bookings: 234, revenue: 45250 },
          { month: 'Apr', bookings: 251, revenue: 48500 },
          { month: 'May', bookings: 268, revenue: 52000 }
        ]
      };
    },
    enabled: !!workshopId
  });

  // Generate report mutation
  const generateReportMutation = useMutation({
    mutationFn: async ({ reportType, format }: { reportType: string; format: string }) => {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const reportData = {
        workshopId,
        reportType,
        period: selectedPeriod,
        generatedAt: new Date().toISOString(),
        data: {
          metrics,
          servicePerformance,
          financialData,
          usageAnalytics
        }
      };

      // In a real implementation, this would generate and save the report
      return reportData;
    },
    onSuccess: (data) => {
      toast({
        title: "Report Generated",
        description: `${data.reportType} report has been generated successfully`
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to generate report: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const exportReport = useCallback(async (reportType: string, format: 'pdf' | 'csv' | 'excel' = 'pdf') => {
    try {
      const result = await generateReportMutation.mutateAsync({ reportType, format });
      
      // Create and download file
      const dataStr = JSON.stringify(result, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `workshop-${reportType}-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export report:', error);
    }
  }, [generateReportMutation]);

  const refreshAnalytics = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['workshop-metrics', workshopId] });
    queryClient.invalidateQueries({ queryKey: ['service-performance', workshopId] });
    queryClient.invalidateQueries({ queryKey: ['financial-data', workshopId] });
    queryClient.invalidateQueries({ queryKey: ['usage-analytics', workshopId] });
  }, [queryClient, workshopId]);

  const updatePeriod = useCallback((period: string) => {
    setSelectedPeriod(period);
  }, []);

  return {
    // Data
    metrics,
    servicePerformance,
    financialData,
    usageAnalytics,
    
    // Loading states
    isLoading: metricsLoading || performanceLoading || financialLoading || usageLoading,
    metricsLoading,
    performanceLoading,
    financialLoading,
    usageLoading,
    
    // Actions
    exportReport,
    refreshAnalytics,
    updatePeriod,
    
    // State
    selectedPeriod,
    isGeneratingReport: generateReportMutation.isPending
  };
};
