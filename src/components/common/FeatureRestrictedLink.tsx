
import React from "react";
import FeatureGate from "@/components/auth/FeatureGate";

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
  // You could also add a prop for "upgrade" CTA here if desired
  return (
    <FeatureGate featureId={featureId} fallback={fallback}>
      {children}
    </FeatureGate>
  );
}
