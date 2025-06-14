
import React from 'react';
import { useMerchantApplication } from '@/hooks/useMerchantApplication';
import { Loader2, AlertTriangle } from 'lucide-react';
import MerchantApplicationForm from '@/components/merchant-application/MerchantApplicationForm';
import ApplicationStatusDisplay from '@/components/merchant-application/ApplicationStatusDisplay';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const BecomeAMerchantPage: React.FC = () => {
  const { application, isLoading, isError, error } = useMerchantApplication();

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    
    if (isError) {
      return (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Application</AlertTitle>
          <AlertDescription>
            There was a problem loading your application data. Please try again later.
            {error && <p className="mt-2 text-xs font-mono bg-red-100 p-2 rounded">Error: {(error as Error).message}</p>}
          </AlertDescription>
        </Alert>
      );
    }
    
    if (application && !['draft', 'requires_more_info'].includes(application.status)) {
        return <ApplicationStatusDisplay application={application} />;
    }

    return <MerchantApplicationForm />;
  };

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Merchant Application</CardTitle>
            <CardDescription>
              Apply to become a merchant on our platform and start selling your products.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderContent()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BecomeAMerchantPage;
