
import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart } from 'lucide-react';

const AnalyticsTab: React.FC = () => {
  return (
    <TabsContent value="analytics" className="space-y-4 mt-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Map Usage Analytics</h3>
        <p className="text-sm text-gray-600 mb-4">
          Comprehensive analytics for map usage, performance metrics, and user behavior
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            Analytics Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <BarChart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Analytics Coming Soon</h3>
              <p className="text-gray-500">
                Map analytics dashboard will be available after restructuring
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
};

export default AnalyticsTab;
