
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { UserManagementError, createUserManagementError } from '@/types/user-management';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: UserManagementError) => void;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error?: UserManagementError;
}

export class UserErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    const userError = createUserManagementError(
      'VALIDATION_ERROR',
      error.message || 'An unexpected error occurred in the user management system'
    );

    return { 
      hasError: true, 
      error: userError 
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('UserErrorBoundary caught an error:', error, errorInfo);
    
    const userError = createUserManagementError(
      'VALIDATION_ERROR',
      error.message,
      { 
        stack: error.stack,
        componentStack: errorInfo.componentStack 
      }
    );

    if (this.props.onError) {
      this.props.onError(userError);
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              User Management Error
            </h3>
            
            <p className="text-gray-600 mb-4">
              {this.state.error?.message || 'Something went wrong while loading the user management system.'}
            </p>

            {this.state.error?.code && (
              <p className="text-xs text-gray-500 mb-4 font-mono">
                Error Code: {this.state.error.code}
              </p>
            )}
            
            <div className="flex gap-3 justify-center">
              <Button 
                onClick={this.handleRetry}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
              
              <Button 
                onClick={this.handleGoHome}
                className="flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                Go Home
              </Button>
            </div>

            {this.state.error?.details && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Technical Details
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto max-h-32">
                  {JSON.stringify(this.state.error.details, null, 2)}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default UserErrorBoundary;
