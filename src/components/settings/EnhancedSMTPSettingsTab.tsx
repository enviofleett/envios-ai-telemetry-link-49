
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useGenericSMTPService } from '@/hooks/useGenericSMTPService';
import GenericSMTPForm from './smtp/GenericSMTPForm';
import SMTPConfigurationManager from './smtp/SMTPConfigurationManager';
import SMTPMonitoringTab from './smtp/SMTPMonitoringTab';
import { Mail, AlertTriangle, CheckCircle, Settings } from 'lucide-react';

const EnhancedSMTPSettingsTab: React.FC = () => {
  const {
    smtpConfigs,
    isLoading,
    saveConfig,
    testConnection,
    deleteConfig,
    toggleActive,
    isSaving,
    isTesting
  } = useGenericSMTPService();

  const [editingConfig, setEditingConfig] = useState<any>(null);

  const handleSaveConfig = async (config: any) => {
    try {
      await saveConfig(config);
      setEditingConfig(null);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleTestConnection = async (config: any) => {
    const testConfig = {
      host: config.host,
      port: config.port,
      username: config.username,
      password: config.password,
      sender_email: config.sender_email,
      sender_name: config.sender_name,
      encryption_type: config.encryption_type
    };

    try {
      await testConnection(testConfig);
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleEditConfig = (config: any) => {
    setEditingConfig(config);
  };

  const handleDeleteConfig = async (configId: string) => {
    try {
      await deleteConfig(configId);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleToggleActive = async (configId: string, isActive: boolean) => {
    try {
      await toggleActive({ configId, isActive });
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const activeConfig = smtpConfigs.find(config => config.is_active);
  const hasConfigs = smtpConfigs.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Configuration
          {activeConfig && (
            <Badge variant="default" className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Active
            </Badge>
          )}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Configure any 3rd-party SMTP provider for reliable email delivery
        </p>
      </div>

      {/* Status Alert */}
      {!hasConfigs && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No SMTP configuration found. Please add a configuration below to enable email functionality.
          </AlertDescription>
        </Alert>
      )}

      {hasConfigs && !activeConfig && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You have SMTP configurations but none are active. Please activate a configuration to enable email sending.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="configuration" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="management">Management</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="configuration" className="space-y-6">
          <GenericSMTPForm
            onSave={handleSaveConfig}
            onTest={handleTestConnection}
            isSaving={isSaving}
            isTesting={isTesting}
          />
        </TabsContent>

        <TabsContent value="management" className="space-y-6">
          <SMTPConfigurationManager
            configs={smtpConfigs}
            onEdit={handleEditConfig}
            onDelete={handleDeleteConfig}
            onToggleActive={handleToggleActive}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <SMTPMonitoringTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedSMTPSettingsTab;
