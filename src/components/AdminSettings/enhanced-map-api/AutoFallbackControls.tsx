
import React from 'react';
import { Switch } from '@/components/ui/switch';
import type { MapApiConfig } from './types';

interface AutoFallbackControlsProps {
  config: MapApiConfig;
  onToggle: (config: MapApiConfig, enabled: boolean) => void;
}

const AutoFallbackControls: React.FC<AutoFallbackControlsProps> = ({ 
  config, 
  onToggle 
}) => {
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div>
        <div className="font-medium">Auto-fallback</div>
        <div className="text-sm text-gray-600">
          Automatically switch when threshold is reached
        </div>
      </div>
      <Switch
        checked={config.auto_fallback_enabled || false}
        onCheckedChange={(enabled) => onToggle(config, enabled)}
      />
    </div>
  );
};

export default AutoFallbackControls;
