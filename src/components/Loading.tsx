
import React from 'react';
import { Loader } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface LoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'inline' | 'card' | 'fullscreen';
}

export default function Loading({ 
  message = "Loading...", 
  size = 'md',
  variant = 'inline' 
}: LoadingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  const LoadingSpinner = () => (
    <div className="flex items-center justify-center gap-2">
      <Loader className={`animate-spin text-primary ${sizeClasses[size]}`} />
      {message && (
        <span className="text-sm text-muted-foreground font-medium">
          {message}
        </span>
      )}
    </div>
  );

  if (variant === 'fullscreen') {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <Card className="w-auto">
          <CardContent className="p-6">
            <LoadingSpinner />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  return <LoadingSpinner />;
}
