
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface PasswordlessImportFormProps {
  onJobStarted: () => void;
}

const PasswordlessImportForm: React.FC<PasswordlessImportFormProps> = ({ onJobStarted }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Passwordless Import</CardTitle>
        <CardDescription>
          Import users and devices without password requirements
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Passwordless import is currently unavailable. The GP51 integration service is being rebuilt.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default PasswordlessImportForm;
