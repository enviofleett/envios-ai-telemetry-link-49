
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMaintenanceServicePlans } from '@/hooks/maintenance/useMaintenanceServicePlans';
import type { MaintenanceServicePlan } from '@/types/maintenance';

const ServicePlanManager: React.FC = () => {
  const { loading, getServicePlans } = useMaintenanceServicePlans();
  const [servicePlans, setServicePlans] = useState<MaintenanceServicePlan[]>([]);

  useEffect(() => {
    const loadServicePlans = async () => {
      const plans = await getServicePlans();
      setServicePlans(plans);
    };

    loadServicePlans();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Available Service Plans</CardTitle>
        <CardDescription>
          Choose from our comprehensive maintenance service plans
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {servicePlans.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No service plans available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {servicePlans.map((plan) => (
              <Card key={plan.id} className="border-2 hover:border-primary/50 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <Badge variant="secondary">${plan.base_price}</Badge>
                  </div>
                  {plan.description && (
                    <CardDescription className="text-sm">
                      {plan.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium mb-2">Services Included:</p>
                    <div className="flex flex-wrap gap-1">
                      {plan.service_types.map((service, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {service}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>Duration: {plan.duration_hours}h</span>
                  </div>
                  
                  <Button className="w-full">
                    Select Plan
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ServicePlanManager;
