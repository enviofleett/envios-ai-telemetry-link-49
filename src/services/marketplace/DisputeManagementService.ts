
import { supabase } from '@/integrations/supabase/client';

export interface DisputeRequest {
  order_id: string;
  buyer_id: string;
  merchant_id: string;
  dispute_type: 'product_not_received' | 'product_defective' | 'not_as_described' | 'unauthorized_charge' | 'other';
  description: string;
  evidence_files?: string[];
}

export interface Dispute {
  id: string;
  order_id: string;
  buyer_id: string;
  merchant_id: string;
  status: 'open' | 'under_review' | 'awaiting_response' | 'resolved' | 'closed';
  dispute_type: string;
  description: string;
  resolution?: string;
  resolved_by?: string;
  resolved_at?: string;
  evidence_files?: string[];
  created_at: string;
  updated_at: string;
}

export interface DisputeResponse {
  dispute_id: string;
  responder_id: string;
  responder_type: 'buyer' | 'merchant' | 'admin';
  response_text: string;
  evidence_files?: string[];
}

class DisputeManagementService {
  async createDispute(disputeRequest: DisputeRequest): Promise<Dispute> {
    // Check if dispute already exists for this order
    const existingDispute = await this.getDisputeByOrderId(disputeRequest.order_id);
    if (existingDispute && existingDispute.status !== 'closed') {
      throw new Error('An active dispute already exists for this order');
    }

    const { data, error } = await supabase
      .from('marketplace_disputes')
      .insert({
        order_id: disputeRequest.order_id,
        buyer_id: disputeRequest.buyer_id,
        merchant_id: disputeRequest.merchant_id,
        dispute_type: disputeRequest.dispute_type,
        description: disputeRequest.description,
        status: 'open',
        evidence_files: disputeRequest.evidence_files || []
      })
      .select()
      .single();

    if (error) throw error;

    // Create corresponding payment dispute
    await this.createPaymentDispute(data.id, disputeRequest.order_id);

    // Log dispute creation
    await this.logDisputeActivity(data.id, 'created', {
      dispute_type: disputeRequest.dispute_type,
      created_by: disputeRequest.buyer_id
    });

    return data as Dispute;
  }

  async addDisputeResponse(response: DisputeResponse): Promise<void> {
    const { error } = await supabase
      .from('marketplace_dispute_responses')
      .insert({
        dispute_id: response.dispute_id,
        responder_id: response.responder_id,
        responder_type: response.responder_type,
        response_text: response.response_text,
        evidence_files: response.evidence_files || [],
        created_at: new Date().toISOString()
      });

    if (error) throw error;

    // Update dispute status to awaiting response from the other party
    await this.updateDisputeStatus(
      response.dispute_id, 
      'awaiting_response',
      response.responder_id
    );

    await this.logDisputeActivity(response.dispute_id, 'response_added', {
      responder_type: response.responder_type,
      responder_id: response.responder_id
    });
  }

  async resolveDispute(
    disputeId: string, 
    resolution: string, 
    resolvedBy: string,
    resolutionType: 'refund_buyer' | 'side_with_merchant' | 'partial_refund' | 'other'
  ): Promise<void> {
    const { error } = await supabase
      .from('marketplace_disputes')
      .update({
        status: 'resolved',
        resolution,
        resolved_by: resolvedBy,
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', disputeId);

    if (error) throw error;

    // Handle resolution actions
    await this.executeResolution(disputeId, resolutionType);

    await this.logDisputeActivity(disputeId, 'resolved', {
      resolution_type: resolutionType,
      resolved_by: resolvedBy,
      resolution
    });
  }

  async updateDisputeStatus(disputeId: string, status: Dispute['status'], updatedBy?: string): Promise<void> {
    const { error } = await supabase
      .from('marketplace_disputes')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', disputeId);

    if (error) throw error;

    await this.logDisputeActivity(disputeId, 'status_updated', {
      new_status: status,
      updated_by: updatedBy
    });
  }

  async getDispute(disputeId: string): Promise<Dispute | null> {
    const { data, error } = await supabase
      .from('marketplace_disputes')
      .select(`
        *,
        marketplace_dispute_responses (
          id,
          responder_id,
          responder_type,
          response_text,
          evidence_files,
          created_at
        )
      `)
      .eq('id', disputeId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data as Dispute;
  }

  async getDisputeByOrderId(orderId: string): Promise<Dispute | null> {
    const { data, error } = await supabase
      .from('marketplace_disputes')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data as Dispute;
  }

  async getUserDisputes(userId: string, userType: 'buyer' | 'merchant'): Promise<Dispute[]> {
    const column = userType === 'buyer' ? 'buyer_id' : 'merchant_id';
    
    const { data, error } = await supabase
      .from('marketplace_disputes')
      .select('*')
      .eq(column, userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as Dispute[];
  }

  private async createPaymentDispute(disputeId: string, orderId: string): Promise<void> {
    // Get escrow transaction for this order
    const { data: escrowTx } = await supabase
      .from('marketplace_escrow_transactions')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (escrowTx) {
      const { error } = await supabase
        .from('marketplace_payment_disputes')
        .insert({
          order_id: orderId,
          escrow_transaction_id: escrowTx.id,
          buyer_id: escrowTx.buyer_id,
          merchant_id: escrowTx.merchant_id,
          status: 'open',
          reason: `Dispute created for order ${orderId}`,
          created_at: new Date().toISOString()
        });

      if (error) console.error('Failed to create payment dispute:', error);
    }
  }

  private async executeResolution(disputeId: string, resolutionType: string): Promise<void> {
    const dispute = await this.getDispute(disputeId);
    if (!dispute) return;

    switch (resolutionType) {
      case 'refund_buyer':
        // Trigger refund process
        await this.processRefund(dispute.order_id, 'full');
        break;
      case 'partial_refund':
        // Trigger partial refund
        await this.processRefund(dispute.order_id, 'partial');
        break;
      case 'side_with_merchant':
        // Release escrow to merchant
        await this.releaseEscrow(dispute.order_id);
        break;
    }
  }

  private async processRefund(orderId: string, refundType: 'full' | 'partial'): Promise<void> {
    // This would integrate with payment processor to issue refund
    console.log(`Processing ${refundType} refund for order ${orderId}`);
  }

  private async releaseEscrow(orderId: string): Promise<void> {
    const { error } = await supabase
      .from('marketplace_escrow_transactions')
      .update({
        status: 'released',
        released_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('order_id', orderId);

    if (error) console.error('Failed to release escrow:', error);
  }

  private async logDisputeActivity(disputeId: string, activityType: string, activityData: any): Promise<void> {
    const { error } = await supabase
      .from('marketplace_dispute_activities')
      .insert({
        dispute_id: disputeId,
        activity_type: activityType,
        activity_data: activityData,
        created_at: new Date().toISOString()
      });

    if (error) console.error('Failed to log dispute activity:', error);
  }
}

export const disputeManagementService = new DisputeManagementService();
