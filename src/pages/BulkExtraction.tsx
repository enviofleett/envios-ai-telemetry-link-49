
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import BulkExtractionManager from '@/components/BulkExtractionManager';
import { Database, Users, Car } from 'lucide-react';

const BulkExtraction: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Bulk GP51 Data Extraction</h1>
        <p className="text-gray-600 mt-2">
          Comprehensive extraction of user accounts and vehicle data from GP51 LIVE platform
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Process Overview</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Multi-Account</div>
            <p className="text-xs text-muted-foreground">
              Iterate through each GP51 account for comprehensive data extraction
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Collection</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Users + Vehicles</div>
            <p className="text-xs text-muted-foreground">
              Extract user data, vehicle lists, and position information
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Output Format</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Structured JSON</div>
            <p className="text-xs text-muted-foreground">
              Organized data with comprehensive error reporting
            </p>
          </CardContent>
        </Card>
      </div>

      <BulkExtractionManager />
    </div>
  );
};

export default BulkExtraction;
