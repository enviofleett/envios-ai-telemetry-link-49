
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, CheckCircle, Clock } from 'lucide-react';
import type { MapApiConfig } from './types';
import { getTodayUsage } from './utils';
import StatusBadge from './StatusBadge';
import UsageProgress from './UsageProgress';
import AlertThresholds from './AlertThresholds';
import AutoFallbackControls from './AutoFallbackControls';
import Recommendations from './Recommendations';

interface ApiConfigCardProps {
  config: MapApiConfig;
  onToggleAutoFallback: (config: MapApiConfig, enabled: boolean) => void;
}

const ApiConfigCard: React.FC<ApiConfigCardProps> = ({ 
  config, 
  onToggleAutoFallback 
}) => {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold text-lg">{config.name}</h3>
              <StatusBadge config={config} />
              <Badge variant="outline">Priority {config.fallback_priority}</Badge>
              {config.auto_fallback_enabled && (
                <Badge variant="outline" className="text-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Auto-fallback
                </Badge>
              )}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Provider:</span>
                <span className="ml-1 capitalize">{config.provider_type}</span>
              </div>
              <div>
                <span className="font-medium">Daily Limit:</span>
                <span className="ml-1">{config.threshold_value.toLocaleString()}</span>
              </div>
              <div>
                <span className="font-medium">Today's Usage:</span>
                <span className="ml-1">{getTodayUsage(config).toLocaleString()}</span>
              </div>
              <div>
                <span className="font-medium">Performance Weight:</span>
                <span className="ml-1">{config.performance_weight || 1}x</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <UsageProgress config={config} />
        <AlertThresholds config={config} />
        <AutoFallbackControls 
          config={config} 
          onToggle={onToggleAutoFallback} 
        />
        <Recommendations config={config} />

        {config.last_alert_sent && (
          <div className="text-xs text-gray-500">
            <Clock className="h-3 w-3 inline mr-1" />
            Last alert: {new Date(config.last_alert_sent).toLocaleString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ApiConfigCard;
