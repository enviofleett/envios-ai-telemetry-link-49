
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useFullSystemImport } from '@/hooks/useFullSystemImport';
import { AlertTriangle, Database, Users, Car } from 'lucide-react';
import type { SystemImportOptions } from '@/types/system-import';

interface FullGP51ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FullGP51ImportDialog: React.FC<FullGP51ImportDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const [adminEmail, setAdminEmail] = useState('');
  const [batchSize, setBatchSize] = useState(50);
  const [performCleanup, setPerformCleanup] = useState(false);
  const { startFullSystemImport, isImporting } = useFullSystemImport();

  const handleStartImport = () => {
    const options: SystemImportOptions = {
      importType: 'complete_system',
      performCleanup,
      preserveAdminEmail: adminEmail,
      batchSize,
      // Required properties with defaults
      importUsers: true,
      importDevices: true,
      conflictResolution: 'overwrite'
    };

    startFullSystemImport(options);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Full GP51 System Import
          </DialogTitle>
          <DialogDescription>
            Import all users and vehicles from GP51 system. This is a comprehensive operation that will sync all data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800">Important Notice</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  This operation will import all users and vehicles from GP51. 
                  Existing data may be overwritten based on conflict resolution settings.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="adminEmail">Preserve Admin Email</Label>
              <Input
                id="adminEmail"
                type="email"
                placeholder="admin@company.com"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Admin user with this email will be preserved during import
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="batchSize">Batch Size</Label>
              <Input
                id="batchSize"
                type="number"
                min="10"
                max="100"
                value={batchSize}
                onChange={(e) => setBatchSize(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Number of records to process at once (10-100)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="performCleanup"
              checked={performCleanup}
              onCheckedChange={(checked) => setPerformCleanup(checked === true)}
            />
            <Label htmlFor="performCleanup" className="text-sm">
              Perform database cleanup before import
            </Label>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>Will import all GP51 users</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Car className="h-4 w-4" />
              <span>Will import all GP51 vehicles</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleStartImport}
              disabled={isImporting || !adminEmail}
            >
              {isImporting ? 'Starting Import...' : 'Start Full Import'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FullGP51ImportDialog;
