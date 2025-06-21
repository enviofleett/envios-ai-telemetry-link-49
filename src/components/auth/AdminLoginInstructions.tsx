
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, CheckCircle } from 'lucide-react';

interface AdminLoginInstructionsProps {
  hasCredentials: boolean;
}

const AdminLoginInstructions: React.FC<AdminLoginInstructionsProps> = ({ hasCredentials }) => {
  if (hasCredentials) {
    return (
      <Alert className="border-green-200 bg-green-50 mb-4">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          Admin credentials are configured. You can now login using:
          <br />
          <strong>Username:</strong> octopus
          <br />
          <strong>Password:</strong> [the password you configured]
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="border-blue-200 bg-blue-50 mb-4">
      <Info className="h-4 w-4 text-blue-600" />
      <AlertDescription className="text-blue-800">
        <strong>Admin Setup Required:</strong>
        <br />
        1. Configure GP51 credentials below using the "octopus" account
        <br />
        2. After setup, login with username "octopus" and your configured password
        <br />
        3. This will link your session to the admin account (chudesyl@gmail.com)
      </AlertDescription>
    </Alert>
  );
};

export default AdminLoginInstructions;
