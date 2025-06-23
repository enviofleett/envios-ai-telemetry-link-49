
import React from 'react';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { useUserPackage } from '@/hooks/useUserPackage';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { FeatureUpgradeCTA } from '@/components/common/FeatureUpgradeCTA';

interface FeatureAccessGateProps {
  featureId: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
}

const FeatureAccessGate: React.FC<FeatureAccessGateProps> = ({
  featureId,
  children,
  fallback,
  showUpgradePrompt = true
}) => {
  const { user } = useUnifiedAuth();
  const { data: userPackage, isLoading: packageLoading } = useUserPackage(user?.id);
  const { hasFeature, isLoading: featuresLoading } = useFeatureAccess(userPackage?.id);

  if (packageLoading || featuresLoading) {
    return (
      <div className="animate-pulse bg-gray-200 rounded h-4 w-full"></div>
    );
  }

  if (!hasFeature(featureId)) {
    if (showUpgradePrompt) {
      return (
        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h3 className="font-medium text-gray-900 mb-2">Feature Locked</h3>
          <p className="text-sm text-gray-600 mb-3">
            This feature requires a higher tier package.
          </p>
          <FeatureUpgradeCTA feature={featureId}>
            Upgrade Package
          </FeatureUpgradeCTA>
        </div>
      );
    }
    return fallback || null;
  }

  return <>{children}</>;
};

export default FeatureAccessGate;
