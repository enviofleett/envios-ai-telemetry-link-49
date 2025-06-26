
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
    } catch (error) {
      console.error('Error refreshing devices:', error);
    }
  };

  const handleConnect = async () => {
    try {
      await connect();
    } catch (error) {
      console.error('Error connecting:', error);
    }
  };

  const handleDisconnect = () => {
    disconnect();
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
            <div className={`text-2xl font-bold ${healthStatus.isHealthy ? 'text-green-600' : 'text-red-600'}`}>
              {healthStatus.status.toUpperCase()}
            </div>
            <div className="text-sm text-gray-500">Connection Status</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{healthStatus.activeDevices}</div>
            <div className="text-sm text-gray-500">Active Devices</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {healthStatus.responseTime || 0}ms
            </div>
            <div className="text-sm text-gray-500">Response Time</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {healthStatus.lastCheck.toLocaleTimeString()}
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
            <div className="text-2xl font-bold text-blue-600">{performanceMetrics.totalVehicles}</div>
            <div className="text-sm text-gray-500">Total Vehicles</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{performanceMetrics.activeVehicles}</div>
            <div className="text-sm text-gray-500">Active Vehicles</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {(performanceMetrics.errorRate * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-500">Error Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {(performanceMetrics.dataQuality * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-500">Data Quality</div>
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
                <th className="px-4 py-2 text-left">Last Seen</th>
                <th className="px-4 py-2 text-left">Signal</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((device) => (
                <tr key={device.id} className="border-t">
                  <td className="px-4 py-2 font-mono text-sm">{device.device_id}</td>
                  <td className="px-4 py-2">{device.name}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      device.status === 'online' ? 'bg-green-100 text-green-800' :
                      device.status === 'offline' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {device.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-500">
                    {device.last_seen.toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-sm">
                    {device.signal_strength ? `${device.signal_strength}%` : 'N/A'}
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
              <h3 className="font-semibold text-lg">{group.name}</h3>
              {group.description && (
                <p className="text-sm text-gray-600 mt-1">{group.description}</p>
              )}
              <div className="mt-2">
                <span className="text-sm text-gray-500">
                  {group.vehicle_count} vehicles, {group.devices.filter(d => d.status === 'online').length} online
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
