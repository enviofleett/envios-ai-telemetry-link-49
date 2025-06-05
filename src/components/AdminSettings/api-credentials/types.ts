
export interface ApiCredential {
  id: string;
  name: string;
  credential_type: 'api_key' | 'oauth' | 'jwt' | 'basic_auth';
  provider: string;
  api_key?: string;
  secret_key?: string;
  client_id?: string;
  client_secret?: string;
  additional_config?: Record<string, any>;
  is_active: boolean;
  expires_at?: string;
  last_used_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ApiCredentialForm {
  name: string;
  credential_type: 'api_key' | 'oauth' | 'jwt' | 'basic_auth';
  provider: string;
  api_key?: string;
  secret_key?: string;
  client_id?: string;
  client_secret?: string;
  additional_config?: Record<string, any>;
  expires_at?: string;
}

export interface CredentialValidationResult {
  isValid: boolean;
  errors: string[];
}

// Type guard to ensure credential_type is valid
export const isValidCredentialType = (type: string): type is 'api_key' | 'oauth' | 'jwt' | 'basic_auth' => {
  return ['api_key', 'oauth', 'jwt', 'basic_auth'].includes(type);
};

// Helper function to convert database row to ApiCredential
export const mapDatabaseRowToApiCredential = (row: any): ApiCredential => {
  return {
    ...row,
    credential_type: isValidCredentialType(row.credential_type) 
      ? row.credential_type 
      : 'api_key' as const, // fallback to api_key if invalid
    additional_config: row.additional_config || {}
  };
};
