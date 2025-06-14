
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import type { TestButtonProps } from '../types/connectionTesting';

const TestButton: React.FC<TestButtonProps> = ({
  onClick,
  disabled,
  isLoading,
  loadingText = "Testing...",
  idleText,
  IconComponent,
  authLoading
}) => {
  const effectiveIsLoading = isLoading || authLoading;
  return (
    <Button
      onClick={onClick}
      disabled={disabled || effectiveIsLoading}
      variant="outline"
      size="sm"
    >
      {effectiveIsLoading ? (
        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <IconComponent className="h-4 w-4 mr-2" />
      )}
      {effectiveIsLoading ? loadingText : idleText}
    </Button>
  );
};

export default TestButton;
