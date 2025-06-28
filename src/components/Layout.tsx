
import React from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from '@/components/AppSidebar';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { useLocation } from 'react-router-dom';
import LogoutButton from '@/components/LogoutButton';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  const getBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [{ name: 'Dashboard', path: '/' }];
    
    const routeNames: { [key: string]: string } = {
      'gps51': 'GPS51 Platform',
      'tracking': 'Live Tracking',
      'devices': 'Device Management',
      'history': 'Trip History',
      'analytics': 'Route Analytics',
      'geofences': 'Geofencing',
      'reports': 'Reports',
      'dashboard': 'Dashboard',
      'fleet': 'Fleet Management',
      'vehicles': 'Vehicle Management',
      'users': 'User Management',
      'settings': 'Settings',
      'system-import': 'System Import',
      'device-configuration': 'Device Configuration',
      'maintenance': 'Maintenance',
      'workshop-management': 'Workshop Management',
      'marketplace': 'Workshop Marketplace',
      'packages': 'Package Management',
      'services': 'Active Services'
    };

    pathSegments.forEach((segment, index) => {
      const path = '/' + pathSegments.slice(0, index + 1).join('/');
      const name = routeNames[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
      breadcrumbs.push({ name, path });
    });

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-gray-900">
        <AppSidebar />
        <SidebarInset className="flex-1">
          {/* Header with breadcrumb and logout button */}
          <header className="h-16 flex items-center justify-between gap-4 bg-gray-800 border-b border-gray-700 px-6 shadow-sm">
            <div className="flex items-center gap-4 flex-1">
              <SidebarTrigger className="w-10 h-10 p-2 rounded hover:bg-gray-700 text-gray-300" />
              
              <Breadcrumb>
                <BreadcrumbList className="text-sm">
                  {breadcrumbs.map((breadcrumb, index) => (
                    <React.Fragment key={breadcrumb.path}>
                      <BreadcrumbItem>
                        {index === breadcrumbs.length - 1 ? (
                          <BreadcrumbPage className="text-white font-semibold text-lg">
                            {breadcrumb.name}
                          </BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink 
                            href={breadcrumb.path}
                            className="text-gray-400 hover:text-white font-medium"
                          >
                            {breadcrumb.name}
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                      {index < breadcrumbs.length - 1 && (
                        <BreadcrumbSeparator className="mx-2">
                          <span className="text-gray-500">›</span>
                        </BreadcrumbSeparator>
                      )}
                    </React.Fragment>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            
            {/* Logout button in header */}
            <LogoutButton />
          </header>
          
          {/* Main content area with full width and consistent padding */}
          <main className="flex-1 bg-gray-900 min-h-[calc(100vh-4rem)]">
            <div className="w-full h-full p-6">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Layout;
