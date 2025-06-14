
export interface MerchantFeeOverride {
  id?: string;
  merchant_id: string;
  commission_rate_override?: number;
  registration_fee_override?: number;
  commission_currency?: string;
  registration_fee_currency?: string;
  billing_cycle?: string;
  country_code?: string;
  effective_from?: string;
  effective_to?: string;
  created_at?: string;
  updated_at?: string;
}
