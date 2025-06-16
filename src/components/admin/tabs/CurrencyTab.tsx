
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';

const CurrencyTab: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Currency Settings
        </CardTitle>
        <CardDescription>
          Configure currency display and formatting options
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          <p>Currency configuration will be available in the next phase of development.</p>
          <p className="text-sm mt-2">Features coming soon: Currency selection, formatting rules, exchange rates</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CurrencyTab;
