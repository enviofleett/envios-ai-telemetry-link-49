
import type { MapApiConfig, AlertLevel } from './types';

export const getTodayUsage = (config: MapApiConfig): number => {
  if (!config.map_api_usage || config.map_api_usage.length === 0) return 0;
  
  const today = new Date().toISOString().split('T')[0];
  const todayUsage = config.map_api_usage.find((usage: any) => 
    usage.usage_date === today
  );
  
  return todayUsage?.request_count || 0;
};

export const getUsagePercentage = (config: MapApiConfig): number => {
  const usage = getTodayUsage(config);
  return (usage / config.threshold_value) * 100;
};

export const getAlertLevel = (config: MapApiConfig): AlertLevel => {
  const percentage = getUsagePercentage(config);
  
  if (percentage >= 95) return { level: 'critical', color: 'bg-red-500', threshold: 95 };
  if (percentage >= 90) return { level: 'high', color: 'bg-orange-500', threshold: 90 };
  if (percentage >= 80) return { level: 'warning', color: 'bg-yellow-500', threshold: 80 };
  return { level: 'normal', color: 'bg-green-500', threshold: 0 };
};

export const calculateEfficiency = (config: MapApiConfig): number => {
  const usage = getTodayUsage(config);
  const weight = config.performance_weight || 1;
  const efficiency = usage > 0 ? (usage / config.threshold_value) * weight : 0;
  return Math.min(efficiency * 100, 100);
};

export const getRecommendedAction = (config: MapApiConfig): string => {
  const percentage = getUsagePercentage(config);
  
  if (!config.is_active) return 'Activate this configuration to enable usage';
  if (percentage >= 95) return 'Consider switching to fallback or increasing limit';
  if (percentage >= 90) return 'Monitor closely - approaching limit';
  if (percentage >= 80) return 'Usage warning - prepare fallback if needed';
  return 'Operating normally';
};
