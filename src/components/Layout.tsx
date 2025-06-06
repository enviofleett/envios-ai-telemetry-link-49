
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
      <div className="min-h-screen flex w-full bg-gray-50">
        <AppSidebar />
        <SidebarInset className="flex-1">
          {/* Header with breadcrumb - matches reference design */}
          <header className="h-16 flex items-center gap-4 bg-white border-b border-gray-200 px-6 shadow-sm">
            <SidebarTrigger className="w-10 h-10 p-2 rounded hover:bg-gray-100 text-gray-700" />
            
            <div className="flex-1">
              <Breadcrumb>
                <BreadcrumbList className="text-sm">
                  {breadcrumbs.map((breadcrumb, index) => (
                    <React.Fragment key={breadcrumb.path}>
                      <BreadcrumbItem>
                        {index === breadcrumbs.length - 1 ? (
                          <BreadcrumbPage className="text-gray-900 font-semibold text-lg">
                            {breadcrumb.name}
                          </BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink 
                            href={breadcrumb.path}
                            className="text-gray-500 hover:text-gray-700 font-medium"
                          >
                            {breadcrumb.name}
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                      {index < breadcrumbs.length - 1 && (
                        <BreadcrumbSeparator className="mx-2">
                          <span className="text-gray-400">›</span>
                        </BreadcrumbSeparator>
                      )}
                    </React.Fragment>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          
          {/* Main content area with proper dimensions */}
          <main className="flex-1 bg-gray-50 min-h-[calc(100vh-4rem)]">
            <div className="max-w-[1400px] mx-auto p-6">
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
