
import React from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertCircle, Clock, Rocket } from 'lucide-react';
import type { VehicleFormData } from '../EnhancedVehicleCreationModal';

interface ProductionReadinessStepProps {
  formData: VehicleFormData;
  updateFormData: (updates: Partial<VehicleFormData>) => void;
  onSubmit: () => void;
  onPrevious: () => void;
  isCreating: boolean;
}

export const ProductionReadinessStep: React.FC<ProductionReadinessStepProps> = ({
  formData,
  onSubmit,
  onPrevious,
  isCreating
}) => {
  const readinessChecks = [
    {
      name: 'Device Information',
      status: 'complete',
      description: `Device ID: ${formData.deviceId}, IMEI: ${formData.imei}`
    },
    {
      name: 'Technical Configuration',
      status: 'complete',
      description: `Reporting: ${formData.reportingInterval}s, Timezone: GMT${formData.timezone >= 0 ? '+' : ''}${formData.timezone}`
    },
    {
      name: 'Group Assignment',
      status: formData.selectedGroups.length > 0 ? 'complete' : 'warning',
      description: formData.selectedGroups.length > 0 
        ? `Assigned to ${formData.selectedGroups.length} group(s)`
        : 'No groups selected (optional)'
    },
    {
      name: 'Production Settings',
      status: 'complete',
      description: `Monitoring: ${formData.enableMonitoring ? 'Enabled' : 'Disabled'}, Health Check: ${formData.performHealthCheck ? 'Enabled' : 'Disabled'}`
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'complete':
        return <Badge className="bg-green-500">Ready</Badge>;
      case 'warning':
        return <Badge variant="secondary">Optional</Badge>;
      default:
        return <Badge variant="destructive">Pending</Badge>;
    }
  };

  const readinessScore = (readinessChecks.filter(check => check.status === 'complete').length / readinessChecks.length) * 100;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <Rocket className="h-5 w-5" />
            Production Readiness
          </h3>
          <p className="text-sm text-muted-foreground">
            Review your configuration and create the production-ready vehicle
          </p>
        </div>

        {/* Readiness Score */}
        <div className="p-4 border rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium">Production Readiness Score</span>
            <span className="text-2xl font-bold text-primary">{Math.round(readinessScore)}%</span>
          </div>
          <Progress value={readinessScore} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {readinessScore === 100 ? 'Excellent! Ready for production deployment.' :
             readinessScore >= 75 ? 'Good configuration, ready to proceed.' :
             'Review configuration before proceeding.'}
          </p>
        </div>

        {/* Readiness Checks */}
        <div className="space-y-3">
          <h4 className="font-medium">Configuration Summary</h4>
          {readinessChecks.map((check, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
              {getStatusIcon(check.status)}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{check.name}</span>
                  {getStatusBadge(check.status)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{check.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Production Features Alert */}
        <Alert>
          <Rocket className="h-4 w-4" />
          <AlertDescription>
            <strong>Production Features Included:</strong><br />
            • Real-time device handshake verification<br />
            • GP51 protocol compliance validation<br />
            • Automatic group assignment (if selected)<br />
            • Device health monitoring setup<br />
            • Complete audit trail logging
          </AlertDescription>
        </Alert>

        {/* Creation Status */}
        {isCreating && (
          <Alert>
            <Clock className="h-4 w-4 animate-spin" />
            <AlertDescription>
              Creating production vehicle... This may take up to 30 seconds while we verify device communication and configure GP51 integration.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious} disabled={isCreating}>
          Previous
        </Button>
        <Button 
          onClick={onSubmit} 
          disabled={isCreating}
          className="min-w-32"
        >
          {isCreating ? (
            <>
              <Clock className="h-4 w-4 animate-spin mr-2" />
              Creating...
            </>
          ) : (
            <>
              <Rocket className="h-4 w-4 mr-2" />
              Create Vehicle
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
