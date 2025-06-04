
import React from 'react';
import Navigation from '@/components/Navigation';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="md:pl-64">
        <main className="flex-1">
          <div className="p-4 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
