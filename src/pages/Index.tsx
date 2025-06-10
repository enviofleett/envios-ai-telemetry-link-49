
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import LoadingSpinner from "@/components/LoadingSpinner";

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <Layout>
      <DashboardContent />
    </Layout>
  );
};

export default Index;
