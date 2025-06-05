
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Clock, UserCheck } from 'lucide-react';

const RegistrationSuccess: React.FC = () => {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-600">
          <CheckCircle className="h-6 w-6" />
          Registration Successful!
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="bg-green-50 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Phone Number Verified</h3>
          <p className="text-gray-600 mb-4">
            Your registration has been successfully submitted and your phone number has been verified.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">What's Next?</h4>
              <p className="text-sm text-blue-800 mt-1">
                Your registration is now pending admin review. You'll be contacted once your account has been approved and set up.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <UserCheck className="h-5 w-5 text-gray-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-900">Admin Review Process</h4>
              <ul className="text-sm text-gray-700 mt-1 space-y-1">
                <li>• Account verification and approval</li>
                <li>• User type assignment based on your needs</li>
                <li>• GP51 platform account creation</li>
                <li>• Account activation notification</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-500">
            Questions? Contact our support team for assistance.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default RegistrationSuccess;
