
export interface EmailRequest {
  to: string;
  trigger_type?: string;
  template_variables?: Record<string, string>;
  related_entity_id?: string;
  subject?: string;
  message?: string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  details?: string;
}

export class RequestValidator {
  static validateEmailRequest(requestData: EmailRequest): ValidationResult {
    const { to } = requestData;

    if (!to) {
      return {
        isValid: false,
        error: 'Recipient email is required'
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return {
        isValid: false,
        error: 'Invalid recipient email format'
      };
    }

    return { isValid: true };
  }
}
