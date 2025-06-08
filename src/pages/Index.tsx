
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import FleetManagementDashboard from "@/components/dashboard/FleetManagementDashboard";

const Index = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <FleetManagementDashboard />;
};

export default Index;
