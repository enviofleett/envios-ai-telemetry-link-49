import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Users, Car, BarChart3, Settings, Menu, LogOut, Shield, Database, FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

const Navigation = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = React.useState(false);
  const { user, isAdmin, signOut } = useAuth();

  const navItems = [
    { href: '/', label: 'Dashboard', icon: BarChart3, adminOnly: false },
    { href: '/users', label: 'User Management', icon: Users, adminOnly: true },
    { href: '/vehicles', label: 'Vehicle Management', icon: Car, adminOnly: false },
    { href: '/bulk-extraction', label: 'Bulk Extraction', icon: Database, adminOnly: true },
    { href: '/data-import-review', label: 'Import Review', icon: FileCheck, adminOnly: true },
    { href: '/settings', label: 'Settings', icon: Settings, adminOnly: false },
  ];

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  const NavContent = () => (
    <nav className="flex flex-col space-y-2">
      {navItems
        .filter(item => !item.adminOnly || isAdmin)
        .map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-blue-100 text-blue-700 font-medium' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => setIsOpen(false)}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
              {item.adminOnly && (
                <Shield className="h-4 w-4 text-orange-500" />
              )}
            </Link>
          );
        })}
      
      <div className="pt-4 border-t border-gray-200">
        <Button
          variant="ghost"
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={handleSignOut}
        >
          <LogOut className="h-5 w-5 mr-2" />
          Sign Out
        </Button>
      </div>
    </nav>
  );

  return (
    <>
      {/* Desktop Navigation */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:bg-white md:border-r md:border-gray-200">
        <div className="flex-1 flex flex-col min-h-0 pt-5 pb-4">
          <div className="flex items-center flex-shrink-0 px-4">
            <h1 className="text-xl font-bold text-gray-900">Envio Console</h1>
            {isAdmin && (
              <Badge variant="secondary" className="ml-2 text-xs">
                Admin
              </Badge>
            )}
          </div>
          <div className="flex-1 flex flex-col overflow-y-auto mt-8">
            <NavContent />
          </div>
          {user && (
            <div className="flex-shrink-0 px-4 py-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Signed in as: <span className="font-medium">{user.email}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-gray-900">Envio Console</h1>
            {isAdmin && (
              <Badge variant="secondary" className="text-xs">
                Admin
              </Badge>
            )}
          </div>
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <div className="py-4">
                <NavContent />
                {user && (
                  <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-600">
                    Signed in as: <span className="font-medium">{user.email}</span>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </>
  );
};

export default Navigation;
