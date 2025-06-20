
import React from "react";
import FeatureGate from "@/components/auth/FeatureGate";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";

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
  const { user } = useUnifiedAuth();

  // For now, show all links since we don't have role checking in UnifiedAuth yet
  // TODO: Add role checking when UnifiedAuth supports it
  if (user) {
    return <>{children}</>;
  }

  return (
    <FeatureGate featureId={featureId} fallback={fallback}>
      {children}
    </FeatureGate>
  );
}
