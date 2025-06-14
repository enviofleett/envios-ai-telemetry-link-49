
export interface CountryMarketplaceSettings {
  id?: string;
  country_code: string;
  default_commission_rate: number;
  default_registration_fee: number;
  currency: string;
  billing_cycles: string[];
  supported_payment_methods: string[];
  created_at?: string;
  updated_at?: string;
}
