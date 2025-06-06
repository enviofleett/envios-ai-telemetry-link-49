
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';

const NotFound: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Redirect removed routes to dashboard
    if (location.pathname === '/fleet' || location.pathname === '/vehicles') {
      navigate('/', { replace: true });
    }
  }, [location.pathname, navigate]);

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-gray-300">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mt-4">Page Not Found</h2>
          <p className="text-gray-500 mt-2">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        
        <Button onClick={handleGoHome} className="flex items-center gap-2 mx-auto">
          <Home className="h-4 w-4" />
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
