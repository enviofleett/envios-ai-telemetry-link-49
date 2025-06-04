
import Layout from '@/components/Layout';
import LoginForm from '@/components/LoginForm';
import VehicleDashboard from '@/components/VehicleDashboard';
import { telemetryApi } from '@/services/telemetryApi';
import { useEffect, useState } from 'react';

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if already authenticated
    const sessionId = telemetryApi.getSessionId();
    if (sessionId) {
      setIsAuthenticated(true);
    }
  }, []);

  if (!isAuthenticated) {
    return <LoginForm onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <Layout>
      <VehicleDashboard />
    </Layout>
  );
};

export default Index;
