
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertTriangle, Info, RefreshCw } from 'lucide-react';

interface ValidationError {
  code: string;
  message: string;
  details: string;
  suggestions: string[];
  category: 'network' | 'authentication' | 'configuration' | 'api' | 'validation';
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface ValidationFeedbackProps {
  error?: ValidationError;
  success?: boolean;
  successMessage?: string;
  isLoading?: boolean;
  onRetry?: () => void;
  onSuggestionClick?: (suggestion: string) => void;
}

export const ValidationFeedback: React.FC<ValidationFeedbackProps> = ({
  error,
  success,
  successMessage,
  isLoading,
  onRetry,
  onSuggestionClick
}) => {
  if (isLoading) {
    return (
      <Alert>
        <RefreshCw className="h-4 w-4 animate-spin" />
        <AlertDescription>
          Validating connection...
        </AlertDescription>
      </Alert>
    );
  }

  if (success) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          {successMessage || 'Connection validated successfully!'}
        </AlertDescription>
      </Alert>
    );
  }

  if (!error) {
    return null;
  }

  const getIcon = () => {
    switch (error.severity) {
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'high':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getAlertVariant = () => {
    switch (error.severity) {
      case 'critical':
      case 'high':
        return 'destructive' as const;
      default:
        return 'default' as const;
    }
  };

  const getCategoryColor = () => {
    switch (error.category) {
      case 'network':
        return 'bg-red-100 text-red-800';
      case 'authentication':
        return 'bg-orange-100 text-orange-800';
      case 'configuration':
        return 'bg-blue-100 text-blue-800';
      case 'api':
        return 'bg-purple-100 text-purple-800';
      case 'validation':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      <Alert variant={getAlertVariant()}>
        {getIcon()}
        <AlertDescription className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="font-medium">{error.message}</span>
            <Badge className={getCategoryColor()}>
              {error.category}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {error.code}
            </Badge>
          </div>
          
          <p className="text-sm opacity-90">
            {error.details}
          </p>
          
          {error.suggestions.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Suggested solutions:</p>
              <ul className="space-y-1">
                {error.suggestions.map((suggestion, index) => (
                  <li key={index} className="text-sm">
                    <button
                      onClick={() => onSuggestionClick?.(suggestion)}
                      className="text-left hover:underline cursor-pointer"
                    >
                      • {suggestion}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {onRetry && (
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="w-full"
              >
                <RefreshCw className="h-3 w-3 mr-2" />
                Try Again
              </Button>
            </div>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
};
