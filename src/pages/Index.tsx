
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import UnifiedFleetDashboard from "@/components/dashboard/UnifiedFleetDashboard";

const Index = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <UnifiedFleetDashboard />;
};

export default Index;
