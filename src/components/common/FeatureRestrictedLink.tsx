
import React from "react";
import FeatureGate from "@/components/auth/FeatureGate";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Wrap any navigation link with this component to restrict its visibility or enablement
 * based on a required feature ID.
 */
export function FeatureRestrictedLink({
  featureId,
  children,
  fallback = null,
}: {
  featureId: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { isAdmin } = useAuth();

  // Admins always see all navigation links.
  if (isAdmin) return <>{children}</>;

  return (
    <FeatureGate featureId={featureId} fallback={fallback}>
      {children}
    </FeatureGate>
  );
}
