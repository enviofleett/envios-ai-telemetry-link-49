
import React from 'react';

interface FeatureRestrictedLinkProps {
  featureId: string;
  children: React.ReactNode;
}

const FeatureRestrictedLink: React.FC<FeatureRestrictedLinkProps> = ({ 
  featureId, 
  children 
}) => {
  // For now, all features are available
  // This component can be enhanced later with actual feature restriction logic
  return <>{children}</>;
};

export { FeatureRestrictedLink };
