
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
      'fleet': 'Fleet Management',
      'vehicles': 'Vehicle Management',
      'tracking': 'Live Tracking',
      'users': 'User Management',
      'settings': 'Settings',
      'system-import': 'System Import',
      'device-configuration': 'Device Configuration',
      'maintenance': 'Maintenance',
      'workshop-management': 'Workshop Management',
      'marketplace': 'Workshop Marketplace',
      'reports': 'Reports & Analytics',
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
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <SidebarInset className="flex-1">
          {/* Header with breadcrumb and logout button */}
          <header className="h-16 flex items-center justify-between gap-4 bg-background border-b border-border px-6 shadow-sm">
            <div className="flex items-center gap-4 flex-1">
              <SidebarTrigger className="w-10 h-10 p-2 rounded hover:bg-accent text-foreground" />
              
              <Breadcrumb>
                <BreadcrumbList className="text-sm">
                  {breadcrumbs.map((breadcrumb, index) => (
                    <React.Fragment key={breadcrumb.path}>
                      <BreadcrumbItem>
                        {index === breadcrumbs.length - 1 ? (
                          <BreadcrumbPage className="text-foreground font-semibold text-lg">
                            {breadcrumb.name}
                          </BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink 
                            href={breadcrumb.path}
                            className="text-muted-foreground hover:text-foreground font-medium"
                          >
                            {breadcrumb.name}
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                      {index < breadcrumbs.length - 1 && (
                        <BreadcrumbSeparator className="mx-2">
                          <span className="text-muted-foreground">›</span>
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
          <main className="flex-1 bg-background min-h-[calc(100vh-4rem)]">
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
