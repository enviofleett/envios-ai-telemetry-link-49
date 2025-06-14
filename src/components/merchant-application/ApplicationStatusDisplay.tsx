
import React from 'react';
import { MerchantApplication } from '@/types/merchant-application';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, XCircle, Info, Clock } from 'lucide-react';
import DocumentList from './DocumentList';

interface ApplicationStatusDisplayProps {
  application: MerchantApplication;
}

const statusConfig = {
    draft: { variant: "secondary", icon: <Info className="h-4 w-4" />, title: "Draft Application" },
    submitted: { variant: "default", icon: <Clock className="h-4 w-4" />, title: "Application Submitted" },
    in_review: { variant: "default", icon: <Clock className="h-4 w-4" />, title: "Application In Review" },
    requires_more_info: { variant: "yellow", icon: <AlertTriangle className="h-4 w-4" />, title: "Action Required" },
    approved: { variant: "green", icon: <CheckCircle className="h-4 w-4" />, title: "Application Approved!" },
    rejected: { variant: "destructive", icon: <XCircle className="h-4 w-4" />, title: "Application Rejected" },
};

const ApplicationStatusDisplay: React.FC<ApplicationStatusDisplayProps> = ({ application }) => {
    const config = statusConfig[application.status];
    
    const formattedStatus = application.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    return (
        <div className="space-y-6">
            <Alert variant={config.variant as any}>
                {config.icon}
                <AlertTitle>{config.title}</AlertTitle>
                <AlertDescription>
                    Your application status is: <span className="font-semibold">{formattedStatus}</span>.
                    {application.status === 'approved' && " Congratulations! You can now access merchant features."}
                    {application.status === 'submitted' && " We will review your application soon."}
                    {application.status === 'in_review' && " Your application is currently being reviewed by our team."}
                </AlertDescription>
            </Alert>
            
            {(application.status === 'requires_more_info' || application.status === 'rejected') && application.rejection_reason && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Feedback from our team</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">{application.rejection_reason}</p>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Application Summary</CardTitle>
                    <CardDescription>This is the information you submitted.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><strong>Organization Name:</strong> {application.org_name}</div>
                        <div><strong>Contact Email:</strong> {application.contact_email}</div>
                        <div><strong>Business Address:</strong> {application.business_address || 'N/A'}</div>
                        <div><strong>Website URL:</strong> {application.website_url ? <a href={application.website_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">{application.website_url}</a> : 'N/A'}</div>
                        <div><strong>Business Type:</strong> {application.business_type || 'N/A'}</div>
                        <div><strong>Business Registration ID:</strong> {application.business_registration_id || 'N/A'}</div>
                        <div><strong>Tax ID:</strong> {application.tax_id || 'N/A'}</div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Business Documents</CardTitle>
                </CardHeader>
                <CardContent>
                    <DocumentList documents={application.documents || []} />
                </CardContent>
            </Card>
        </div>
    );
};

export default ApplicationStatusDisplay;
