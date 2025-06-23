
export interface Workshop {
  id: string;
  name: string;
  representative_name: string;
  email: string;
  phone_number: string;
  location: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface WorkshopStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}
