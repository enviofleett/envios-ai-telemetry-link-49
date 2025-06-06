
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Car, Shield, Zap } from 'lucide-react';

interface ProfessionalAuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  showBranding?: boolean;
}

const ProfessionalAuthLayout: React.FC<ProfessionalAuthLayoutProps> = ({
  children,
  title,
  subtitle,
  showBranding = true
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {showBranding && (
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg">
                <Car className="h-6 w-6 text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-2xl font-bold text-gray-900">FleetIQ</h1>
                <p className="text-sm text-gray-600">GPS51 Management Platform</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                <span>Secure</span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                <span>Real-time</span>
              </div>
              <div className="flex items-center gap-1">
                <Car className="h-3 w-3" />
                <span>GPS51 Compatible</span>
              </div>
            </div>
          </div>
        )}
        
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-2 text-center pb-6">
            <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
            <p className="text-gray-600">{subtitle}</p>
          </CardHeader>
          <CardContent className="pb-8">
            {children}
          </CardContent>
        </Card>
        
        <div className="mt-6 text-center text-xs text-gray-500">
          <p>© 2025 FleetIQ. Professional GPS51 vehicle tracking and management.</p>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalAuthLayout;
