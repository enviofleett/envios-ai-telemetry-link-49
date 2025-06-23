
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2 } from 'lucide-react';
import CompanySettingsForm from './CompanySettingsForm';

const CompanySettingsTab: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Company Settings
        </CardTitle>
        <CardDescription>
          Configure your company information and preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CompanySettingsForm />
      </CardContent>
    </Card>
  );
};

export default CompanySettingsTab;
