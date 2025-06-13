
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useBranding } from '@/contexts/BrandingContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, Settings, User, Activity, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LogoutButton from '@/components/LogoutButton';

const DashboardHeader: React.FC = () => {
  const { user } = useAuth();
  const { companyName, tagline, logoUrl, isBrandingActive } = useBranding();
  const navigate = useNavigate();
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getUserDisplayName = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    return user?.email?.split('@')[0] || 'User';
  };

  return (
    <>
      <LogoutButton />
      <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Logo and Company Branding */}
              <div className="flex items-center gap-3">
                {isBrandingActive && logoUrl && (
                  <img 
                    src={logoUrl} 
                    alt={`${companyName} Logo`}
                    className="h-12 w-auto object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
                <div>
                  <h1 className="text-2xl font-bold mb-2">
                    {getGreeting()}, {getUserDisplayName()}!
                  </h1>
                  <p className="text-blue-100 mb-4">
                    Welcome to your {isBrandingActive ? companyName : 'FleetIQ'} {isBrandingActive ? tagline : 'GPS51 Management Platform'}
                  </p>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                        GPS51 Active
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      <span className="text-sm text-blue-100">Real-time tracking enabled</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                <Settings className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                <User className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default DashboardHeader;
