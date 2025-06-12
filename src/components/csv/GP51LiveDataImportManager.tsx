
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Satellite, 
  Users, 
  Car, 
  CheckCircle, 
  XCircle, 
  Clock, 
  RefreshCw,
  Download,
  AlertTriangle
} from 'lucide-react';
import { useGP51LiveImport } from '@/hooks/useGP51LiveImport';
import GP51ConnectionStatus from './GP51ConnectionStatus';
import GP51DataSelector from './GP51DataSelector';
import GP51ImportPreview from './GP51ImportPreview';
import GP51ImportProgress from './GP51ImportProgress';

const GP51LiveDataImportManager: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('connection');
  const {
    connectionStatus,
    liveData,
    importConfig,
    importJob,
    isLoading,
    isImporting,
    checkConnection,
    fetchLiveData,
    updateImportConfig,
    startImport,
    clearData
  } = useGP51LiveImport();

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const canProceedToDataSelection = connectionStatus?.connected && !isLoading;
  const canProceedToPreview = liveData && Object.keys(liveData).length > 0;
  const canStartImport = canProceedToPreview && importConfig;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Satellite className="h-5 w-5 text-green-600" />
            GP51 Data Import (Legacy)
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Legacy GP51 data import functionality. For comprehensive import, use the main GP51 Import feature.
          </p>
        </div>
        
        {connectionStatus?.connected && (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Connected to GP51
          </Badge>
        )}
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          This is the legacy GP51 import interface. For comprehensive vehicle import (including offline and inactive vehicles), 
          please use the main GP51 Import feature in the Integration settings.
        </AlertDescription>
      </Alert>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="connection" className="flex items-center gap-2">
            <Satellite className="h-4 w-4" />
            Connection
          </TabsTrigger>
          <TabsTrigger 
            value="selection" 
            disabled={!canProceedToDataSelection}
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            Data Selection
          </TabsTrigger>
          <TabsTrigger 
            value="preview" 
            disabled={!canProceedToPreview}
            className="flex items-center gap-2"
          >
            <Car className="h-4 w-4" />
            Preview & Import
          </TabsTrigger>
          <TabsTrigger 
            value="progress" 
            disabled={!importJob}
            className="flex items-center gap-2"
          >
            <Clock className="h-4 w-4" />
            Progress
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connection" className="space-y-4">
          <GP51ConnectionStatus 
            connectionStatus={connectionStatus}
            isLoading={isLoading}
            onTestConnection={checkConnection}
            onProceed={() => canProceedToDataSelection && setActiveTab('selection')}
          />
        </TabsContent>

        <TabsContent value="selection" className="space-y-4">
          <GP51DataSelector 
            liveData={liveData}
            importConfig={importConfig}
            isLoading={isLoading}
            onConfigChange={updateImportConfig}
            onFetchData={fetchLiveData}
            onProceed={() => canProceedToPreview && setActiveTab('preview')}
          />
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <GP51ImportPreview 
            liveData={liveData}
            importConfig={importConfig}
            isImporting={isImporting}
            onStartImport={startImport}
            onBack={() => setActiveTab('selection')}
            onProceedToProgress={() => setActiveTab('progress')}
          />
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <GP51ImportProgress 
            importJob={importJob}
            onReset={() => {
              clearData();
              setActiveTab('connection');
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={checkConnection}
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Test Connection
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={clearData}
              disabled={isLoading || isImporting}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Clear Data
            </Button>

            {liveData && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Export current live data as JSON for backup
                  const dataStr = JSON.stringify(liveData, null, 2);
                  const dataBlob = new Blob([dataStr], { type: 'application/json' });
                  const url = URL.createObjectURL(dataBlob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `gp51-live-data-${new Date().toISOString().split('T')[0]}.json`;
                  link.click();
                  URL.revokeObjectURL(url);
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Status Information */}
      {connectionStatus && !connectionStatus.connected && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            GP51 connection is not established. Please check your GP51 integration settings 
            in Admin Settings and ensure you have valid credentials configured.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default GP51LiveDataImportManager;
