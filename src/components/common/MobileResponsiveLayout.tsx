
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, X, ChevronDown, Home, Settings, User, LogOut } from 'lucide-react';

interface NavigationItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  children?: NavigationItem[];
  badge?: string | number;
}

interface MobileResponsiveLayoutProps {
  children: React.ReactNode;
  navigationItems: NavigationItem[];
  headerContent?: React.ReactNode;
  footerContent?: React.ReactNode;
  sidebarContent?: React.ReactNode;
  title?: string;
  showSidebar?: boolean;
  onNavigate?: (item: NavigationItem) => void;
}

const MobileResponsiveLayout: React.FC<MobileResponsiveLayoutProps> = ({
  children,
  navigationItems,
  headerContent,
  footerContent,
  sidebarContent,
  title = "Dashboard",
  showSidebar = true,
  onNavigate
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const handleItemClick = (item: NavigationItem) => {
    if (item.children && item.children.length > 0) {
      toggleExpanded(item.id);
    } else {
      if (item.onClick) {
        item.onClick();
      }
      if (onNavigate) {
        onNavigate(item);
      }
      setSidebarOpen(false);
    }
  };

  const renderNavigationItem = (item: NavigationItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);
    const paddingLeft = level * 16 + 16;

    return (
      <div key={item.id}>
        <button
          onClick={() => handleItemClick(item)}
          className={`w-full flex items-center justify-between py-3 px-4 text-left hover:bg-gray-100 transition-colors ${
            level > 0 ? 'border-l-2 border-gray-200' : ''
          }`}
          style={{ paddingLeft: `${paddingLeft}px` }}
        >
          <div className="flex items-center gap-3">
            {item.icon && (
              <span className="text-gray-600">{item.icon}</span>
            )}
            <span className="font-medium text-gray-900">{item.label}</span>
            {item.badge && (
              <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                {item.badge}
              </span>
            )}
          </div>
          {hasChildren && (
            <ChevronDown
              className={`h-4 w-4 text-gray-600 transition-transform ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          )}
        </button>
        
        {hasChildren && isExpanded && (
          <div className="bg-gray-50">
            {item.children?.map(child => renderNavigationItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const SidebarContent = () => (
    <div className="h-full flex flex-col">
      {/* Sidebar Header */}
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto">
        <nav className="py-4">
          {navigationItems.map(item => renderNavigationItem(item))}
        </nav>
        
        {/* Custom Sidebar Content */}
        {sidebarContent && (
          <div className="px-4 pb-4">
            {sidebarContent}
          </div>
        )}
      </div>

      {/* Sidebar Footer */}
      {footerContent && (
        <div className="p-4 border-t">
          {footerContent}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      {isMobile && (
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-3">
            {showSidebar && (
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-80">
                  <SidebarContent />
                </SheetContent>
              </Sheet>
            )}
            <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
          </div>
          
          {headerContent && (
            <div className="flex items-center gap-2">
              {headerContent}
            </div>
          )}
        </header>
      )}

      <div className="flex">
        {/* Desktop Sidebar */}
        {!isMobile && showSidebar && (
          <aside className="w-64 bg-white border-r border-gray-200 h-screen sticky top-0">
            <SidebarContent />
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 min-h-screen">
          {/* Desktop Header */}
          {!isMobile && headerContent && (
            <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-30">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                <div className="flex items-center gap-4">
                  {headerContent}
                </div>
              </div>
            </header>
          )}

          {/* Page Content */}
          <div className={`${isMobile ? 'p-4' : 'p-6'}`}>
            {children}
          </div>

          {/* Mobile Footer */}
          {isMobile && footerContent && (
            <footer className="bg-white border-t border-gray-200 p-4 sticky bottom-0">
              {footerContent}
            </footer>
          )}
        </main>
      </div>
    </div>
  );
};

export default MobileResponsiveLayout;
