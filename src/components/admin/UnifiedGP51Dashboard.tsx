
import React, { useEffect } from 'react';
import { useUnifiedGP51Service } from '@/hooks/useUnifiedGP51Service';

const UnifiedGP51Dashboard: React.FC = () => {
  const {
    session,
    devices,
    positions,
    groups,
    healthStatus,
    performanceMetrics,
    loading,
    devicesLoading,
    error,
    fetchDevices,
    connect,
    disconnect,
    refreshAllData
  } = useUnifiedGP51Service();

  useEffect(() => {
    // Auto-connect on mount if not already connected
    if (!session && !loading) {
      connect().catch(console.error);
    }
  }, [session, loading, connect]);

  const handleRefreshDevices = async () => {
    try {
      await fetchDevices();
    } catch (err) {
      console.error('Error refreshing devices:', err);
    }
  };

  const handleConnect = async () => {
    try {
      await connect();
    } catch (err) {
      console.error('Error connecting:', err);
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  // Provide default values for metrics to avoid errors
  const safePerformanceMetrics = performanceMetrics || {
    responseTime: 0,
    success: false,
    requestStartTime: new Date().toISOString(),
    deviceCount: 0,
    groupCount: 0,
    timestamp: new Date().toISOString(),
    apiCallCount: 0,
    errorRate: 0,
    averageResponseTime: 0,
    movingVehicles: 0,
    stoppedVehicles: 0
  };

  const safeHealthStatus = healthStatus || {
    status: 'failed' as const,
    lastCheck: new Date(),
    isConnected: false,
    lastPingTime: new Date(),
    tokenValid: false,
    sessionValid: false,
    activeDevices: 0,
    errorMessage: 'Not connected',
    isHealthy: false,
    connectionStatus: 'disconnected' as const
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">GP51 Unified Dashboard</h1>
        
        <div className="flex space-x-3">
          {!session ? (
            <button
              onClick={handleConnect}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Connecting...' : 'Connect'}
            </button>
          ) : (
            <>
              <button
                onClick={handleRefreshDevices}
                disabled={devicesLoading}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
              >
                {devicesLoading ? 'Refreshing...' : 'Refresh Devices'}
              </button>
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Disconnect
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Health Status */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">System Health</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className={`text-2xl font-bold ${safeHealthStatus.isHealthy ? 'text-green-600' : 'text-red-600'}`}>
              {safeHealthStatus.status.toUpperCase()}
            </div>
            <div className="text-sm text-gray-500">Connection Status</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{safeHealthStatus.activeDevices}</div>
            <div className="text-sm text-gray-500">Active Devices</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {safeHealthStatus.responseTime || 0}ms
            </div>
            <div className="text-sm text-gray-500">Response Time</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {safeHealthStatus.lastCheck.toLocaleTimeString()}
            </div>
            <div className="text-sm text-gray-500">Last Check</div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Performance Metrics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{safePerformanceMetrics.deviceCount}</div>
            <div className="text-sm text-gray-500">Total Devices</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{safePerformanceMetrics.movingVehicles}</div>
            <div className="text-sm text-gray-500">Moving Vehicles</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {(safePerformanceMetrics.errorRate * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-500">Error Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {safePerformanceMetrics.averageResponseTime}ms
            </div>
            <div className="text-sm text-gray-500">Avg Response Time</div>
          </div>
        </div>
      </div>

      {/* Devices Table */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Connected Devices ({devices.length})</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left">Device ID</th>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Last Active</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((device) => (
                <tr key={device.deviceId} className="border-t">
                  <td className="px-4 py-2 font-mono text-sm">{device.deviceId}</td>
                  <td className="px-4 py-2">{device.deviceName}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      device.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {device.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-500">
                    {device.lastActiveTime ? new Date(device.lastActiveTime).toLocaleString() : 'Never'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {devices.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No devices found. {session ? 'Try refreshing the data.' : 'Please connect first.'}
            </div>
          )}
        </div>
      </div>

      {/* Groups */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Vehicle Groups ({groups.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => (
            <div key={group.id} className="border rounded-lg p-4">
              <h3 className="font-semibold text-lg">{group.group_name}</h3>
              <div className="mt-2">
                <span className="text-sm text-gray-500">
                  {group.device_count} devices
                </span>
              </div>
            </div>
          ))}
          {groups.length === 0 && (
            <div className="col-span-full text-center py-8 text-gray-500">
              No groups found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnifiedGP51Dashboard;
