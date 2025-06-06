
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Trash2, 
  UserCheck, 
  Car, 
  Download, 
  Play, 
  Pause,
  Settings,
  CheckSquare,
  AlertTriangle
} from 'lucide-react';

interface BulkOperation {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  requiresConfirmation: boolean;
  estimatedDuration: string;
}

interface EnhancedBulkOperationsProps {
  selectedUserIds: string[];
  onBulkDelete: () => void;
  onDeselectAll: () => void;
}

const BULK_OPERATIONS: BulkOperation[] = [
  {
    id: 'delete',
    name: 'Delete Users',
    description: 'Permanently remove selected users from the system',
    icon: Trash2,
    requiresConfirmation: true,
    estimatedDuration: '2-5 minutes'
  },
  {
    id: 'change_role',
    name: 'Change Role',
    description: 'Update the role for all selected users',
    icon: UserCheck,
    requiresConfirmation: true,
    estimatedDuration: '1-2 minutes'
  },
  {
    id: 'assign_vehicles',
    name: 'Assign Vehicles',
    description: 'Bulk assign vehicles to selected users',
    icon: Car,
    requiresConfirmation: false,
    estimatedDuration: '3-10 minutes'
  },
  {
    id: 'export_data',
    name: 'Export Data',
    description: 'Export detailed information for selected users',
    icon: Download,
    requiresConfirmation: false,
    estimatedDuration: '1-3 minutes'
  },
  {
    id: 'update_status',
    name: 'Update Status',
    description: 'Change registration status for selected users',
    icon: Settings,
    requiresConfirmation: true,
    estimatedDuration: '1-2 minutes'
  }
];

