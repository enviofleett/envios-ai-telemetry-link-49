
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  ArrowRight, 
  CheckCircle, 
  Zap,
  Shield,
  Database
} from 'lucide-react';
import { Link } from 'react-router-dom';

const GP51SetupWizard: React.FC = () => {
  const setupSteps = [
    {
      title: "Access Admin Settings",
      description: "Navigate to the administration panel to configure GP51 integration",
      icon: Settings,
      action: "Go to Settings",
      link: "/settings",
      status: "pending"
    },
    {
      title: "Configure GP51 Credentials",
      description: "Enter your GP51 username and password in the GP51 Integration tab",
      icon: Shield,
      status: "pending"
    },
    {
      title: "Test Connection",
      description: "Verify the connection to ensure proper authentication",
      icon: Zap,
      status: "pending"
    },
    {
      title: "Start Monitoring",
      description: "Access vehicle data and begin fleet management",
      icon: Database,
      status: "pending"
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          GP51 Integration Setup
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Follow these steps to configure GP51 integration and access your vehicle fleet data:
          </p>

          <div className="space-y-3">
            {setupSteps.map((step, index) => (
              <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                  <step.icon className="h-4 w-4 text-gray-600" />
                </div>
                
                <div className="flex-1">
                  <div className="font-medium">{step.title}</div>
                  <div className="text-sm text-muted-foreground">{step.description}</div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {index + 1}
                  </Badge>
                  
                  {step.link && (
                    <Button asChild size="sm" variant="outline">
                      <Link to={step.link}>
                        {step.action}
                        <ArrowRight className="h-3 w-3 ml-2" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <div className="font-medium text-blue-900">Why GP51 Integration?</div>
                <div className="text-sm text-blue-800 mt-1">
                  GP51 integration provides real-time vehicle tracking, location history, 
                  speed monitoring, and comprehensive fleet analytics. This connection 
                  ensures you have access to the most current vehicle data.
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GP51SetupWizard;
