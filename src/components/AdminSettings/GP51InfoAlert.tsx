
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const GP51InfoAlert: React.FC = () => {
  return (
    <Alert>
      <AlertDescription className="text-sm">
        <strong>Automated Import Integration:</strong> These credentials will be securely stored and used 
        for automated passwordless imports. Once connected, the system can import GP51 user and vehicle 
        data without requiring manual password input for each import operation.
      </AlertDescription>
    </Alert>
  );
};

export default GP51InfoAlert;
