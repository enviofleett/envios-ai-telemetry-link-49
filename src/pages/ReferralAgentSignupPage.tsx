
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ReferralAgentSignupForm from '@/components/referral/ReferralAgentSignupForm';

const ReferralAgentSignupPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-extrabold">Become a Referral Agent</CardTitle>
            <CardDescription>
              Join our team of referral agents and start earning commissions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ReferralAgentSignupForm />
             <div className="mt-4 text-center text-sm">
                Already have an agent account?{' '}
                <Link to="/auth" className="font-medium text-primary hover:text-primary/90">
                    Log in here
                </Link>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReferralAgentSignupPage;
