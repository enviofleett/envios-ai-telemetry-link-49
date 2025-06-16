
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';

const CurrencyTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Currency Settings</h2>
        <p className="text-muted-foreground">
          Configure currency preferences and exchange rates for your application.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Currency Configuration
          </CardTitle>
          <CardDescription>
            Set default currencies and manage exchange rates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Currency configuration will be available in the next phase of development.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CurrencyTab;
