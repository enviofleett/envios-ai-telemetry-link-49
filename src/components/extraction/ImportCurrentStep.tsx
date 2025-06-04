
import React from 'react';

interface ImportCurrentStepProps {
  currentStep?: string;
  stepDetails?: string;
}

const ImportCurrentStep: React.FC<ImportCurrentStepProps> = ({ currentStep, stepDetails }) => {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
      <div className="font-medium text-blue-800 mb-1">Current Step:</div>
      <div className="text-blue-700 text-sm">{currentStep || 'Initializing...'}</div>
      {stepDetails && (
        <div className="text-xs text-blue-600 mt-2">{stepDetails}</div>
      )}
    </div>
  );
};

export default ImportCurrentStep;
