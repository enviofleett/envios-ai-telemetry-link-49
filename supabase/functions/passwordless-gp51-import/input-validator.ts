
export interface ValidationResult {
  isValid: boolean;
  error?: string;
  validUsernames?: string[];
}

export function validatePasswordlessImportInput(requestBody: any): ValidationResult {
  const { jobName, targetUsernames } = requestBody;

  // Enhanced input validation
  if (!jobName || typeof jobName !== 'string' || jobName.trim().length === 0) {
    console.error('Invalid jobName:', jobName);
    return {
      isValid: false,
      error: 'Invalid job name. Must be a non-empty string.'
    };
  }

  if (!targetUsernames || !Array.isArray(targetUsernames) || targetUsernames.length === 0) {
    console.error('Invalid targetUsernames:', targetUsernames);
    return {
      isValid: false,
      error: 'Invalid target usernames. Must be a non-empty array.'
    };
  }

  // Filter and validate usernames
  const validUsernames = targetUsernames
    .filter(username => username && typeof username === 'string' && username.trim().length > 0)
    .map(username => username.trim());

  if (validUsernames.length === 0) {
    console.error('No valid usernames found');
    return {
      isValid: false,
      error: 'No valid usernames provided.'
    };
  }

  return {
    isValid: true,
    validUsernames
  };
}
