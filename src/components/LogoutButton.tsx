
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkshopAuth } from '@/hooks/useWorkshopAuth';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

const LogoutButton: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { workshopUser, logout: workshopLogout } = useWorkshopAuth();
  const { toast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Determine if we're in workshop context
  const isWorkshopContext = location.pathname.startsWith('/workshop') || workshopUser;
  const isAuthenticated = user || workshopUser;

  // Don't show logout button if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const handleLogout = async () => {
    setIsLoggingOut(true);
    
    try {
      if (isWorkshopContext && workshopUser) {
        // Workshop logout
        await workshopLogout();
        navigate('/workshop-login');
        toast({
          title: "Logged Out",
          description: "You have been successfully logged out from the workshop."
        });
      } else if (user) {
        // Regular user logout
        await signOut();
        navigate('/login');
        toast({
          title: "Logged Out", 
          description: "You have been successfully logged out."
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Logout Error",
        description: "There was an error logging out. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getUserDisplayName = () => {
    if (workshopUser) {
      return workshopUser.name || workshopUser.email;
    }
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    return user?.email?.split('@')[0] || 'User';
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="bg-white/90 backdrop-blur-sm border-gray-200 hover:bg-white shadow-sm"
          disabled={isLoggingOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          {isLoggingOut ? 'Logging out...' : 'Logout'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to logout, {getUserDisplayName()}? You will be redirected to the login page.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoggingOut ? 'Logging out...' : 'Yes, Logout'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default LogoutButton;
