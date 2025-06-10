
import React from 'react';
import { useWorkshopAuth } from '@/hooks/useWorkshopAuth';
import { Navigate } from 'react-router-dom';
import WorkshopDashboard from '@/components/workshops/WorkshopDashboard';
import LoadingSpinner from '@/components/LoadingSpinner';

const WorkshopDashboardPage: React.FC = () => {
  const { workshopUser, isLoading } = useWorkshopAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!workshopUser) {
    return <Navigate to="/workshop-auth" replace />;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <WorkshopDashboard />
    </div>
  );
};

export default WorkshopDashboardPage;
