
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Plus, Users, Star } from 'lucide-react';

interface WorkshopMarketplaceHeaderProps {
  onRegisterWorkshop: () => void;
}

const WorkshopMarketplaceHeader: React.FC<WorkshopMarketplaceHeaderProps> = ({
  onRegisterWorkshop
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Workshop Marketplace</h1>
        <p className="text-muted-foreground">
          Connect with trusted workshops for vehicle maintenance and inspections
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Available Workshops
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">150+</div>
            <p className="text-xs text-muted-foreground">
              Verified service providers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Connected Users
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,500+</div>
            <p className="text-xs text-muted-foreground">
              Active fleet managers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Rating
            </CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.8</div>
            <p className="text-xs text-muted-foreground">
              Customer satisfaction
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg text-blue-900">
                Are you a workshop owner?
              </CardTitle>
              <CardDescription className="text-blue-700">
                Join our marketplace and connect with fleet managers in your area
              </CardDescription>
            </div>
            <Button onClick={onRegisterWorkshop} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Register Workshop
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkshopMarketplaceHeader;
