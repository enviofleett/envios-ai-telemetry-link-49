
import React, { useState, useEffect } from 'react';
import { useMapConfigs } from '@/hooks/useMapTilerApi';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/LoadingSpinner';
import SystemOverview from './enhanced-map-api/SystemOverview';
import ApiConfigCard from './enhanced-map-api/ApiConfigCard';
import { getTodayUsage, getUsagePercentage } from './enhanced-map-api/utils';
import type { MapApiConfig, SystemOverviewData } from './enhanced-map-api/types';

const EnhancedMapApiManagement: React.FC = () => {
  const { configs, isLoading, saveConfig, deleteConfig, refetch } = useMapConfigs();
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        refetch();
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refetch]);

  const handleToggleAutoFallback = async (config: MapApiConfig, enabled: boolean) => {
    try {
      await saveConfig({
        ...config,
        auto_fallback_enabled: enabled
      });
      toast.success('Auto-fallback setting updated');
      refetch();
    } catch (error) {
      toast.error('Failed to update auto-fallback setting');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <LoadingSpinner />
        <span className="ml-2">Loading enhanced map configurations...</span>
      </div>
    );
  }

  const activeConfigs = configs.filter(c => c.is_active);
  const totalDailyUsage = activeConfigs.reduce((sum, config) => sum + getTodayUsage(config), 0);
  const avgUsagePercentage = activeConfigs.length > 0 
    ? activeConfigs.reduce((sum, config) => sum + getUsagePercentage(config), 0) / activeConfigs.length
    : 0;

  const systemOverviewData: SystemOverviewData = {
    activeConfigs: activeConfigs.length,
    totalDailyUsage,
    avgUsagePercentage,
    autoFallbackEnabled: activeConfigs.filter(c => c.auto_fallback_enabled).length
  };

  const hasHighUsageAlerts = activeConfigs.some(config => getUsagePercentage(config) >= 90);

  return (
    <div className="space-y-6">
      <SystemOverview
        data={systemOverviewData}
        autoRefresh={autoRefresh}
        onAutoRefreshChange={setAutoRefresh}
        onRefresh={refetch}
        hasHighUsageAlerts={hasHighUsageAlerts}
      />

      <div className="grid gap-6">
        {configs.map((config) => (
          <ApiConfigCard
            key={config.id}
            config={config}
            onToggleAutoFallback={handleToggleAutoFallback}
          />
        ))}
      </div>
    </div>
  );
};

export default EnhancedMapApiManagement;
