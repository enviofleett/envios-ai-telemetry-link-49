
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import ProfessionalDashboard from '@/components/dashboard/ProfessionalDashboard';
import LoadingSpinner from '@/components/LoadingSpinner';

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <ProfessionalDashboard />;
};

export default Index;
