
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Save, RotateCcw, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BrandingSaveControlsProps {
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  changedFields: string[];
  onSave: () => Promise<boolean>;
  onDiscard: () => void;
  disabled?: boolean;
}

const BrandingSaveControls: React.FC<BrandingSaveControlsProps> = ({
  hasUnsavedChanges,
  isSaving,
  changedFields,
  onSave,
  onDiscard,
  disabled = false
}) => {
  // Add keyboard shortcut for save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (hasUnsavedChanges && !isSaving && !disabled) {
          onSave();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [hasUnsavedChanges, isSaving, disabled, onSave]);

  if (!hasUnsavedChanges && !isSaving) {
    return null;
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            <div>
              <p className="font-medium text-orange-800">
                Unsaved Changes
              </p>
              <p className="text-sm text-orange-600">
                {changedFields.length} field(s) modified
              </p>
            </div>
            <div className="flex flex-wrap gap-1">
              {changedFields.slice(0, 3).map(field => (
                <Badge key={field} variant="outline" className="text-xs">
                  {field.replace(/_/g, ' ')}
                </Badge>
              ))}
              {changedFields.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{changedFields.length - 3} more
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onDiscard}
              disabled={isSaving || disabled}
              className="text-red-600 hover:text-red-700"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Discard
            </Button>
            <Button
              onClick={onSave}
              disabled={isSaving || disabled}
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="h-4 w-4 mr-1" />
              {isSaving ? 'Saving...' : 'Save All Changes'}
            </Button>
          </div>
        </div>
        
        <div className="mt-2 text-xs text-orange-600">
          Press Ctrl+S to save quickly
        </div>
      </CardContent>
    </Card>
  );
};

export default BrandingSaveControls;
