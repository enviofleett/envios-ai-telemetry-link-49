
import React from 'react';
import { Button } from '@/components/ui/button';
import { UpgradeModal } from '@/components/packages/UpgradeModal';

interface FeatureUpgradeCTAProps {
  feature: string;
  children?: React.ReactNode;
}

export const FeatureUpgradeCTA: React.FC<FeatureUpgradeCTAProps> = ({ feature, children }) => {
  const [showModal, setShowModal] = React.useState(false);

  return (
    <>
      <Button variant="default" onClick={() => setShowModal(true)}>{children || `Upgrade to unlock ${feature}`}</Button>
      <UpgradeModal open={showModal} onClose={() => setShowModal(false)} feature={feature} />
    </>
  );
};
