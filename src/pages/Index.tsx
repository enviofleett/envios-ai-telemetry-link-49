
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import ProfessionalDashboard from "@/components/dashboard/ProfessionalDashboard";

const Index = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <ProfessionalDashboard />;
};

export default Index;
