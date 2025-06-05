
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Tag, Settings, Trash2 } from 'lucide-react';

interface BulkDeviceOperationsProps {
  selectedDevices: string[];
  onClearSelection: () => void;
  deviceTags: any[];
}

const BulkDeviceOperations: React.FC<BulkDeviceOperationsProps> = ({
  selectedDevices,
  onClearSelection,
  deviceTags
}) => {
  if (selectedDevices.length === 0) {
    return null;
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Badge variant="secondary">{selectedDevices.length}</Badge>
            devices selected
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Tag className="h-3 w-3" />
            Apply Tags
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Settings className="h-3 w-3" />
            Bulk Configure
          </Button>
          <Button variant="destructive" size="sm" className="flex items-center gap-2">
            <Trash2 className="h-3 w-3" />
            Delete Selected
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default BulkDeviceOperations;
