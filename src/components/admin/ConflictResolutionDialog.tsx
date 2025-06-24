
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Users, Car, Check, X } from 'lucide-react';
import { SyncConflict } from '@/services/gp51/GP51DataSyncManager';

interface ConflictResolutionDialogProps {
  conflict: SyncConflict | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResolve: (resolution: 'prefer_local' | 'prefer_remote' | 'merge') => void;
}

const ConflictResolutionDialog: React.FC<ConflictResolutionDialogProps> = ({
  conflict,
  open,
  onOpenChange,
  onResolve,
}) => {
  const [selectedResolution, setSelectedResolution] = useState<'prefer_local' | 'prefer_remote' | 'merge' | null>(null);

  if (!conflict) return null;

  const getSeverityColor = (severity: SyncConflict['severity']) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'critical': return 'bg-red-200 text-red-900';
    }
  };

  const getEntityIcon = (entityType: SyncConflict['entityType']) => {
    switch (entityType) {
      case 'user': return <Users className="h-4 w-4" />;
      case 'vehicle': return <Car className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const handleResolve = () => {
    if (selectedResolution) {
      onResolve(selectedResolution);
      onOpenChange(false);
      setSelectedResolution(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Resolve Data Conflict
          </DialogTitle>
          <DialogDescription>
            Choose how to resolve this data synchronization conflict.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Conflict Summary */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              {getEntityIcon(conflict.entityType)}
              <span className="font-medium capitalize">{conflict.entityType} Conflict</span>
            </div>
            <Badge className={getSeverityColor(conflict.severity)}>
              {conflict.severity} severity
            </Badge>
            <Badge variant="outline">
              {conflict.conflictType}
            </Badge>
            <div className="text-sm text-gray-500 ml-auto">
              Detected: {conflict.detectedAt.toLocaleString()}
            </div>
          </div>

          {/* Data Comparison */}
          <div className="grid grid-cols-2 gap-4">
            <Card className={`cursor-pointer transition-colors ${
              selectedResolution === 'prefer_local' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
            }`} onClick={() => setSelectedResolution('prefer_local')}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <span>Local Data</span>
                    {selectedResolution === 'prefer_local' && <Check className="h-4 w-4 text-blue-600" />}
                  </h4>
                  <Badge variant="outline">Current</Badge>
                </div>
                <div className="space-y-2 text-sm">
                  {Object.entries(conflict.localData).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="font-medium text-gray-600">{key}:</span>
                      <span className="text-gray-900">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className={`cursor-pointer transition-colors ${
              selectedResolution === 'prefer_remote' ? 'ring-2 ring-green-500 bg-green-50' : 'hover:bg-gray-50'
            }`} onClick={() => setSelectedResolution('prefer_remote')}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <span>Remote Data (GP51)</span>
                    {selectedResolution === 'prefer_remote' && <Check className="h-4 w-4 text-green-600" />}
                  </h4>
                  <Badge variant="outline">Incoming</Badge>
                </div>
                <div className="space-y-2 text-sm">
                  {Object.entries(conflict.remoteData).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="font-medium text-gray-600">{key}:</span>
                      <span className="text-gray-900">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Manual Merge Option */}
          {conflict.severity !== 'low' && (
            <Card className={`cursor-pointer transition-colors ${
              selectedResolution === 'merge' ? 'ring-2 ring-purple-500 bg-purple-50' : 'hover:bg-gray-50'
            }`} onClick={() => setSelectedResolution('merge')}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-medium">Manual Merge</h4>
                  {selectedResolution === 'merge' && <Check className="h-4 w-4 text-purple-600" />}
                </div>
                <p className="text-sm text-gray-600">
                  Manually combine data from both sources. This option allows you to selectively choose which fields to keep from each source.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Resolution Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-gray-500">
              {conflict.autoResolvable && (
                <span className="flex items-center gap-1">
                  <Check className="h-3 w-3 text-green-500" />
                  This conflict can be auto-resolved
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleResolve}
                disabled={!selectedResolution}
                className="min-w-[120px]"
              >
                {selectedResolution === 'prefer_local' && 'Keep Local'}
                {selectedResolution === 'prefer_remote' && 'Keep Remote'}
                {selectedResolution === 'merge' && 'Manual Merge'}
                {!selectedResolution && 'Select Option'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConflictResolutionDialog;
