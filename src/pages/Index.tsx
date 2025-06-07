
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
import FleetManagementDashboard from "@/components/dashboard/FleetManagementDashboard";

const Index = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <Layout>
      <FleetManagementDashboard />
    </Layout>
  );
};

export default Index;
