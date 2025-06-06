
import React from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, Eye, Save } from 'lucide-react';

interface BrandingActionsProps {
  onReset: () => void;
  onSave: () => void;
}

const BrandingActions: React.FC<BrandingActionsProps> = ({
  onReset,
  onSave
}) => {
  return (
    <div className="flex items-center justify-between pt-6 border-t">
      <Button
        variant="outline"
        onClick={onReset}
        className="flex items-center gap-2"
      >
        <RotateCcw className="h-4 w-4" />
        Reset to Defaults
      </Button>
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          className="flex items-center gap-2"
        >
          <Eye className="h-4 w-4" />
          Preview Changes
        </Button>
        <Button
          onClick={onSave}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          Apply Changes
        </Button>
      </div>
    </div>
  );
};

export default BrandingActions;
