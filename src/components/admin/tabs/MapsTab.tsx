
import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Map } from 'lucide-react';

const MapsTab: React.FC = () => {
  return (
    <TabsContent value="maps" className="space-y-4 mt-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Map Management</h3>
        <p className="text-sm text-gray-600 mb-4">
          Configure map providers and settings for the application
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5" />
            Map Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <Map className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Map Settings Coming Soon</h3>
              <p className="text-gray-500">
                New simplified map configuration will be available here
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
};

export default MapsTab;
