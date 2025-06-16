
import React from 'react';
import { useGP51Status } from '@/hooks/useGP51Status';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle, CheckCircle, XCircle, Activity } from 'lucide-react';

const GPS51StatusPanel: React.FC = () => {
  const { status, isLoading, error, checkStatus, retryConnection } = useGP51Status();

  const getStatusIcon = () => {
    if (status.connectionHealth === 'good') return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (status.connectionHealth === 'poor') return <Activity className="h-5 w-5 text-yellow-500" />;
    return <XCircle className="h-5 w-5 text-red-500" />;
  };

  const getStatusColor = () => {
    if (status.connectionHealth === 'good') return 'bg-green-100 text-green-800 border-green-300';
    if (status.connectionHealth === 'poor') return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  const getStatusText = () => {
    if (status.connectionHealth === 'good') return 'Connected & Active';
    if (status.connectionHealth === 'poor') return 'Connected (Limited)';
    return 'Disconnected';
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="flex items-center space-x-2 mb-2">
            <div className="h-8 w-24 bg-gray-200 rounded"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white p-6 rounded-lg shadow-md border ${getStatusColor().includes('red') ? 'border-red-300' : ''}`}>
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-xl font-semibold text-gray-800">GP51 Integration Status</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={checkStatus}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
          Check
        </Button>
      </div>

      <div className="flex items-center space-x-3 mb-4">
        {getStatusIcon()}
        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor()}`}>
          {getStatusText()}
        </span>
        {status.username && (
          <span className="text-sm text-gray-600">User: {status.username}</span>
        )}
      </div>

      {(status.errorMessage || error) && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <AlertTriangle className="h-4 w-4 text-red-500 mr-2 mt-0.5" />
            <div className="text-red-700 text-sm">
              <p className="font-medium">Connection Error:</p>
              <p>{status.errorMessage || error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={retryConnection}
              >
                Retry Connection
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
        <div>
          <span className="font-medium">API Connection:</span>
          <span className={`ml-2 ${status.isConnected ? 'text-green-600' : 'text-red-600'}`}>
            {status.isConnected ? 'Active' : 'Inactive'}
          </span>
        </div>
        <div>
          <span className="font-medium">Data Flow:</span>
          <span className={`ml-2 ${status.isReallyConnected ? 'text-green-600' : 'text-yellow-600'}`}>
            {status.isReallyConnected ? 'Real-time' : 'Limited'}
          </span>
        </div>
        {status.lastSync && (
          <div className="col-span-2">
            <span className="font-medium">Last Sync:</span>
            <span className="ml-2 text-gray-600">
              {new Date(status.lastSync).toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {!status.isConnected && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-2">
            GP51 connection required for real-time vehicle tracking.
          </p>
          <Button
            variant="default"
            size="sm"
            onClick={() => window.location.href = '/settings/gp51-integration'}
          >
            Configure GP51 Connection
          </Button>
        </div>
      )}
    </div>
  );
};

export default GPS51StatusPanel;
