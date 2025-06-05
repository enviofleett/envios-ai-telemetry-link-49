
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database } from 'lucide-react';
import { DataIntegrityResult } from '@/services/vehicleRedistribution';

interface DataIntegritySectionProps {
  integrity: DataIntegrityResult | undefined;
}

const DataIntegritySection = ({ integrity }: DataIntegritySectionProps) => {
  if (!integrity) return null;

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <Database className="h-5 w-5" />
          Data Integrity Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-medium">Valid Usernames:</span>
            <div className="text-lg font-bold text-green-600">{integrity.validUsernames}</div>
          </div>
          <div>
            <span className="font-medium">Empty Usernames:</span>
            <div className="text-lg font-bold text-orange-600">{integrity.emptyUsernames}</div>
          </div>
          <div>
            <span className="font-medium">Generic "User":</span>
            <div className="text-lg font-bold text-red-600">{integrity.genericUsernames}</div>
          </div>
          <div>
            <span className="font-medium">Total Invalid:</span>
            <div className="text-lg font-bold text-red-600">{integrity.invalidUsernames}</div>
          </div>
        </div>
        
        {integrity.recommendations.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium text-blue-800 mb-2">Recommendations:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-blue-700">
              {integrity.recommendations.map((rec, index) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DataIntegritySection;
