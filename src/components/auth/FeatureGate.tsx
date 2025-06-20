
import React from "react";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";
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
  const { user } = useUnifiedAuth();
  const { data: pkg, isLoading: pkgLoading } = useUserPackage(user?.id);
  const { hasFeature, isLoading: featuresLoading } = useFeatureAccess(pkg?.id);

  // For now, show all features since we don't have admin role checking in UnifiedAuth yet
  // TODO: Add proper admin bypass when UnifiedAuth supports role checking
  
  if (pkgLoading || featuresLoading) return null;
  if (!hasFeature(featureId)) return fallback;
  return <>{children}</>;
}
