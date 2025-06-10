
import { useState, useEffect } from 'react';
import { enhancedGP51SessionManager } from '@/services/gp51/enhancedGP51SessionManager';

export const useGP51Connection = (user: any) => {
  const [gp51Connected, setGp51Connected] = useState(false);

  const checkGP51Connection = async () => {
    if (user) {
      const isValid = enhancedGP51SessionManager.isSessionValid();
      if (!isValid) {
        const restored = await enhancedGP51SessionManager.restoreSession();
        setGp51Connected(restored);
      } else {
        setGp51Connected(true);
      }
    } else {
      setGp51Connected(false);
    }
  };

  const connectGP51 = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const result = await enhancedGP51SessionManager.authenticateAndPersist(username, password);
    if (result.success) {
      setGp51Connected(true);
    }
    return result;
  };

  const disconnectGP51 = async (): Promise<void> => {
    await enhancedGP51SessionManager.clearSession();
    setGp51Connected(false);
  };

  useEffect(() => {
    if (user) {
      checkGP51Connection();
    }
  }, [user]);

  return {
    gp51Connected,
    connectGP51,
    disconnectGP51
  };
};
