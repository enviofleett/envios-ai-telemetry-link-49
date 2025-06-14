
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkle } from 'lucide-react';

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  feature?: string;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ open, onClose, feature }) => (
  <Dialog open={open} onOpenChange={onClose}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle className="flex gap-2 items-center">
          <Sparkle className="text-primary" />
          Upgrade Required
        </DialogTitle>
      </DialogHeader>
      <div className="py-4">
        <p>
          {feature
            ? <>To access <Badge className="mx-1">{feature}</Badge>, please upgrade your subscription package.</>
            : <>Upgrade your package to unlock more features and higher usage limits.</>
          }
        </p>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>Close</Button>
        {/* Optional "View Plans" button */}
        <Button asChild>
          <a href="/settings/billing">View Plans</a>
        </Button>
      </div>
    </DialogContent>
  </Dialog>
);
