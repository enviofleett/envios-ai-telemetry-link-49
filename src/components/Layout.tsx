
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-background">
      <main className="flex-1 p-4 md:p-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
