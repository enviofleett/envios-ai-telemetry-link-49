
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Car, 
  Activity, 
  AlertTriangle, 
  TrendingUp,
  Menu,
  Maximize2,
  Minimize2,
  RefreshCw
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useUnifiedVehicleData } from '@/hooks/useUnifiedVehicleData';
import UserAnalyticsDashboard from '@/components/analytics/UserAnalyticsDashboard';
import MobileVehicleManager from './MobileVehicleManager';

const MobileDashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'overview' | 'vehicles' | 'analytics'>('overview');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  
  const isMobile = useIsMobile();
  const { metrics, isLoading, forceRefresh } = useUnifiedVehicleData();

  const toggleCardExpansion = (cardId: string) => {
    setExpandedCard(expandedCard === cardId ? null : cardId);
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 h-24 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Navigation */}
      <div className="sticky top-0 bg-white border-b z-10">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold">Fleet Dashboard</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={forceRefresh}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Section Tabs */}
        <div className="flex border-t">
          {[
            { key: 'overview', label: 'Overview', icon: Activity },
            { key: 'vehicles', label: 'Vehicles', icon: Car },
            { key: 'analytics', label: 'Analytics', icon: TrendingUp }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveSection(key as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeSection === key 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeSection === 'overview' && (
          <div className="space-y-4">
            {/* Key Metrics - Mobile Grid */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="relative">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600">Total</p>
                      <p className="text-xl font-bold">{metrics.total}</p>
                    </div>
                    <Car className="h-6 w-6 text-blue-600" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Vehicles</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600">Online</p>
                      <p className="text-xl font-bold text-green-600">{metrics.online}</p>
                    </div>
                    <Activity className="h-6 w-6 text-green-600" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Active now</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600">Offline</p>
                      <p className="text-xl font-bold text-gray-600">{metrics.offline}</p>
                    </div>
                    <div className="w-6 h-6 bg-gray-300 rounded-full" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Inactive</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600">Alerts</p>
                      <p className="text-xl font-bold text-red-600">{metrics.alerts}</p>
                    </div>
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Need attention</p>
                </CardContent>
              </Card>
            </div>

            {/* Expandable Status Card */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Fleet Status</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleCardExpansion('status')}
                  >
                    {expandedCard === 'status' ? (
                      <Minimize2 className="h-4 w-4" />
                    ) : (
                      <Maximize2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Online Rate</span>
                    <Badge variant="outline">
                      {metrics.total > 0 ? Math.round((metrics.online / metrics.total) * 100) : 0}%
                    </Badge>
                  </div>
                  
                  {expandedCard === 'status' && (
                    <div className="space-y-2 pt-2 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Idle Vehicles</span>
                        <span className="text-sm font-medium">{metrics.idle}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Last Sync</span>
                        <span className="text-xs text-gray-500">
                          {metrics.lastSyncTime.toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="h-auto py-3">
                    <div className="text-center">
                      <Car className="h-5 w-5 mx-auto mb-1" />
                      <span className="text-xs">View Map</span>
                    </div>
                  </Button>
                  <Button variant="outline" size="sm" className="h-auto py-3">
                    <div className="text-center">
                      <AlertTriangle className="h-5 w-5 mx-auto mb-1" />
                      <span className="text-xs">View Alerts</span>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeSection === 'vehicles' && (
          <MobileVehicleManager />
        )}

        {activeSection === 'analytics' && (
          <UserAnalyticsDashboard />
        )}
      </div>
    </div>
  );
};

export default MobileDashboard;
