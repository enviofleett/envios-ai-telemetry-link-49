
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowRight, Users, Car, AlertTriangle } from 'lucide-react';
import { GP51LiveData, GP51LiveImportConfig } from '@/hooks/useGP51LiveImport';

interface GP51DataSelectorProps {
  liveData: GP51LiveData | null;
  importConfig: GP51LiveImportConfig | null;
  isLoading: boolean;
  onConfigChange: (config: Partial<GP51LiveImportConfig>) => void;
  onFetchData: () => void;
  onProceed: () => void;
}

const GP51DataSelector: React.FC<GP51DataSelectorProps> = ({
  liveData,
  importConfig,
  isLoading,
  onConfigChange,
  onFetchData,
  onProceed
}) => {
  const hasData = liveData && Object.keys(liveData).length > 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            GP51 Data Selection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              GP51 data selection is temporarily unavailable while the integration service is being rebuilt.
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button onClick={onFetchData} disabled={isLoading} variant="outline">
              Data Selection Unavailable
            </Button>
            <Button onClick={onProceed} disabled={!hasData}>
              Proceed to Preview
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GP51DataSelector;
