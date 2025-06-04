
import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Car, 
  LogOut, 
  RefreshCw
} from 'lucide-react';

interface DashboardHeaderProps {
  lastUpdate: Date;
  isRefreshing: boolean;
  onRefresh: () => void;
  onLogout: () => void;
}

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('en-US', { 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit'
  });
};

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ 
  lastUpdate, 
  isRefreshing, 
  onRefresh, 
  onLogout 
}) => {
  return (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-teal-500 rounded-lg flex items-center justify-center">
              <Car className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Vehicle Dashboard</h1>
              <p className="text-sm text-gray-600">
                Last updated: {formatTime(lastUpdate)}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={onRefresh}
              variant="outline"
              size="sm"
              disabled={isRefreshing}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
            <Button
              onClick={onLogout}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2 text-red-600 border-red-200 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
