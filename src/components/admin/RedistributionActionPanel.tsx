
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { AnalysisResult } from '@/services/vehicleRedistribution';

interface RedistributionActionPanelProps {
  analysis: AnalysisResult;
  onRedistribute: () => void;
  isRedistributing: boolean;
}

const RedistributionActionPanel = ({ 
  analysis, 
  onRedistribute, 
  isRedistributing 
}: RedistributionActionPanelProps) => {
  if (!analysis.redistributionNeeded) return null;

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <AlertTriangle className="h-5 w-5" />
          Vehicle Assignment Action Required
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-orange-700">
          <p className="mb-2">
            The system has detected vehicles that can be redistributed based on GP51 usernames.
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>{analysis.unassignedVehicles} vehicles are currently unassigned</li>
            <li>{analysis.validGp51Usernames} vehicles have valid GP51 usernames for redistribution</li>
            <li>{analysis.invalidGp51Usernames} vehicles have invalid GP51 usernames and will be skipped</li>
          </ul>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={onRedistribute}
            disabled={isRedistributing}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isRedistributing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Redistributing...
              </>
            ) : (
              'Redistribute Vehicles'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RedistributionActionPanel;
