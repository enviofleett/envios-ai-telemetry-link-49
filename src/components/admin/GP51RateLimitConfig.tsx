
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, Shield, Activity } from 'lucide-react';
import { rateLimitingService } from '@/services/gp51/rateLimitingService';

const GP51RateLimitConfig: React.FC = () => {
  const [config, setConfig] = useState(rateLimitingService.getConfig());
  const [stats, setStats] = useState(rateLimitingService.getStats());
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(rateLimitingService.getStats());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleConfigChange = (key: keyof typeof config, value: number) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleUpdateConfig = () => {
    setIsUpdating(true);
    rateLimitingService.updateConfig(config);
    setTimeout(() => setIsUpdating(false), 500);
  };

  const handleResetStats = () => {
    rateLimitingService.resetStats();
    setStats(rateLimitingService.getStats());
  };

  const getStatusBadge = () => {
    if (stats.circuitOpen) {
      return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Circuit Open</Badge>;
    }
    if (stats.rateLimitedRequests > 0) {
      return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Rate Limited</Badge>;
    }
    return <Badge variant="default"><Shield className="h-3 w-3 mr-1" />Protected</Badge>;
  };

  const successRate = stats.totalRequests > 0 
    ? ((stats.successfulRequests / stats.totalRequests) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              GP51 Rate Limiting Protection
            </CardTitle>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <Activity className="h-6 w-6 mx-auto mb-1 text-blue-600" />
              <div className="text-sm font-medium text-blue-800">Total Requests</div>
              <div className="text-xl font-bold text-blue-900">{stats.totalRequests}</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-sm font-medium text-green-800">Success Rate</div>
              <div className="text-xl font-bold text-green-900">{successRate}%</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-sm font-medium text-orange-800">Rate Limited</div>
              <div className="text-xl font-bold text-orange-900">{stats.rateLimitedRequests}</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-sm font-medium text-purple-800">Failed</div>
              <div className="text-xl font-bold text-purple-900">{stats.failedRequests}</div>
            </div>
          </div>

          {/* Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="baseDelay">Base Delay (ms)</Label>
              <Input
                id="baseDelay"
                type="number"
                value={config.baseDelay}
                onChange={(e) => handleConfigChange('baseDelay', parseInt(e.target.value) || 0)}
                min="1000"
                max="10000"
                step="500"
              />
              <p className="text-xs text-gray-500">Minimum delay between GP51 API requests</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="maxRetries">Max Retries</Label>
              <Input
                id="maxRetries"
                type="number"
                value={config.maxRetries}
                onChange={(e) => handleConfigChange('maxRetries', parseInt(e.target.value) || 1)}
                min="1"
                max="10"
              />
              <p className="text-xs text-gray-500">Maximum retry attempts for failed requests</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="batchSize">Batch Size</Label>
              <Input
                id="batchSize"
                type="number"
                value={config.batchSize}
                onChange={(e) => handleConfigChange('batchSize', parseInt(e.target.value) || 1)}
                min="1"
                max="50"
              />
              <p className="text-xs text-gray-500">Number of items to process in each batch</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="circuitBreakerThreshold">Circuit Breaker Threshold</Label>
              <Input
                id="circuitBreakerThreshold"
                type="number"
                value={config.circuitBreakerThreshold}
                onChange={(e) => handleConfigChange('circuitBreakerThreshold', parseInt(e.target.value) || 1)}
                min="1"
                max="20"
              />
              <p className="text-xs text-gray-500">Consecutive failures before circuit opens</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <Button 
              onClick={handleUpdateConfig}
              disabled={isUpdating}
            >
              {isUpdating ? 'Updating...' : 'Update Configuration'}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleResetStats}
            >
              Reset Statistics
            </Button>
          </div>

          {/* Recommendations */}
          {stats.rateLimitedRequests > 0 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2" />
                <div>
                  <h4 className="font-medium text-yellow-800">Rate Limiting Detected</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    GP51 is rate limiting your requests. Consider:
                  </p>
                  <ul className="text-sm text-yellow-700 mt-2 list-disc list-inside">
                    <li>Increasing the base delay to {Math.max(config.baseDelay + 1000, 5000)}ms</li>
                    <li>Reducing batch size to {Math.max(config.batchSize - 5, 1)}</li>
                    <li>Contacting GP51 support for IP whitelisting</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {stats.circuitOpen && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 mr-2" />
                <div>
                  <h4 className="font-medium text-red-800">Circuit Breaker Open</h4>
                  <p className="text-sm text-red-700 mt-1">
                    Too many consecutive failures detected. The system is in cooldown mode for 1 minute.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GP51RateLimitConfig;
