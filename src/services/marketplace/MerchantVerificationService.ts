
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
    // Mock implementation since marketplace_merchant_verifications table doesn't exist
    const mockVerification: MerchantVerification = {
      id: crypto.randomUUID(),
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
      submitted_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Log verification submission (mock)
    await this.logVerificationActivity(mockVerification.id, 'submitted', {
      merchant_id: request.merchant_id,
      business_name: request.business_name
    });

    console.log('Mock verification submitted:', mockVerification);
    return mockVerification;
  }

  async updateVerificationStatus(
    verificationId: string, 
    status: MerchantVerification['status'],
    reviewerId?: string,
    rejectionReason?: string
  ): Promise<void> {
    // Mock implementation
    console.log('Mock verification status update:', {
      verificationId,
      status,
      reviewerId,
      rejectionReason
    });

    // If approved, update merchant status (mock)
    if (status === 'approved') {
      await this.approveMerchant(verificationId);
    }

    await this.logVerificationActivity(verificationId, 'status_updated', {
      new_status: status,
      reviewed_by: reviewerId,
      rejection_reason: rejectionReason
    });
  }

  async getVerification(verificationId: string): Promise<MerchantVerification | null> {
    // Mock implementation
    console.log('Mock get verification:', verificationId);
    return null;
  }

  async getMerchantVerifications(merchantId: string): Promise<MerchantVerification[]> {
    // Mock implementation
    console.log('Mock get merchant verifications:', merchantId);
    return [];
  }

  async getPendingVerifications(): Promise<MerchantVerification[]> {
    // Mock implementation
    console.log('Mock get pending verifications');
    return [];
  }

  private async approveMerchant(merchantId: string): Promise<void> {
    // Mock implementation - would update merchant status in real marketplace_merchants table
    console.log('Mock approve merchant:', merchantId);
  }

  private async logVerificationActivity(verificationId: string, activityType: string, activityData: any): Promise<void> {
    // Mock implementation since marketplace_verification_activities table doesn't exist
    console.log('Mock log verification activity:', {
      verificationId,
      activityType,
      activityData,
      timestamp: new Date().toISOString()
    });
  }
}

export const merchantVerificationService = new MerchantVerificationService();
