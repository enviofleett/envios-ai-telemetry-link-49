
import { useState, useEffect } from 'react';
import { enhancedGP51SessionManager, SecureGP51Session } from '@/services/security/enhancedGP51SessionManager';
import { useToast } from '@/hooks/use-toast';

export const useSecureGP51Session = () => {
  const [session, setSession] = useState<SecureGP51Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Subscribe to session changes
    const unsubscribe = enhancedGP51SessionManager.subscribe((newSession) => {
      setSession(newSession);
      setIsLoading(false);
    });

    // Check for existing session
    const currentSession = enhancedGP51SessionManager.getCurrentSession();
    if (currentSession) {
      setSession(currentSession);
    }
    setIsLoading(false);

    return unsubscribe;
  }, []);

  const createSecureSession = async (username: string, token: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const newSession = await enhancedGP51SessionManager.createSecureSession(username, token);
      
      toast({
        title: "Secure Session Created",
        description: "GP51 session established with enhanced security",
      });
      
      return newSession;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create secure session';
      setError(errorMessage);
      
      toast({
        title: "Session Creation Failed",
        description: errorMessage,
        variant: "destructive"
      });
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const validateSession = async () => {
    try {
      const validation = await enhancedGP51SessionManager.validateCurrentSession();
      
      if (!validation.isValid) {
        toast({
          title: "Session Security Alert",
          description: `Security issues detected: ${validation.reasons.join(', ')}`,
          variant: "destructive"
        });
      }
      
      return validation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Session validation failed';
      setError(errorMessage);
      throw err;
    }
  };

  const terminateSession = async () => {
    try {
      await enhancedGP51SessionManager.terminateSession();
      
      toast({
        title: "Session Terminated",
        description: "Secure session has been terminated",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to terminate session';
      setError(errorMessage);
      
      toast({
        title: "Termination Failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  return {
    session,
    isLoading,
    error,
    createSecureSession,
    validateSession,
    terminateSession,
    isSecure: session?.riskLevel === 'low',
    riskLevel: session?.riskLevel || 'high'
  };
};
