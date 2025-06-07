
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { gdprComplianceService, PrivacySettings } from '@/services/security/GDPRComplianceService';
import { Shield, Download, Trash2, FileText, Eye } from 'lucide-react';

export const PrivacySettingsTab: React.FC = () => {
  const [settings, setSettings] = useState<PrivacySettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPrivacySettings();
  }, []);

  const loadPrivacySettings = async () => {
    try {
      // In real implementation, get current user ID from auth context
      const userId = 'current-user-id';
      const userSettings = await gdprComplianceService.getPrivacySettings(userId);
      setSettings(userSettings);
    } catch (error) {
      console.error('Error loading privacy settings:', error);
      toast({
        title: "Error",
        description: "Failed to load privacy settings",
        variant: "destructive"
      });
    }
  };

  const updateSettings = async (newSettings: Partial<PrivacySettings>) => {
    if (!settings) return;

    setIsLoading(true);
    try {
      const updatedSettings = { ...settings, ...newSettings };
      await gdprComplianceService.updatePrivacySettings(updatedSettings);
      setSettings(updatedSettings);
      
      toast({
        title: "Settings Updated",
        description: "Your privacy preferences have been saved",
      });
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      toast({
        title: "Error",
        description: "Failed to update privacy settings",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const requestDataExport = async () => {
    try {
      const userData = await gdprComplianceService.processAccessRequest(settings?.userId || '');
      
      const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `my-data-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: "Data Export Ready",
        description: "Your data has been exported and downloaded",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export your data",
        variant: "destructive"
      });
    }
  };

  const requestDataDeletion = async () => {
    if (!confirm('Are you sure you want to request deletion of your data? This action cannot be undone.')) {
      return;
    }

    try {
      const requestId = await gdprComplianceService.submitDataSubjectRequest({
        type: 'erasure',
        userId: settings?.userId || ''
      });
      
      toast({
        title: "Deletion Request Submitted",
        description: `Request ID: ${requestId}. We will process this within 30 days.`,
      });
    } catch (error) {
      toast({
        title: "Request Failed",
        description: "Failed to submit deletion request",
        variant: "destructive"
      });
    }
  };

  if (!settings) {
    return <div>Loading privacy settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Privacy & Data Protection</h3>
        <p className="text-sm text-muted-foreground">
          Manage your data processing preferences and exercise your rights under GDPR
        </p>
      </div>

      {/* Consent Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Data Processing Consent
          </CardTitle>
          <CardDescription>
            Control how your data is processed and used
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Essential Data Processing</Label>
              <p className="text-sm text-muted-foreground">
                Required for core fleet management functionality
              </p>
            </div>
            <Badge variant="secondary">Required</Badge>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="location-tracking">Location Tracking</Label>
              <p className="text-sm text-muted-foreground">
                Enable real-time vehicle location tracking and geofencing
              </p>
            </div>
            <Switch
              id="location-tracking"
              checked={settings.locationTrackingConsent}
              onCheckedChange={(checked) => updateSettings({ locationTrackingConsent: checked })}
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="analytics">Analytics & Performance</Label>
              <p className="text-sm text-muted-foreground">
                Help improve our services through usage analytics
              </p>
            </div>
            <Switch
              id="analytics"
              checked={settings.analyticsConsent}
              onCheckedChange={(checked) => updateSettings({ analyticsConsent: checked })}
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="marketing">Marketing Communications</Label>
              <p className="text-sm text-muted-foreground">
                Receive product updates and promotional content
              </p>
            </div>
            <Switch
              id="marketing"
              checked={settings.marketingConsent}
              onCheckedChange={(checked) => updateSettings({ marketingConsent: checked })}
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Retention */}
      <Card>
        <CardHeader>
          <CardTitle>Data Retention Preferences</CardTitle>
          <CardDescription>
            Control how long your data is stored
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="retention-period">Data Retention Period</Label>
              <p className="text-sm text-muted-foreground">
                How long to keep your historical data
              </p>
            </div>
            <Select
              value={settings.dataRetentionPeriod.toString()}
              onValueChange={(value) => updateSettings({ dataRetentionPeriod: parseInt(value) })}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="365">1 Year</SelectItem>
                <SelectItem value="1095">3 Years</SelectItem>
                <SelectItem value="1825">5 Years</SelectItem>
                <SelectItem value="2555">7 Years (Default)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="export-format">Data Export Format</Label>
              <p className="text-sm text-muted-foreground">
                Preferred format for data exports
              </p>
            </div>
            <Select
              value={settings.dataExportFormat}
              onValueChange={(value: 'json' | 'csv') => updateSettings({ dataExportFormat: value })}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Data Subject Rights */}
      <Card>
        <CardHeader>
          <CardTitle>Your Data Rights</CardTitle>
          <CardDescription>
            Exercise your rights under GDPR (General Data Protection Regulation)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              onClick={requestDataExport}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export My Data
            </Button>

            <Button
              variant="outline"
              onClick={() => window.open('/privacy-policy', '_blank')}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Privacy Policy
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                // In real implementation, open data view modal
                toast({
                  title: "Data Access",
                  description: "Contact support for detailed data access requests",
                });
              }}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              View My Data
            </Button>

            <Button
              variant="destructive"
              onClick={requestDataDeletion}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Request Deletion
            </Button>
          </div>

          <div className="mt-4 p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Important Information</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Data deletion requests are processed within 30 days</li>
              <li>• Some data may be retained for legal obligations</li>
              <li>• Data exports include all personal data we hold about you</li>
              <li>• You can withdraw consent at any time</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
