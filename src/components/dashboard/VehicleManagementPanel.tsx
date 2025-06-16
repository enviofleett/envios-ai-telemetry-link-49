
import React from 'react';
import { Link } from 'react-router-dom';
import { useVehicleMetrics } from '@/hooks/useVehicleMetrics';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle } from 'lucide-react';

const VehicleManagementPanel: React.FC = () => {
  const { metrics, isLoading, error, refreshMetrics, forceSync } = useVehicleMetrics();

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-4 bg-gray-50 rounded-lg">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Vehicle Fleet Overview</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshMetrics}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={forceSync}
            disabled={isLoading}
          >
            Force Sync
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center mb-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-lg font-medium text-blue-800">Total Vehicles</p>
          <p className="text-4xl font-bold text-blue-600">{metrics.totalVehicles}</p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <p className="text-lg font-medium text-green-800">Online</p>
          <p className="text-4xl font-bold text-green-600">{metrics.onlineVehicles}</p>
        </div>
        <div className="p-4 bg-red-50 rounded-lg">
          <p className="text-lg font-medium text-red-800">Offline</p>
          <p className="text-4xl font-bold text-red-600">{metrics.offlineVehicles}</p>
        </div>
        <div className="p-4 bg-purple-50 rounded-lg">
          <p className="text-lg font-medium text-purple-800">Recently Active</p>
          <p className="text-4xl font-bold text-purple-600">{metrics.recentlyActiveVehicles}</p>
        </div>
      </div>

      <div className="flex justify-between items-center text-sm text-gray-600">
        <div>
          <span className="font-medium">Last Sync:</span> {metrics.lastSyncTime.toLocaleString()}
          <span className={`ml-2 px-2 py-1 rounded text-xs ${
            metrics.syncStatus === 'success' ? 'bg-green-100 text-green-800' :
            metrics.syncStatus === 'error' ? 'bg-red-100 text-red-800' :
            metrics.syncStatus === 'syncing' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {metrics.syncStatus}
          </span>
        </div>
        <Link to="/vehicles" className="text-blue-600 hover:underline font-medium">
          View All Vehicles →
        </Link>
      </div>
    </div>
  );
};

export default VehicleManagementPanel;
