
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Car, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { BasicInfoStep } from './creation-steps/BasicInfoStep';
import { TechnicalConfigStep } from './creation-steps/TechnicalConfigStep';
import { GroupAssignmentStep } from './creation-steps/GroupAssignmentStep';
import { ProductionReadinessStep } from './creation-steps/ProductionReadinessStep';
import { useProductionVehicleManager } from '@/hooks/useProductionVehicleManager';
import type { ProductionVehicleCreationRequest } from '@/services/productionVehicleService';

interface EnhancedVehicleCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (vehicleId: string) => void;
}

export interface VehicleFormData {
  // Basic Info
  deviceId: string;
  deviceName: string;
  deviceType: number;
  imei: string;
  
  // Technical Config
  simNumber: string;
  timezone: number;
  reportingInterval: number;
  
  // Group Assignment
  selectedGroups: number[];
  
  // Production Settings
  enableMonitoring: boolean;
  performHealthCheck: boolean;
}

const STEPS = [
  { id: 1, name: 'Basic Information', icon: Car },
  { id: 2, name: 'Technical Configuration', icon: Clock },
  { id: 3, name: 'Group Assignment', icon: CheckCircle },
  { id: 4, name: 'Production Readiness', icon: AlertCircle }
];

export const EnhancedVehicleCreationModal: React.FC<EnhancedVehicleCreationModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<VehicleFormData>({
    deviceId: '',
    deviceName: '',
    deviceType: 1,
    imei: '',
    simNumber: '',
    timezone: 0,
    reportingInterval: 30,
    selectedGroups: [],
    enableMonitoring: true,
    performHealthCheck: true
  });
  
  const { createProductionVehicle, isCreating } = useProductionVehicleManager();

  const updateFormData = (updates: Partial<VehicleFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      const request: ProductionVehicleCreationRequest = {
        deviceId: formData.deviceId,
        deviceName: formData.deviceName,
        deviceType: formData.deviceType,
        imei: formData.imei,
        simNumber: formData.simNumber,
        adminUserId: 'current-user', // This would come from auth context
        performHealthCheck: formData.performHealthCheck,
        enableMonitoring: formData.enableMonitoring,
        activateOnGP51: true // Enable GP51 activation
      };

      const result = await createProductionVehicle(request);
      
      if (result.success && result.vehicleId) {
        onSuccess?.(result.vehicleId);
        onClose();
        resetForm();
      }
    } catch (error) {
      console.error('Vehicle creation failed:', error);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setFormData({
      deviceId: '',
      deviceName: '',
      deviceType: 1,
      imei: '',
      simNumber: '',
      timezone: 0,
      reportingInterval: 30,
      selectedGroups: [],
      enableMonitoring: true,
      performHealthCheck: true
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const progress = (currentStep / STEPS.length) * 100;

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <BasicInfoStep 
            formData={formData} 
            updateFormData={updateFormData}
            onNext={handleNext}
          />
        );
      case 2:
        return (
          <TechnicalConfigStep 
            formData={formData} 
            updateFormData={updateFormData}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 3:
        return (
          <GroupAssignmentStep 
            formData={formData} 
            updateFormData={updateFormData}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 4:
        return (
          <ProductionReadinessStep 
            formData={formData} 
            updateFormData={updateFormData}
            onSubmit={handleSubmit}
            onPrevious={handlePrevious}
            isCreating={isCreating}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Enhanced Vehicle Creation
          </DialogTitle>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Step {currentStep} of {STEPS.length}</span>
            <span className="text-sm text-muted-foreground">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Indicators */}
        <div className="flex justify-between mb-6">
          {STEPS.map((step) => {
            const StepIcon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <div key={step.id} className="flex flex-col items-center space-y-2">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center border-2
                  ${isActive ? 'border-primary bg-primary text-primary-foreground' : 
                    isCompleted ? 'border-green-500 bg-green-500 text-white' : 
                    'border-muted bg-muted text-muted-foreground'}
                `}>
                  {isCompleted ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <StepIcon className="h-5 w-5" />
                  )}
                </div>
                <div className="text-xs text-center max-w-20">
                  <div className={`font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                    {step.name}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <Separator />

        {/* Step Content */}
        <div className="py-6">
          {renderStepContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
};
