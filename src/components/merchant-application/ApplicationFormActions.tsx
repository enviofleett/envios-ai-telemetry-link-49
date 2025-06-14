
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Send, Save } from 'lucide-react';
import { MerchantApplication } from '@/types/merchant-application';

interface ApplicationFormActionsProps {
    isSaving: boolean;
    isSubmitting: boolean;
    application: MerchantApplication | null;
    onSave: () => void;
    onSubmit: () => void;
}

const ApplicationFormActions: React.FC<ApplicationFormActionsProps> = ({
    isSaving,
    isSubmitting,
    application,
    onSave,
    onSubmit
}) => {
    return (
        <div className="flex flex-col items-end gap-2">
            <div className="flex gap-4">
                <Button type="button" variant="outline" onClick={onSave} disabled={isSaving || isSubmitting}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Draft
                </Button>
                {application && (
                     <Button type="button" onClick={onSubmit} disabled={isSaving || isSubmitting || !application.documents || application.documents.length === 0}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        Submit Application
                    </Button>
                )}
            </div>
            {(!application || !application.documents || application.documents.length === 0) && (
                <p className="text-sm text-muted-foreground">
                    You must save a draft and upload at least one document to submit.
                </p>
            )}
        </div>
    );
};

export default ApplicationFormActions;
