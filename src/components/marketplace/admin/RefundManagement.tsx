
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { DollarSign, CheckCircle, XCircle, Clock } from 'lucide-react';
import { refundService, type Refund } from '@/services/marketplace/RefundService';
import { useAuth } from '@/contexts/AuthContext';

const RefundManagement: React.FC = () => {
  const { user } = useAuth();
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadPendingRefunds();
  }, []);

  const loadPendingRefunds = async () => {
    setIsLoading(true);
    try {
      const pendingRefunds = await refundService.getPendingRefunds();
      setRefunds(pendingRefunds);
    } catch (error) {
      console.error('Failed to load refunds:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveRefund = async (refundId: string) => {
    if (!user) return;

    try {
      await refundService.approveRefund(refundId, user.id);
      await loadPendingRefunds();
      setSelectedRefund(null);
    } catch (error) {
      console.error('Failed to approve refund:', error);
    }
  };

  const handleRejectRefund = async (refundId: string) => {
    if (!user || !rejectionReason.trim()) return;

    try {
      await refundService.rejectRefund(refundId, user.id, rejectionReason);
      await loadPendingRefunds();
      setSelectedRefund(null);
      setRejectionReason('');
    } catch (error) {
      console.error('Failed to reject refund:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'approved': return 'bg-blue-500';
      case 'processing': return 'bg-purple-500';
      case 'completed': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      case 'failed': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getRefundTypeIcon = (type: string) => {
    return type === 'full' ? '💰' : '💸';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <DollarSign className="h-6 w-6" />
          Refund Management
        </h2>
        <Button onClick={loadPendingRefunds} disabled={isLoading}>
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Refunds List */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Refunds</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading refunds...</div>
            ) : refunds.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No pending refunds</div>
            ) : (
              <div className="space-y-4">
                {refunds.map((refund) => (
                  <div
                    key={refund.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedRefund?.id === refund.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedRefund(refund)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{getRefundTypeIcon(refund.refund_type)}</span>
                        <div>
                          <Badge className={getStatusColor(refund.status)}>
                            {refund.status.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(refund.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="font-medium">
                        {formatCurrency(refund.refund_amount)} 
                        {refund.refund_type === 'partial' && (
                          <span className="text-sm text-gray-500">
                            {' '}of {formatCurrency(refund.original_amount)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {refund.reason}
                      </p>
                      <div className="text-xs text-gray-500">
                        Order ID: {refund.order_id}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Refund Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {selectedRefund ? 'Refund Details' : 'Select a Refund'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedRefund ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Refund Information</h3>
                  <div className="bg-gray-50 p-3 rounded-lg space-y-2 text-sm">
                    <div><strong>Order ID:</strong> {selectedRefund.order_id}</div>
                    <div><strong>Type:</strong> {selectedRefund.refund_type} refund</div>
                    <div><strong>Amount:</strong> {formatCurrency(selectedRefund.refund_amount)}</div>
                    <div><strong>Original Amount:</strong> {formatCurrency(selectedRefund.original_amount)}</div>
                    <div><strong>Requester:</strong> {selectedRefund.requester_type}</div>
                    <div><strong>Status:</strong> {selectedRefund.status}</div>
                    <div><strong>Created:</strong> {new Date(selectedRefund.created_at).toLocaleString()}</div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Reason</h3>
                  <p className="text-sm bg-gray-50 p-3 rounded-lg">
                    {selectedRefund.reason}
                  </p>
                </div>

                {selectedRefund.evidence && selectedRefund.evidence.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-2">Evidence</h3>
                    <div className="space-y-2">
                      {selectedRefund.evidence.map((evidence, index) => (
                        <div key={index} className="text-sm bg-gray-50 p-2 rounded">
                          <a 
                            href={evidence} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Evidence {index + 1}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedRefund.status === 'pending' && (
                  <div>
                    <h3 className="font-medium mb-2">Actions</h3>
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => handleApproveRefund(selectedRefund.id)}
                          className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Approve Refund
                        </Button>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Rejection Reason</label>
                        <Textarea
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Explain why this refund is being rejected..."
                          rows={3}
                        />
                        <Button 
                          onClick={() => handleRejectRefund(selectedRefund.id)}
                          disabled={!rejectionReason.trim()}
                          className="mt-2 flex items-center gap-2 bg-red-600 hover:bg-red-700"
                          variant="destructive"
                        >
                          <XCircle className="h-4 w-4" />
                          Reject Refund
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {selectedRefund.rejection_reason && (
                  <div>
                    <h3 className="font-medium mb-2">Rejection Reason</h3>
                    <p className="text-sm bg-red-50 p-3 rounded-lg text-red-800">
                      {selectedRefund.rejection_reason}
                    </p>
                  </div>
                )}

                {selectedRefund.processed_at && (
                  <div>
                    <h3 className="font-medium mb-2">Processing Details</h3>
                    <div className="bg-green-50 p-3 rounded-lg text-sm space-y-1">
                      <div><strong>Processed:</strong> {new Date(selectedRefund.processed_at).toLocaleString()}</div>
                      {selectedRefund.payment_processor_reference && (
                        <div><strong>Reference:</strong> {selectedRefund.payment_processor_reference}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Select a refund from the list to view details and take action
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RefundManagement;
