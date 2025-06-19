
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { SecurityService, SecurityEvent } from '@/services/security/SecurityService';
import ErrorBoundary from '@/components/error/ErrorBoundary';
import NetworkErrorBoundary from '@/components/error/NetworkErrorBoundary';

interface SecurityContextType {
  securityEvents: SecurityEvent[];
  logSecurityEvent: (event: Omit<SecurityEvent, 'id' | 'timestamp'>) => void;
  validateInput: typeof SecurityService.validateInput;
  checkRateLimit: typeof SecurityService.checkRateLimit;
  hasPermission: typeof SecurityService.hasPermission;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const useSecurityContext = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurityContext must be used within a SecurityProvider');
  }
  return context;
};

interface SecurityProviderProps {
  children: ReactNode;
}

export const SecurityProvider: React.FC<SecurityProviderProps> = ({ children }) => {
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);

  useEffect(() => {
    // Initialize security monitoring
    console.log('🔒 Security monitoring initialized');
    
    // Set up periodic security event cleanup
    const cleanup = setInterval(() => {
      const events = SecurityService.getSecurityEvents({ hours: 24, limit: 100 });
      setSecurityEvents(events);
    }, 60000); // Every minute

    return () => {
      clearInterval(cleanup);
    };
  }, []);

  const logSecurityEvent = (event: Omit<SecurityEvent, 'id' | 'timestamp'>) => {
    SecurityService.logSecurityEvent(event);
    
    // Update local state
    const events = SecurityService.getSecurityEvents({ hours: 24, limit: 100 });
    setSecurityEvents(events);
  };

  const contextValue: SecurityContextType = {
    securityEvents,
    logSecurityEvent,
    validateInput: SecurityService.validateInput,
    checkRateLimit: SecurityService.checkRateLimit,
    hasPermission: SecurityService.hasPermission
  };

  return (
    <SecurityContext.Provider value={contextValue}>
      <ErrorBoundary>
        <NetworkErrorBoundary>
          {children}
        </NetworkErrorBoundary>
      </ErrorBoundary>
    </SecurityContext.Provider>
  );
};

export default SecurityProvider;
