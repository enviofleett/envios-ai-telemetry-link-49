
import React, { ReactNode } from 'react';
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import ErrorBoundary from './ErrorBoundary';
import LoadingFallback from './LoadingFallback';

interface SafeQueryWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  loadingMessage?: string;
}

const SafeQueryWrapper: React.FC<SafeQueryWrapperProps> = ({
  children,
  fallback,
  loadingMessage = 'Loading data...'
}) => {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onError={(error, errorInfo) => {
            console.error('Query error:', error, errorInfo);
          }}
          fallback={fallback || <LoadingFallback message={loadingMessage} fullScreen />}
        >
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
};

export default SafeQueryWrapper;
