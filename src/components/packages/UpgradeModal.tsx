
import React from 'react';
import PackageUpgradeDialog from './PackageUpgradeDialog';

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  feature?: string;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ open, onClose, feature }) => {
  return (
    <PackageUpgradeDialog
      open={open}
      onOpenChange={(isOpen) => !isOpen && onClose()}
      currentFeature={feature}
    />
  );
};
