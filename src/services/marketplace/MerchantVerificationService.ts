
import { supabase } from '@/integrations/supabase/client';

export interface MerchantVerificationRequest {
  merchant_id: string;
  business_name: string;
  business_registration_number?: string;
  tax_id?: string;
  business_address: string;
  contact_person: string;
  contact_email: string;
  contact_phone: string;
  business_type: string;
  documents: VerificationDocument[];
}

export interface VerificationDocument {
  document_type: 'business_registration' | 'tax_certificate' | 'id_card' | 'bank_statement' | 'other';
  file_url: string;
  file_name: string;
  description?: string;
}

export interface MerchantVerification {
  id: string;
  merchant_id: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'requires_additional_info';
  verification_data: any;
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

class MerchantVerificationService {
  async submitVerification(request: MerchantVerificationRequest): Promise<MerchantVerification> {
    const { data, error } = await supabase
      .from('marketplace_merchant_verifications')
      .insert({
        merchant_id: request.merchant_id,
        status: 'pending',
        verification_data: {
          business_name: request.business_name,
          business_registration_number: request.business_registration_number,
          tax_id: request.tax_id,
          business_address: request.business_address,
          contact_person: request.contact_person,
          contact_email: request.contact_email,
          contact_phone: request.contact_phone,
          business_type: request.business_type,
          documents: request.documents
        },
        submitted_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Log verification submission
    await this.logVerificationActivity(data.id, 'submitted', {
      merchant_id: request.merchant_id,
      business_name: request.business_name
    });

    return data as MerchantVerification;
  }

  async updateVerificationStatus(
    verificationId: string, 
    status: MerchantVerification['status'],
    reviewerId?: string,
    rejectionReason?: string
  ): Promise<void> {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (reviewerId) {
      updateData.reviewed_by = reviewerId;
      updateData.reviewed_at = new Date().toISOString();
    }

    if (rejectionReason) {
      updateData.rejection_reason = rejectionReason;
    }

    const { error } = await supabase
      .from('marketplace_merchant_verifications')
      .update(updateData)
      .eq('id', verificationId);

    if (error) throw error;

    // If approved, update merchant status
    if (status === 'approved') {
      const verification = await this.getVerification(verificationId);
      if (verification) {
        await this.approveMerchant(verification.merchant_id);
      }
    }

    await this.logVerificationActivity(verificationId, 'status_updated', {
      new_status: status,
      reviewed_by: reviewerId,
      rejection_reason: rejectionReason
    });
  }

  async getVerification(verificationId: string): Promise<MerchantVerification | null> {
    const { data, error } = await supabase
      .from('marketplace_merchant_verifications')
      .select('*')
      .eq('id', verificationId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data as MerchantVerification;
  }

  async getMerchantVerifications(merchantId: string): Promise<MerchantVerification[]> {
    const { data, error } = await supabase
      .from('marketplace_merchant_verifications')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as MerchantVerification[];
  }

  async getPendingVerifications(): Promise<MerchantVerification[]> {
    const { data, error } = await supabase
      .from('marketplace_merchant_verifications')
      .select('*')
      .in('status', ['pending', 'under_review'])
      .order('submitted_at', { ascending: true });

    if (error) throw error;
    return (data || []) as MerchantVerification[];
  }

  private async approveMerchant(merchantId: string): Promise<void> {
    const { error } = await supabase
      .from('marketplace_merchants')
      .update({
        is_verified: true,
        verification_status: 'verified',
        updated_at: new Date().toISOString()
      })
      .eq('id', merchantId);

    if (error) throw error;
  }

  private async logVerificationActivity(verificationId: string, activityType: string, activityData: any): Promise<void> {
    const { error } = await supabase
      .from('marketplace_verification_activities')
      .insert({
        verification_id: verificationId,
        activity_type: activityType,
        activity_data: activityData,
        created_at: new Date().toISOString()
      });

    if (error) console.error('Failed to log verification activity:', error);
  }
}

export const merchantVerificationService = new MerchantVerificationService();
