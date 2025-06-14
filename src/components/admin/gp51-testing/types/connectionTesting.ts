
// Removed import: import type { GP51AuthStatus } from '@/hooks/useGP51Auth';

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

// GP51AuthStatusForDisplay is used by GP51SessionStatusDisplay.tsx
export interface GP51AuthStatusForDisplay {
  isAuthenticated: boolean;
  username?: string;
  tokenExpiresAt?: Date;
  isLoading: boolean; // Renamed from authLoading for clarity within the component
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

// Removed GP51AuthStatus interface as it became unused
// Removed GP51SessionStatusDisplayProps interface as it was redundant
// and GP51SessionStatusDisplay.tsx uses GP51AuthStatusForDisplay directly.
