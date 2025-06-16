
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import DashboardHeader from './DashboardHeader';
import GPS51StatusPanel from './GPS51StatusPanel';
import VehicleManagementPanel from './VehicleManagementPanel';
import ActivityStreamPanel from './ActivityStreamPanel';
import QuickActionsPanel from './QuickActionsPanel';

const ProfessionalDashboard: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <DashboardHeader />
        
        {/* GPS51 Status Overview */}
        <GPS51StatusPanel />
        
        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Vehicle Management - Takes up 2 columns on large screens */}
          <div className="lg:col-span-2">
            <VehicleManagementPanel />
          </div>
          
          {/* Quick Actions & Activity - Takes up 1 column */}
          <div className="space-y-6">
            <QuickActionsPanel />
            <ActivityStreamPanel />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProfessionalDashboard;
