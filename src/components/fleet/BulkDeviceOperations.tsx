
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Settings, Tag, Trash2, Power, PowerOff } from 'lucide-react';
import { enhancedDeviceApi } from '@/services/enhancedDeviceManagementApi';
import { useToast } from '@/hooks/use-toast';
import { BulkOperationRequest, DeviceTag } from '@/types/device-management';

interface BulkDeviceOperationsProps {
  selectedDevices: string[];
  onClearSelection: () => void;
  deviceTags: DeviceTag[];
}

const BulkDeviceOperations: React.FC<BulkDeviceOperationsProps> = ({
  selectedDevices,
  onClearSelection,
  deviceTags
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [operation, setOperation] = useState<BulkOperationRequest['operation']>('enable');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const bulkOperationMutation = useMutation({
    mutationFn: (request: BulkOperationRequest) => enhancedDeviceApi.performBulkOperation(request),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['vehicles-management'] });
      setIsDialogOpen(false);
      onClearSelection();
      setConfirmDelete(false);
      
      toast({
        title: 'Bulk operation completed',
        description: `${result.success} devices processed successfully${result.failed > 0 ? `, ${result.failed} failed` : ''}`,
        variant: result.failed > 0 ? 'destructive' : 'default'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Bulk operation failed',
        description: error.message,
        variant: 'destructive'
      });
    },
  });

  const handleSubmit = () => {
    if (operation === 'delete' && !confirmDelete) {
      toast({
        title: 'Confirmation required',
        description: 'Please confirm the deletion by checking the checkbox',
        variant: 'destructive'
      });
      return;
    }

    const request: BulkOperationRequest = {
      operation,
      device_ids: selectedDevices,
      data: operation === 'assign_tags' ? { tagIds: selectedTags } : undefined
    };

    bulkOperationMutation.mutate(request);
  };

  const operationConfig = {
    enable: { 
      icon: Power, 
      title: 'Enable Devices', 
      description: 'Enable the selected devices',
      variant: 'default' as const
    },
    disable: { 
      icon: PowerOff, 
      title: 'Disable Devices', 
      description: 'Disable the selected devices',
      variant: 'secondary' as const
    },
    assign_tags: { 
      icon: Tag, 
      title: 'Assign Tags', 
      description: 'Assign tags to the selected devices',
      variant: 'default' as const
    },
    delete: { 
      icon: Trash2, 
      title: 'Delete Devices', 
      description: 'Permanently delete the selected devices from GP51',
      variant: 'destructive' as const
    }
  };

  const currentConfig = operationConfig[operation];
  const IconComponent = currentConfig.icon;

  if (selectedDevices.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-white rounded-lg shadow-lg border p-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Badge variant="default" className="px-3 py-1">
            {selectedDevices.length} devices selected
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="default" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Bulk Actions
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Bulk Device Operations</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  Performing operation on {selectedDevices.length} selected devices
                </div>

                <div className="space-y-2">
                  <Label htmlFor="operation">Operation</Label>
                  <Select value={operation} onValueChange={(value: any) => setOperation(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="enable">Enable Devices</SelectItem>
                      <SelectItem value="disable">Disable Devices</SelectItem>
                      <SelectItem value="assign_tags">Assign Tags</SelectItem>
                      <SelectItem value="delete">Delete Devices</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {operation === 'assign_tags' && (
                  <div className="space-y-2">
                    <Label>Select Tags</Label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {deviceTags.map((tag) => (
                        <div key={tag.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={tag.id}
                            checked={selectedTags.includes(tag.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedTags([...selectedTags, tag.id]);
                              } else {
                                setSelectedTags(selectedTags.filter(id => id !== tag.id));
                              }
                            }}
                          />
                          <Label htmlFor={tag.id} className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: tag.color }}
                            />
                            {tag.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {operation === 'delete' && (
                  <div className="space-y-3 p-3 border border-red-200 rounded-lg bg-red-50">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-red-800">
                          Warning: This action cannot be undone
                        </div>
                        <div className="text-sm text-red-700">
                          Deleting devices will permanently remove them from the GP51 system.
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="confirmDelete"
                        checked={confirmDelete}
                        onCheckedChange={setConfirmDelete}
                      />
                      <Label htmlFor="confirmDelete" className="text-sm text-red-800">
                        I understand and want to delete these devices
                      </Label>
                    </div>
                  </div>
                )}

                <div className="flex justify-between gap-2 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant={currentConfig.variant}
                    onClick={handleSubmit}
                    disabled={bulkOperationMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    <IconComponent className="h-4 w-4" />
                    {bulkOperationMutation.isPending ? 'Processing...' : currentConfig.title}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" size="sm" onClick={onClearSelection}>
            Clear Selection
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BulkDeviceOperations;
