
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Upload, AlertTriangle } from 'lucide-react';
import { GP51LiveData, GP51LiveImportConfig } from '@/hooks/useGP51LiveImport';

interface GP51ImportPreviewProps {
  liveData: GP51LiveData | null;
  importConfig: GP51LiveImportConfig | null;
  isImporting: boolean;
  onStartImport: () => void;
  onBack: () => void;
  onProceedToProgress: () => void;
}

const GP51ImportPreview: React.FC<GP51ImportPreviewProps> = ({
  liveData,
  importConfig,
  isImporting,
  onStartImport,
  onBack,
  onProceedToProgress
}) => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>GP51 Import Preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              GP51 import preview is temporarily unavailable while the integration service is being rebuilt.
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button onClick={onBack} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Selection
            </Button>
            <Button onClick={onStartImport} disabled={isImporting}>
              <Upload className="h-4 w-4 mr-2" />
              Import Unavailable
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GP51ImportPreview;