const EnhancedBulkOperations: React.FC<EnhancedBulkOperationsProps> = ({
  selectedUserIds,
  onBulkDelete,
  onDeselectAll
}) => {
  const [isOperationDialogOpen, setIsOperationDialogOpen] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<BulkOperation | null>(null);
  const [operationParams, setOperationParams] = useState<Record<string, any>>({});
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionProgress, setExecutionProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const { toast } = useToast();

  const handleOperationSelect = (operation: BulkOperation) => {
    setSelectedOperation(operation);
    setOperationParams({});
    setIsOperationDialogOpen(true);
  };

  const executeOperation = async () => {
    if (!selectedOperation) return;

    setIsExecuting(true);
    setExecutionProgress(0);

    // Simulate operation execution with progress
    const totalSteps = selectedUserIds.length;
    for (let i = 0; i < totalSteps; i++) {
      if (isPaused) {
        await new Promise(resolve => {
          const checkPause = () => {
            if (!isPaused) resolve(void 0);
            else setTimeout(checkPause, 100);
          };
          checkPause();
        });
      }

      await new Promise(resolve => setTimeout(resolve, 200)); // Simulate processing time
      setExecutionProgress(((i + 1) / totalSteps) * 100);
    }

    // Handle specific operations
    switch (selectedOperation.id) {
      case 'delete':
        onBulkDelete();
        break;
      case 'change_role':
        toast({
          title: 'Roles Updated',
          description: `Updated role to ${operationParams.newRole} for ${selectedUserIds.length} users`
        });
        break;
      case 'assign_vehicles':
        toast({
          title: 'Vehicles Assigned',
          description: `Assigned ${operationParams.vehicleIds?.length || 0} vehicles to ${selectedUserIds.length} users`
        });
        break;
      case 'export_data':
        toast({
          title: 'Export Complete',
          description: `Exported data for ${selectedUserIds.length} users`
        });
        break;
      case 'update_status':
        toast({
          title: 'Status Updated',
          description: `Updated status to ${operationParams.newStatus} for ${selectedUserIds.length} users`
        });
        break;
    }

    setIsExecuting(false);
    setExecutionProgress(0);
    setIsOperationDialogOpen(false);
    setSelectedOperation(null);
  };

  const renderOperationConfig = () => {
    if (!selectedOperation) return null;

    switch (selectedOperation.id) {
      case 'change_role':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">New Role</label>
              <Select 
                value={operationParams.newRole} 
                onValueChange={(value) => setOperationParams({...operationParams, newRole: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select new role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'assign_vehicles':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Assignment Mode</label>
              <Select 
                value={operationParams.assignmentMode} 
                onValueChange={(value) => setOperationParams({...operationParams, assignmentMode: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select assignment mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Add to existing assignments</SelectItem>
                  <SelectItem value="replace">Replace all assignments</SelectItem>
                  <SelectItem value="remove">Remove specific assignments</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="autoAssign"
                checked={operationParams.autoAssign || false}
                onCheckedChange={(checked) => setOperationParams({...operationParams, autoAssign: checked})}
              />
              <label htmlFor="autoAssign" className="text-sm">Auto-assign based on GP51 username</label>
            </div>
          </div>
        );

      case 'update_status':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">New Status</label>
              <Select 
                value={operationParams.newStatus} 
                onValueChange={(value) => setOperationParams({...operationParams, newStatus: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'export_data':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Export Format</label>
              <Select 
                value={operationParams.format || 'csv'} 
                onValueChange={(value) => setOperationParams({...operationParams, format: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="excel">Excel (XLSX)</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Include Fields</label>
              <div className="grid grid-cols-2 gap-2">
                {['Basic Info', 'Contact Details', 'GP51 Data', 'Vehicle Assignments', 'Audit Trail'].map(field => (
                  <div key={field} className="flex items-center space-x-2">
                    <Checkbox 
                      id={field}
                      defaultChecked={true}
                    />
                    <label htmlFor={field} className="text-sm">{field}</label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (selectedUserIds.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center text-gray-500">
            <CheckSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Select users to enable bulk operations</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Bulk Operations
            <Badge variant="secondary">{selectedUserIds.length} selected</Badge>
          </div>
          <Button variant="outline" size="sm" onClick={onDeselectAll}>
            Deselect All
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {BULK_OPERATIONS.map((operation) => {
            const Icon = operation.icon;
            return (
              <Button
                key={operation.id}
                variant="outline"
                className="h-auto p-4 justify-start"
                onClick={() => handleOperationSelect(operation)}
              >
                <div className="flex items-start gap-3">
                  <Icon className="w-5 h-5 mt-0.5 text-gray-600" />
                  <div className="text-left">
                    <div className="font-medium">{operation.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{operation.description}</div>
                    <div className="text-xs text-blue-600 mt-1">~{operation.estimatedDuration}</div>
                  </div>
                </div>
              </Button>
            );
          })}
        </div>

        {/* Operation Execution Dialog */}
        <Dialog open={isOperationDialogOpen} onOpenChange={setIsOperationDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedOperation && <selectedOperation.icon className="w-5 h-5" />}
                {selectedOperation?.name}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-blue-800 mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-medium">Operation Details</span>
                </div>
                <p className="text-sm text-blue-700">{selectedOperation?.description}</p>
                <p className="text-xs text-blue-600 mt-2">
                  This will affect {selectedUserIds.length} users
                </p>
                <p className="text-xs text-blue-600">
                  Estimated duration: {selectedOperation?.estimatedDuration}
                </p>
              </div>

              {renderOperationConfig()}

              {isExecuting && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Progress</span>
                    <span className="text-sm text-gray-500">{Math.round(executionProgress)}%</span>
                  </div>
                  <Progress value={executionProgress} />
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsPaused(!isPaused)}
                    >
                      {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                      {isPaused ? 'Resume' : 'Pause'}
                    </Button>
                    <span className="text-sm text-gray-500">
                      {isPaused ? 'Operation paused' : 'Processing...'}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsOperationDialogOpen(false)}
                  disabled={isExecuting}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={executeOperation}
                  disabled={isExecuting}
                  className={selectedOperation?.requiresConfirmation ? 'bg-red-600 hover:bg-red-700' : ''}
                >
                  {isExecuting ? 'Executing...' : 'Execute Operation'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default EnhancedBulkOperations;
