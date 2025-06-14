import type { GP51AuthStatus } from '@/hooks/useGP51Auth'; // Assuming this type exists or creating a similar one

export interface ConnectionTestResult {
  success: boolean;
  error?: string;
  details?: string;
  data?: {
    total_devices: number;
    total_positions: number;
    fetched_at: string;
  };
  timestamp?: Date;
}

export interface GP51SessionStatusDisplayProps extends GP51AuthStatus {
  // authLoading, isAuthenticated, username, tokenExpiresAt are part of GP51AuthStatus
}

export interface TestResultAlertProps {
  result: ConnectionTestResult | null;
  testType: 'API_CONNECTION' | 'LIVE_DATA';
}

export interface ConnectionStatusBadgeProps {
  result: ConnectionTestResult | null;
  isLoading: boolean;
  authLoading: boolean;
}

export interface TestButtonProps {
  onClick: () => void;
  disabled: boolean;
  isLoading: boolean;
  loadingText?: string;
  idleText: string;
  IconComponent: React.ElementType;
  authLoading: boolean;
}

export interface GP51ApiConnectionTestProps {
  isGp51Authenticated: boolean;
  authLoading: boolean;
  onTestResult: (result: ConnectionTestResult) => void;
}

export interface GP51LiveDataFetchTestProps {
  isGp51Authenticated: boolean;
  authLoading: boolean;
  isApiTestSuccessful: boolean | undefined;
}

// This type might be useful if useGP51Auth hook doesn't export a combined status type
export interface GP51AuthStatusForDisplay {
  isAuthenticated: boolean;
  username?: string;
  tokenExpiresAt?: Date;
  isLoading: boolean; // Renamed from authLoading for clarity within the component
}

export interface GP51AuthStatus {
  isAuthenticated: boolean;
  username?: string;
  tokenExpiresAt?: Date;
  isLoading: boolean;
  error: string | null;
  isRestoringSession: boolean; // Added from useGP51Auth hook
}

export interface GP51SessionStatusDisplayProps extends Omit<GP51AuthStatus, 'error' | 'isRestoringSession'> {
  // Currently, error and isRestoringSession are not directly used by the display component.
  // If they were, they could be included here or the Omit could be adjusted.
  // For now, the component expects isLoading, isAuthenticated, username, tokenExpiresAt.
}
