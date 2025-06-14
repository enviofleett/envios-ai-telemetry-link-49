
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { MerchantApplication } from '@/types/merchant-application';

interface InfoRequestAlertProps {
    application: MerchantApplication | null;
}

const InfoRequestAlert: React.FC<InfoRequestAlertProps> = ({ application }) => {
    if (application?.status === 'requires_more_info' && application.rejection_reason) {
        return (
            <Alert variant="default" className="mb-6 bg-yellow-100 border-yellow-200 text-yellow-800 [&>svg]:text-yellow-500">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Action Required</AlertTitle>
                <AlertDescription>
                    <p className="font-semibold">Our team has requested more information:</p>
                    <p className="mt-2 text-sm">{application.rejection_reason}</p>
                </AlertDescription>
            </Alert>
        );
    }
    return null;
}

export default InfoRequestAlert;
