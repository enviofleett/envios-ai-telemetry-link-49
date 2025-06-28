
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import FleetDashboard from '@/components/dashboard/FleetDashboard'; // Fixed: use default import

const FleetDashboardPage: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <FleetDashboard 
        totalVehicles={0}
        activeVehicles={0}
        alerts={[]}
      />
    </div>
  );
};

export default FleetDashboardPage;
