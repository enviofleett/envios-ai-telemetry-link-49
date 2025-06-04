
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Users, Car, BarChart3, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const Navigation = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = React.useState(false);

  const navItems = [
    { href: '/', label: 'Dashboard', icon: BarChart3 },
    { href: '/users', label: 'User Management', icon: Users },
    { href: '/vehicles', label: 'Vehicle Management', icon: Car },
  ];

  const NavContent = () => (
    <nav className="flex flex-col space-y-2">
      {navItems.map((item) => {
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
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Desktop Navigation */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:bg-white md:border-r md:border-gray-200">
        <div className="flex-1 flex flex-col min-h-0 pt-5 pb-4">
          <div className="flex items-center flex-shrink-0 px-4">
            <h1 className="text-xl font-bold text-gray-900">Envio Console</h1>
          </div>
          <div className="flex-1 flex flex-col overflow-y-auto mt-8">
            <NavContent />
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">Envio Console</h1>
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <div className="py-4">
                <NavContent />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </>
  );
};

export default Navigation;
