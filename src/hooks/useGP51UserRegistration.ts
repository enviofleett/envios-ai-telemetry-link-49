
import { useState } from 'react';
import { GP51UserRegistrationService, GP51UserCreationData, GP51UserCreationResult } from '@/services/gp51/GP51UserRegistrationService';

export const useGP51UserRegistration = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);

  const createGP51User = async (userData: GP51UserCreationData): Promise<GP51UserCreationResult> => {
    setIsCreating(true);
    try {
      // Validate user data first
      const validation = await GP51UserRegistrationService.validateUserData(userData);
      if (!validation.valid) {
        return {
          success: false,
          error: `Validation failed: ${validation.errors.join(', ')}`,
          errorCode: 'VALIDATION_ERROR'
        };
      }

      // Create the GP51 user
      const result = await GP51UserRegistrationService.createGP51User(userData);
      return result;

    } catch (error) {
      console.error('Error in useGP51UserRegistration:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during user creation',
        errorCode: 'HOOK_ERROR'
      };
    } finally {
      setIsCreating(false);
    }
  };

  const checkUsernameAvailability = async (username: string): Promise<{ available: boolean; error?: string }> => {
    setIsCheckingUsername(true);
    try {
      const result = await GP51UserRegistrationService.checkUsernameAvailability(username);
      return result;
    } catch (error) {
      console.error('Error checking username availability:', error);
      return {
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error during username check'
      };
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const validateUserData = async (userData: GP51UserCreationData) => {
    return await GP51UserRegistrationService.validateUserData(userData);
  };

  return {
    createGP51User,
    checkUsernameAvailability,
    validateUserData,
    isCreating,
    isCheckingUsername
  };
};
