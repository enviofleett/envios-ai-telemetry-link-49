
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PackageSelectionForm from '@/components/registration/PackageSelectionForm';

const Register: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Join Our Fleet Management Platform
          </h1>
          <p className="text-lg text-gray-600">
            Choose the perfect package for your fleet management needs
          </p>
        </div>
        
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Get Started Today</CardTitle>
            <CardDescription>
              Select a package and submit your registration for admin review
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PackageSelectionForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;
