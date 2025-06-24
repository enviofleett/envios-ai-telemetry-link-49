
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Clock, Database, Loader2 } from 'lucide-react';

interface GP51ProgressIndicatorProps {
  isActive: boolean;
  currentOperation?: string;
  progress?: number;
  estimatedTime?: string;
  dataSize?: {
    vehicles: number;
    users: number;
  };
}

const GP51ProgressIndicator: React.FC<GP51ProgressIndicatorProps> = ({
  isActive,
  currentOperation,
  progress = 0,
  estimatedTime,
  dataSize
}) => {
  if (!isActive) return null;

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
            <CardTitle className="text-blue-800">GP51 Data Import in Progress</CardTitle>
          </div>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            {progress}%
          </Badge>
        </div>
        <CardDescription className="text-blue-700">
          {currentOperation || 'Processing large dataset from GP51...'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={progress} className="h-2" />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          {estimatedTime && (
            <div className="flex items-center space-x-2 text-blue-700">
              <Clock className="h-4 w-4" />
              <span>Est. {estimatedTime}</span>
            </div>
          )}
          
          {dataSize && (
            <div className="flex items-center space-x-2 text-blue-700">
              <Database className="h-4 w-4" />
              <span>{dataSize.vehicles} vehicles, {dataSize.users} users</span>
            </div>
          )}
          
          <div className="text-blue-600 text-xs">
            Large datasets may take 2-5 minutes to process
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GP51ProgressIndicator;
