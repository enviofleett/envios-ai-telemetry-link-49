
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, AlertCircle } from 'lucide-react';

interface PasswordlessImportWarningsProps {
  gp51Connected: boolean;
}

const PasswordlessImportWarnings: React.FC<PasswordlessImportWarningsProps> = ({ 
  gp51Connected 
}) => {
  return (
    <>
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Import GP51 users using stored admin credentials. No manual password input required.
        </AlertDescription>
      </Alert>

      {!gp51Connected && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            GP51 credentials not configured. Please set up the connection in Admin Settings before proceeding.
          </AlertDescription>
        </Alert>
      )}

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          This will create Envio accounts for the specified GP51 users using the stored admin credentials. 
          Users will receive temporary accounts and must set their passwords through GP51 validation.
        </AlertDescription>
      </Alert>
    </>
  );
};

export default PasswordlessImportWarnings;
