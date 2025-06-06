
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import NewDashboard from "@/components/dashboard/NewDashboard";

const Index = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <NewDashboard />;
};

export default Index;
