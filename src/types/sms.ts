
export type SMSConfig = {
  username: string;
  password: string;
  sender: string;
  route: string | number;
};

export type SMSLog = {
  id: string;
  user_id?: string;
  recipient_phone: string;
  message: string;
  event_type?: string;
  status?: string;
  provider_name?: string;
  provider_message_id?: string;
  cost?: number;
  provider_response?: any;
  created_at?: string;
  updated_at?: string;
};

export type SMSLogsResponse = {
  success: boolean;
  data?: SMSLog[];
  total?: number;
  page?: number;
  limit?: number;
  error?: string;
};

export type BalanceResponse = {
  success: boolean;
  balance?: string;
  error?: string;
}
