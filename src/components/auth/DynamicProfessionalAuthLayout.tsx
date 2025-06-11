
import React from 'react';
import { useBranding } from '@/contexts/BrandingContext';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface DynamicProfessionalAuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

const DynamicProfessionalAuthLayout: React.FC<DynamicProfessionalAuthLayoutProps> = ({
  children,
  title,
  subtitle
}) => {
  const branding = useBranding();

  if (branding.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <Skeleton className="h-12 w-32 mx-auto" />
              <Skeleton className="h-8 w-48 mx-auto" />
              <Skeleton className="h-4 w-64 mx-auto" />
              <div className="space-y-2 pt-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayCompanyName = branding.authPageBranding && branding.isBrandingActive 
    ? branding.companyName 
    : 'FleetIQ';
  
  const displayTagline = branding.authPageBranding && branding.isBrandingActive
    ? branding.tagline
    : 'GPS51 Management Platform';
    
  const displaySubtitle = branding.authPageBranding && branding.isBrandingActive
    ? branding.subtitle
    : 'Professional vehicle tracking and management';

  const customStyles = branding.authPageBranding && branding.isBrandingActive ? {
    backgroundColor: branding.backgroundColor,
    color: branding.textColor,
    fontFamily: branding.fontFamily,
  } : {};

  const gradientBackground = branding.authPageBranding && branding.isBrandingActive
    ? `linear-gradient(to bottom right, ${branding.primaryColor}20, ${branding.accentColor}20)`
    : 'linear-gradient(to bottom right, rgb(239 246 255), rgb(224 231 255))';

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: gradientBackground }}
    >
      <Card className="w-full max-w-md shadow-xl">
        <CardContent className="p-8" style={customStyles}>
          <div className="text-center space-y-6">
            {/* Logo */}
            {branding.logoUrl && branding.authPageBranding && branding.isBrandingActive && (
              <div className="flex justify-center">
                <img 
                  src={branding.logoUrl} 
                  alt={`${displayCompanyName} Logo`}
                  className="h-12 max-w-48 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
            
            {/* Company Name */}
            <div>
              <h1 
                className="text-3xl font-bold mb-2"
                style={branding.authPageBranding && branding.isBrandingActive 
                  ? { color: branding.primaryColor } 
                  : { color: '#3B82F6' }
                }
              >
                {displayCompanyName}
              </h1>
              <p className="text-lg font-medium mb-1">
                {displayTagline}
              </p>
              <p className="text-sm opacity-75">
                {displaySubtitle}
              </p>
            </div>

            {/* Page Title */}
            <div className="pt-4">
              <h2 className="text-xl font-semibold mb-2">{title}</h2>
              {subtitle && <p className="text-sm opacity-75">{subtitle}</p>}
            </div>

            {/* Form Content */}
            <div className="pt-2">
              {children}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DynamicProfessionalAuthLayout;
