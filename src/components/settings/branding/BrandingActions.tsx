import React from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, Save } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

interface BrandingActionsProps {
  onReset: () => void;
  onSave: () => void;
  isLoading?: boolean;
}

const BrandingActions: React.FC<BrandingActionsProps> = ({ 
  onReset, 
  onSave, 
  isLoading = false 
}) => {
  return (
    <div className="flex items-center justify-between pt-6 border-t">
      <Button
        variant="outline"
        onClick={onReset}
        disabled={isLoading}
        className="flex items-center gap-2"
      >
        <RotateCcw className="h-4 w-4" />
        Reset to Default
      </Button>
      <div className="flex items-center gap-3">
        <Button
          onClick={onSave}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
        {isLoading && <LoadingSpinner />}
      </div>
    </div>
  );
};

export default BrandingActions;
