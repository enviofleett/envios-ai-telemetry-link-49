
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, Clock } from 'lucide-react';

interface ComingSoonProps {
  pageName: string;
}

const ComingSoon: React.FC<ComingSoonProps> = ({ pageName }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <Clock className="mx-auto h-16 w-16 text-blue-500 mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Coming Soon!</h1>
          <p className="text-xl text-gray-600 mb-2">
            The "{pageName}" page is under construction.
          </p>
          <p className="text-gray-500">
            We're working hard to bring you this feature. Check back soon!
          </p>
        </div>
        
        <Button asChild className="flex items-center gap-2 mx-auto">
          <Link to="/">
            <Home className="h-4 w-4" />
            Go to Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default ComingSoon;
