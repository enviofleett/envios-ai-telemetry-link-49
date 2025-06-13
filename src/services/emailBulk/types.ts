
export interface BulkEmailOperation {
  id: string;
  operation_type: 'send_bulk' | 'import_recipients' | 'export_analytics';
  operation_name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  total_items: number;
  processed_items: number;
  successful_items: number;
  failed_items: number;
  created_by: string;
  created_at: string;
  completed_at?: string;
  error_log?: any[];
  operation_data: any;
}

export interface BulkEmailRequest {
  recipients: Array<{
    email: string;
    name?: string;
    variables?: Record<string, string>;
  }>;
  template_id?: string;
  subject: string;
  message: string;
  send_immediately?: boolean;
  scheduled_for?: string;
}

export interface BulkEmailRecipient {
  email: string;
  name?: string;
  variables?: Record<string, string>;
}
