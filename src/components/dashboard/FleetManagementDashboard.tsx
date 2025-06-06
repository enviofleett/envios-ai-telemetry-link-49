
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import DashboardHeader from './DashboardHeader';
import KPICardsSection from './KPICardsSection';
import SystemHealthPanel from './SystemHealthPanel';
import RealTimeAlertsPanel from './RealTimeAlertsPanel';
import AnalyticsChartsRow from './AnalyticsChartsRow';

const FleetManagementDashboard: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards Section */}
      <KPICardsSection />

      {/* Main Content Grid - System Health + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Health Panel - 2/3 width */}
        <div className="lg:col-span-2">
          <SystemHealthPanel />
        </div>
        
        {/* Real-time Alerts Panel - 1/3 width */}
        <div className="lg:col-span-1">
          <RealTimeAlertsPanel />
        </div>
      </div>

      {/* Analytics Charts Row */}
      <AnalyticsChartsRow />
    </div>
  );
};

export default FleetManagementDashboard;
