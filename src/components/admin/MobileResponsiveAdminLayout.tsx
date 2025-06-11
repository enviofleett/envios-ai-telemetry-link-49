
import React, { useState } from 'react';
import { SettingsSidebar } from './SettingsSidebar';
import AdminTabContentRenderer from './AdminTabContentRenderer';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';

interface MobileResponsiveAdminLayoutProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const MobileResponsiveAdminLayout: React.FC<MobileResponsiveAdminLayoutProps> = ({ 
  activeTab, 
  onTabChange 
}) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleTabChange = (tab: string) => {
    onTabChange(tab);
    setIsMobileSidebarOpen(false); // Close mobile sidebar when tab changes
  };

  console.log('MobileResponsiveAdminLayout rendering with activeTab:', activeTab);

  return (
    <div className="flex h-full min-h-[calc(100vh-8rem)]">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <SettingsSidebar 
          activeTab={activeTab} 
          onTabChange={onTabChange} 
        />
      </div>

      {/* Mobile Sidebar */}
      <div className="md:hidden">
        <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="fixed top-20 left-4 z-40 md:hidden"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-80">
            <SettingsSidebar 
              activeTab={activeTab} 
              onTabChange={handleTabChange} 
            />
          </SheetContent>
        </Sheet>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-4 md:p-6 pt-16 md:pt-6">
          <AdminTabContentRenderer activeTab={activeTab} />
        </div>
      </div>
    </div>
  );
};

export default MobileResponsiveAdminLayout;
