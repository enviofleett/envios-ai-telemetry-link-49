
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

const BrandingCustomizationTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Branding & UI Customization</h3>
        <p className="text-sm text-muted-foreground">
          Customize your Envio platform's visual identity and user interface
        </p>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Branding customization is temporarily disabled to ensure system stability. 
          The platform is currently using the default theme configuration.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default BrandingCustomizationTab;
