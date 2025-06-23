
export interface Workshop {
  id: string;
  name: string;
  representative_name: string;
  email: string;
  phone_number?: string;
  address?: string;
  status: string;
  service_types?: string[] | any;
  created_at: string;
  updated_at: string;
}
