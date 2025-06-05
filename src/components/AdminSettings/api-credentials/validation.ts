
import type { ApiCredentialForm, CredentialValidationResult } from './types';

export const validateCredential = (credential: ApiCredentialForm): CredentialValidationResult => {
  const errors: string[] = [];

  // Name validation
  if (!credential.name || credential.name.trim().length < 3) {
    errors.push('Name must be at least 3 characters long');
  }

  // Provider validation
  if (!credential.provider || credential.provider.trim().length < 2) {
    errors.push('Provider must be specified');
  }

  // Type-specific validation
  switch (credential.credential_type) {
    case 'api_key':
      if (!credential.api_key || credential.api_key.trim().length < 10) {
        errors.push('API Key must be at least 10 characters long');
      }
      break;
    
    case 'oauth':
      if (!credential.client_id || credential.client_id.trim().length < 5) {
        errors.push('Client ID is required for OAuth');
      }
      if (!credential.client_secret || credential.client_secret.trim().length < 10) {
        errors.push('Client Secret is required for OAuth');
      }
      break;
    
    case 'basic_auth':
      if (!credential.api_key || credential.api_key.trim().length < 3) {
        errors.push('Username is required for Basic Auth');
      }
      if (!credential.secret_key || credential.secret_key.trim().length < 3) {
        errors.push('Password is required for Basic Auth');
      }
      break;
    
    case 'jwt':
      if (!credential.secret_key || credential.secret_key.trim().length < 20) {
        errors.push('JWT Secret must be at least 20 characters long');
      }
      break;
  }

  // Expiration date validation
  if (credential.expires_at) {
    const expirationDate = new Date(credential.expires_at);
    const now = new Date();
    if (expirationDate <= now) {
      errors.push('Expiration date must be in the future');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const maskCredential = (value: string, visibleChars: number = 4): string => {
  if (!value || value.length <= visibleChars) return value;
  const masked = '*'.repeat(Math.max(0, value.length - visibleChars));
  return masked + value.slice(-visibleChars);
};
