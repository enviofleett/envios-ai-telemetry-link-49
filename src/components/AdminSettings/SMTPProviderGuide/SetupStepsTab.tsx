
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, ExternalLink, Info, Zap } from 'lucide-react';

interface ProviderConfig {
  name: string;
  pricing: string;
  setupSteps: string[];
  advantages: string[];
}

interface SetupStepsTabProps {
  provider: ProviderConfig;
  selectedProvider: string;
}

const SetupStepsTab: React.FC<SetupStepsTabProps> = ({ provider, selectedProvider }) => {
  const getProviderUrl = () => {
    switch (selectedProvider) {
      case 'ses':
        return 'https://aws.amazon.com/ses';
      default:
        return `https://${selectedProvider}.com`;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          {provider.name} Setup Process
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Pricing:</strong> {provider.pricing}
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <h4 className="font-medium">Step-by-step setup:</h4>
          <ol className="space-y-2">
            {provider.setupSteps.map((step, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                  {index + 1}
                </div>
                <span className="text-sm">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">Key Advantages:</h4>
          <ul className="space-y-1">
            {provider.advantages.map((advantage, index) => (
              <li key={index} className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                {advantage}
              </li>
            ))}
          </ul>
        </div>

        <Button 
          className="w-full" 
          onClick={() => window.open(getProviderUrl(), '_blank')}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Go to {provider.name}
        </Button>
      </CardContent>
    </Card>
  );
};

export default SetupStepsTab;
