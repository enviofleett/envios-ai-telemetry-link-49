
export interface PasswordSetRequest {
  username: string;
  newPassword: string;
}

export interface GP51ValidationResult {
  success: boolean;
  token?: string;
  error?: string;
}
