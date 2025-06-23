
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useImportPreviewData } from '@/hooks/useImportPreviewData';
import { Users, Car, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

const ImportReviewSummary: React.FC = () => {
  const { previewData, isLoading, summary } = useImportPreviewData();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Import Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const progressPercentage = summary?.totalRecords > 0 
    ? ((summary.reviewed / summary.totalRecords) * 100) 
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Import Summary
          <Badge variant={summary?.conflicts > 0 ? "destructive" : "secondary"}>
            {summary?.conflicts || 0} Conflicts
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <div className="text-2xl font-bold">{summary?.totalUsers || 0}</div>
            <div className="text-xs text-muted-foreground">Users</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Car className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-2xl font-bold">{summary?.totalVehicles || 0}</div>
            <div className="text-xs text-muted-foreground">Vehicles</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-2xl font-bold">{summary?.eligible || 0}</div>
            <div className="text-xs text-muted-foreground">Eligible</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
            </div>
            <div className="text-2xl font-bold">{summary?.conflicts || 0}</div>
            <div className="text-xs text-muted-foreground">Conflicts</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <XCircle className="h-5 w-5 text-red-500" />
            </div>
            <div className="text-2xl font-bold">{summary?.rejected || 0}</div>
            <div className="text-xs text-muted-foreground">Rejected</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Review Progress</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="w-full" />
        </div>
      </CardContent>
    </Card>
  );
};

export default ImportReviewSummary;
