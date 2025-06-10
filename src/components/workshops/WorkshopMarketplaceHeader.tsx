
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface WorkshopMarketplaceHeaderProps {
  onRegisterWorkshop: () => void;
}

const WorkshopMarketplaceHeader: React.FC<WorkshopMarketplaceHeaderProps> = ({
  onRegisterWorkshop
}) => {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold">Workshop Marketplace</h1>
        <p className="text-muted-foreground">
          Find and connect with vehicle maintenance workshops
        </p>
      </div>
      <Button onClick={onRegisterWorkshop}>
        <Plus className="h-4 w-4 mr-2" />
        Register Workshop
      </Button>
    </div>
  );
};

export default WorkshopMarketplaceHeader;
