
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle } from 'lucide-react';

const TestingTab: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Testing Your Setup</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <h4 className="font-medium">Testing Steps:</h4>
          <ol className="space-y-2 text-sm">
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
              Configure your SMTP settings using the values above
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
              Use the "Test Connection" button in the SMTP configuration form
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
              Send a test email to yourself using the email templates
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">4</span>
              Check your email logs in the Email Templates tab for delivery status
            </li>
          </ol>
        </div>

        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Pro Tip:</strong> Start with a sandbox/test mode if available, then request production access once everything is working correctly.
          </AlertDescription>
        </Alert>

        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-medium text-yellow-800 mb-2">Common Issues & Solutions:</h4>
          <ul className="text-xs text-yellow-700 space-y-1">
            <li>• <strong>Authentication Failed:</strong> Double-check your API key and username</li>
            <li>• <strong>Connection Timeout:</strong> Verify SMTP host and port settings</li>
            <li>• <strong>Emails go to Spam:</strong> Ensure DNS records are properly configured</li>
            <li>• <strong>Rate Limiting:</strong> Check your provider's sending limits</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default TestingTab;
