
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkshopAuth } from '@/hooks/useWorkshopAuth';
import WorkshopLoginForm from '@/components/workshops/WorkshopLoginForm';
import WorkshopDashboard from '@/components/workshops/WorkshopDashboard';
import LoadingSpinner from '@/components/LoadingSpinner';

const WorkshopAuth: React.FC = () => {
  const { workshopUser, isLoading } = useWorkshopAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect authenticated workshop users to dashboard
    if (workshopUser) {
      navigate('/workshop-dashboard');
    }
  }, [workshopUser, navigate]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (workshopUser) {
    return <WorkshopDashboard />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <WorkshopLoginForm onSuccess={() => navigate('/workshop-dashboard')} />
    </div>
  );
};

export default WorkshopAuth;
