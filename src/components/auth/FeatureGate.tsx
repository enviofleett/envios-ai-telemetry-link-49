
import React from "react";
import { useUser } from "@/hooks/useUser"; // Needs to exist: provides { user }
import { useUserPackage } from "@/hooks/useUserPackage";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";

/**
 * Usage:
 * <FeatureGate featureId="geofencing">
 *   ... content only visible to users with 'geofencing' in their active package ...
 * </FeatureGate>
 */
export default function FeatureGate({
  featureId,
  children,
  fallback = null,
}: {
  featureId: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { user } = useUser(); // must exist, or replace with your auth context
  const { data: pkg, isLoading: pkgLoading } = useUserPackage(user?.id);
  const { hasFeature, isLoading: featuresLoading } = useFeatureAccess(pkg?.id);

  if (pkgLoading || featuresLoading) return null;
  if (!hasFeature(featureId)) return fallback;
  return <>{children}</>;
}
