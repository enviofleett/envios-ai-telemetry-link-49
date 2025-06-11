
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Plus, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PackageManagementTab = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Package Management
          </CardTitle>
          <CardDescription>
            Create and manage subscription packages for users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Available Packages</h3>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Package
              </Button>
            </div>
            <p className="text-muted-foreground">
              Package management interface will be available in the next release.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Package Features
          </CardTitle>
          <CardDescription>
            Configure features available in each package
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Feature configuration will be available in the next release.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PackageManagementTab;
