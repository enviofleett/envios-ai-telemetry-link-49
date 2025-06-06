
import React from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from '@/components/AppSidebar';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { useLocation } from 'react-router-dom';

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
      'system-import': 'System Import'
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
          {/* Enhanced Header with modern styling */}
          <header className="h-16 flex items-center gap-4 bg-card border-b border-border px-4 lg:px-6 shadow-sm sticky top-0 z-10 backdrop-blur-sm bg-card/95">
            <SidebarTrigger className="w-10 h-10 p-2 rounded-lg hover:bg-accent text-foreground transition-colors duration-200" />
            
            <div className="flex-1 min-w-0">
              <Breadcrumb>
                <BreadcrumbList className="text-sm">
                  {breadcrumbs.map((breadcrumb, index) => (
                    <React.Fragment key={breadcrumb.path}>
                      <BreadcrumbItem>
                        {index === breadcrumbs.length - 1 ? (
                          <BreadcrumbPage className="text-foreground font-semibold text-base lg:text-lg truncate">
                            {breadcrumb.name}
                          </BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink 
                            href={breadcrumb.path}
                            className="text-muted-foreground hover:text-foreground font-medium transition-colors duration-200 truncate"
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

            {/* Optional: Add user profile or notifications here */}
            <div className="hidden sm:flex items-center gap-2">
              {/* Future: Add user avatar, notifications, etc. */}
            </div>
          </header>
          
          {/* Enhanced Main content area */}
          <main className="flex-1 bg-background min-h-[calc(100vh-4rem)]">
            <div className="container-responsive py-6 animate-slide-in-up">
              <div className="w-full">
                {children}
              </div>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Layout;
