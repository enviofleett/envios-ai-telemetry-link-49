
import React from "react";
import { useStableAuth } from "@/hooks/useStableAuth";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Navigate, useLocation } from "react-router-dom";

// This guard can be extended later with marketplace-specific roles (e.g., merchant)
interface Props {
  children: React.ReactNode;
  requireRole?: "subscriber" | "merchant" | "admin";
}

const MarketplaceAuthGuard: React.FC<Props> = ({
  children,
  requireRole,
}) => {
  const auth = useStableAuth();
  const location = useLocation();

  // Show loading while auth state is resolving
  if (auth.loading || auth.isCheckingRole) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <LoadingSpinner />
      </div>
    );
  }

  // Not logged in? Redirect to login, preserving return path
  if (!auth.user) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  // Role enforcement for marketplace (optional, can be enhanced for merchant portal)
  if (
    requireRole &&
    auth.userRole &&
    requireRole !== auth.userRole &&
    !(requireRole === "subscriber" && !["merchant", "admin"].includes(auth.userRole))
  ) {
    // User lacks required role -- redirect to main dashboard or fallback
    return <Navigate to="/" replace />;
  }

  // All checks OK: Render children
  return <>{children}</>;
};

export default MarketplaceAuthGuard;

