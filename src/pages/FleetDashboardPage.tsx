
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import FleetDashboard from '@/components/dashboard/FleetDashboard';

const FleetDashboardPage: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <FleetDashboard />
    </div>
  );
};

export default FleetDashboardPage;
