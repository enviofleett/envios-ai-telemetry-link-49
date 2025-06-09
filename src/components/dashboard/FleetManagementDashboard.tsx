
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import EnhancedKPICardsSection from './EnhancedKPICardsSection';
import GP51HealthDashboard from '../GP51HealthDashboard';
import VehicleDataTable from './VehicleDataTable';
import RealTimeAlertsPanel from './RealTimeAlertsPanel';

const FleetManagementDashboard: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="space-y-6">
      {/* Enhanced KPI Cards Section with System Status */}
      <EnhancedKPICardsSection />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* GP51 Health Dashboard - 2/3 width */}
        <div className="lg:col-span-2">
          <GP51HealthDashboard />
        </div>
        
        {/* Real-time Alerts Panel - 1/3 width */}
        <div className="lg:col-span-1">
          <RealTimeAlertsPanel />
        </div>
      </div>

      {/* Vehicle Data Table - Full Width */}
      <VehicleDataTable />
    </div>
  );
};

export default FleetManagementDashboard;
