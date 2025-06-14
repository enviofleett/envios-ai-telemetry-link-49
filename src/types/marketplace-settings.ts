
export interface MarketplaceSettings {
  id?: string | null;
  commission_rate: number;
  registration_fee: number;
  connection_fee: number;
  currency: string;
  updated_at?: string;
  updated_by?: string;
  created_at?: string;
}
