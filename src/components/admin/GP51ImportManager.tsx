
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useUnifiedImport } from '@/hooks/useUnifiedImport';
import { Download, Upload, Users, Car } from 'lucide-react';
import type { GP51ImportOptions } from '@/types/system-import';

const GP51ImportManager: React.FC = () => {
  const [importOptions, setImportOptions] = useState<GP51ImportOptions>({
    importUsers: true,
    importDevices: true,
    conflictResolution: 'overwrite',
    batchSize: 50
  });
  
  const [usernames, setUsernames] = useState('');
  const { preview, isLoadingPreview, isImporting, fetchPreview, startImport } = useUnifiedImport();

  const handleImportOptionsChange = (key: keyof GP51ImportOptions, value: any) => {
    setImportOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleStartImport = async () => {
    const options: GP51ImportOptions = {
      ...importOptions,
      usernames: usernames ? usernames.split('\n').map(u => u.trim()).filter(Boolean) : undefined
    };
    
    await startImport(options);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            GP51 Data Import
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Import Options</h3>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="importUsers"
                    checked={importOptions.importUsers}
                    onCheckedChange={(checked) => handleImportOptionsChange('importUsers', checked)}
                  />
                  <Label htmlFor="importUsers" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Import Users
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="importDevices"
                    checked={importOptions.importDevices}
                    onCheckedChange={(checked) => handleImportOptionsChange('importDevices', checked)}
                  />
                  <Label htmlFor="importDevices" className="flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    Import Devices
                  </Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="conflictResolution">Conflict Resolution</Label>
                <Select 
                  value={importOptions.conflictResolution} 
                  onValueChange={(value: 'skip' | 'overwrite' | 'merge') => 
                    handleImportOptionsChange('conflictResolution', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="skip">Skip existing records</SelectItem>
                    <SelectItem value="overwrite">Overwrite existing records</SelectItem>
                    <SelectItem value="merge">Merge data where possible</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="batchSize">Batch Size</Label>
                <Input
                  id="batchSize"
                  type="number"
                  min="10"
                  max="100"
                  value={importOptions.batchSize || 50}
                  onChange={(e) => handleImportOptionsChange('batchSize', Number(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Specific Users (Optional)</h3>
              <div className="space-y-2">
                <Label htmlFor="usernames">GP51 Usernames</Label>
                <textarea
                  id="usernames"
                  className="w-full min-h-[120px] p-3 border rounded-md"
                  placeholder="Enter usernames, one per line"
                  value={usernames}
                  onChange={(e) => setUsernames(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to import all users, or specify usernames to import only those users
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={fetchPreview}
              disabled={isLoadingPreview}
              variant="outline"
            >
              {isLoadingPreview ? 'Loading Preview...' : 'Generate Preview'}
            </Button>
            
            <Button
              onClick={handleStartImport}
              disabled={isImporting || !preview}
            >
              {isImporting ? 'Importing...' : 'Start Import'}
            </Button>
          </div>

          {preview && (
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Import Preview</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>Users to import: {preview.data?.summary.users || 0}</div>
                <div>Vehicles to import: {preview.data?.summary.vehicles || 0}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GP51ImportManager;
