
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateDeviceIds(deviceIds: any): ValidationResult {
  const errors: string[] = [];
  
  if (!Array.isArray(deviceIds)) {
    errors.push('Device IDs must be an array');
    return { isValid: false, errors };
  }
  
  if (deviceIds.length === 0) {
    errors.push('At least one device ID is required');
    return { isValid: false, errors };
  }
  
  deviceIds.forEach((id, index) => {
    if (typeof id !== 'string') {
      errors.push(`Device ID at index ${index} must be a string`);
    } else if (id.trim().length === 0) {
      errors.push(`Device ID at index ${index} cannot be empty`);
    }
  });
  
  return { isValid: errors.length === 0, errors };
}

export function validateUsername(username: any): ValidationResult {
  const errors: string[] = [];
  
  if (typeof username !== 'string') {
    errors.push('Username must be a string');
  } else if (username.trim().length === 0) {
    errors.push('Username cannot be empty');
  } else if (username.length > 100) {
    errors.push('Username cannot exceed 100 characters');
  }
  
  return { isValid: errors.length === 0, errors };
}

export function validateTimeRange(beginTime: any, endTime: any): ValidationResult {
  const errors: string[] = [];
  const timeFormat = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
  
  if (typeof beginTime !== 'string') {
    errors.push('Begin time must be a string');
  } else if (!timeFormat.test(beginTime)) {
    errors.push('Begin time must be in format YYYY-MM-DD HH:mm:ss');
  }
  
  if (typeof endTime !== 'string') {
    errors.push('End time must be a string');
  } else if (!timeFormat.test(endTime)) {
    errors.push('End time must be in format YYYY-MM-DD HH:mm:ss');
  }
  
  if (errors.length === 0) {
    const beginDate = new Date(beginTime);
    const endDate = new Date(endTime);
    
    if (isNaN(beginDate.getTime())) {
      errors.push('Begin time is not a valid date');
    }
    
    if (isNaN(endDate.getTime())) {
      errors.push('End time is not a valid date');
    }
    
    if (beginDate >= endDate) {
      errors.push('Begin time must be before end time');
    }
    
    // Check if time range is reasonable (not more than 30 days)
    const diffDays = (endDate.getTime() - beginDate.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > 30) {
      errors.push('Time range cannot exceed 30 days');
    }
  }
  
  return { isValid: errors.length === 0, errors };
}

export function validateCredentials(credentials: any): ValidationResult {
  const errors: string[] = [];
  
  if (!credentials || typeof credentials !== 'object') {
    errors.push('Credentials must be an object');
    return { isValid: false, errors };
  }
  
  const usernameValidation = validateUsername(credentials.username);
  if (!usernameValidation.isValid) {
    errors.push(...usernameValidation.errors);
  }
  
  if (typeof credentials.password !== 'string') {
    errors.push('Password must be a string');
  } else if (credentials.password.length === 0) {
    errors.push('Password cannot be empty');
  } else if (credentials.password.length < 3) {
    errors.push('Password must be at least 3 characters long');
  }
  
  return { isValid: errors.length === 0, errors };
}
