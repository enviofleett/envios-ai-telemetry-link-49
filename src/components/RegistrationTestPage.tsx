
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Users, Wrench, Phone, Mail } from 'lucide-react';

const RegistrationTestPage: React.FC = () => {
  const registrationLinks = [
    {
      title: "Public User Registration",
      description: "SMS OTP verification for general users",
      url: "/public-registration",
      icon: <Phone className="h-5 w-5" />,
      features: ["Phone number required", "SMS OTP verification", "Admin review required"]
    },
    {
      title: "Standard User Registration", 
      description: "Alternative registration flow",
      url: "/register",
      icon: <Users className="h-5 w-5" />,
      features: ["Email/password", "Standard flow", "Quick setup"]
    },
    {
      title: "Workshop Registration",
      description: "For automotive workshops and service providers",
      url: "/workshop-signup",
      icon: <Wrench className="h-5 w-5" />,
      features: ["Workshop details", "Service area", "Verification process"]
    },
    {
      title: "OTP Verification",
      description: "Direct OTP verification page",
      url: "/verify-otp?email=test@example.com&otpId=test",
      icon: <Mail className="h-5 w-5" />,
      features: ["Email OTP", "Password setup", "Direct verification"]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Registration Flow Testing
          </h1>
          <p className="text-gray-600">
            Test all registration endpoints before going live
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {registrationLinks.map((link, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  {link.icon}
                  {link.title}
                </CardTitle>
                <p className="text-sm text-gray-600">
                  {link.description}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="text-sm space-y-1">
                  {link.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className="w-full" 
                  onClick={() => window.open(link.url, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Test Registration
                </Button>
                
                <div className="text-xs text-gray-500 font-mono bg-gray-100 p-2 rounded">
                  {link.url}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Production Readiness Checklist</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">SMS Configuration</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    Configure MySMS credentials in SMS settings
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    Test SMS delivery with real phone numbers
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    OTP generation and validation working
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-3">Email Configuration</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    Configure SMTP settings
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    Test email template rendering
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    Email delivery working
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegistrationTestPage;
