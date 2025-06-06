
export interface GP51Credentials {
  username: string;
  password: string;
  apiUrl?: string;
}

export interface GP51AuthPayload {
  username: string;
  password: string;
  from: string;
  type: string;
}

export interface GP51LoginResult {
  status: number;
  token?: string;
  cause?: string;
  message?: string;
  error?: string;
}

export interface GP51Session {
  username: string;
  token_expires_at: string;
  gp51_token: string;
}

export interface SettingsRequest {
  action: string;
  username?: string;
  password?: string;
  apiUrl?: string;
}
