import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Menu, Settings, LogOut } from 'lucide-react';
import LogoutButton from '@/components/LogoutButton';
import { FeatureRestrictedLink } from "@/components/common/FeatureRestrictedLink";

// This component is now used as fallback/mobile navigation
// The main sidebar is handled by AppSidebar component
const Navigation = () => {
  const { signOut, user, isAdmin } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
      window.location.reload();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const navigationItems = [
    { name: "Dashboard", href: "/" },
    { name: "Vehicle Management", href: "/vehicles", featureId: "vehicle_management" },
    { name: "User Management", href: "/users", featureId: "user_management" },
    ...(isAdmin ? [{ name: "System Import", href: "/system-import", featureId: "system_import" }] : []),
    { name: "Settings", href: "/settings" },
  ];

  return (
    <>
      <LogoutButton />
      <nav className="bg-white shadow-sm border-b md:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden"
              >
                <Menu className="h-6 w-6" />
              </Button>
              <h1 className="ml-2 text-xl font-bold text-gray-900">Envío Console</h1>
            </div>

            <div className="flex items-center">
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="outline-none focus:outline-none rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                        <AvatarFallback>{user?.email[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 mr-2">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/settings" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2">
                      <LogOut className="h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t">
                {navigationItems.map((item) => {
                  if (item.featureId) {
                    return (
                      <FeatureRestrictedLink key={item.name} featureId={item.featureId}>
                        <Link
                          to={item.href}
                          className={`block px-3 py-2 rounded-md text-base font-medium ${
                            location.pathname === item.href
                              ? 'bg-blue-50 text-blue-700 border-blue-500'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                          }`}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {item.name}
                        </Link>
                      </FeatureRestrictedLink>
                    );
                  }
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`block px-3 py-2 rounded-md text-base font-medium ${
                        location.pathname === item.href
                          ? 'bg-blue-50 text-blue-700 border-blue-500'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
};

export default Navigation;
