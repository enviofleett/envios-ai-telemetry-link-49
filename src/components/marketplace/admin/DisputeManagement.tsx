
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, MessageSquare, CheckCircle, XCircle } from 'lucide-react';
import { disputeManagementService, type Dispute } from '@/services/marketplace/DisputeManagementService';
import { useAuth } from '@/contexts/AuthContext';

const DisputeManagement: React.FC = () => {
  const { user } = useAuth();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [resolution, setResolution] = useState('');
  const [resolutionType, setResolutionType] = useState<'refund_buyer' | 'side_with_merchant' | 'partial_refund' | 'other'>('other');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadDisputes();
  }, []);

  const loadDisputes = async () => {
    setIsLoading(true);
    try {
      // For admin, we need to implement a method to get all disputes
      // For now, let's create a mock implementation
      console.log('Loading disputes for admin...');
      setDisputes([]);
    } catch (error) {
      console.error('Failed to load disputes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolveDispute = async () => {
    if (!selectedDispute || !user || !resolution.trim()) return;

    try {
      await disputeManagementService.resolveDispute(
        selectedDispute.id,
        resolution,
        user.id,
        resolutionType
      );
      
      setSelectedDispute(null);
      setResolution('');
      setResolutionType('other');
      await loadDisputes();
    } catch (error) {
      console.error('Failed to resolve dispute:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-500';
      case 'under_review': return 'bg-yellow-500';
      case 'awaiting_response': return 'bg-blue-500';
      case 'resolved': return 'bg-green-500';
      case 'closed': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getDisputeTypeIcon = (type: string) => {
    switch (type) {
      case 'product_not_received': return '📦';
      case 'product_defective': return '🔧';
      case 'not_as_described': return '📋';
      case 'unauthorized_charge': return '💳';
      default: return '❓';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <AlertCircle className="h-6 w-6" />
          Dispute Management
        </h2>
        <Button onClick={loadDisputes} disabled={isLoading}>
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Disputes List */}
        <Card>
          <CardHeader>
            <CardTitle>Active Disputes</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading disputes...</div>
            ) : disputes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No active disputes</div>
            ) : (
              <div className="space-y-4">
                {disputes.map((dispute) => (
                  <div
                    key={dispute.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedDispute?.id === dispute.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedDispute(dispute)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{getDisputeTypeIcon(dispute.dispute_type)}</span>
                        <div>
                          <Badge className={getStatusColor(dispute.status)}>
                            {dispute.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(dispute.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="font-medium mb-1">
                      {dispute.dispute_type.replace('_', ' ').toUpperCase()}
                    </h4>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {dispute.description}
                    </p>
                    <div className="text-xs text-gray-500 mt-2">
                      Order ID: {dispute.order_id}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dispute Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {selectedDispute ? 'Dispute Details' : 'Select a Dispute'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDispute ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Dispute Information</h3>
                  <div className="bg-gray-50 p-3 rounded-lg space-y-2 text-sm">
                    <div><strong>Order ID:</strong> {selectedDispute.order_id}</div>
                    <div><strong>Type:</strong> {selectedDispute.dispute_type.replace('_', ' ')}</div>
                    <div><strong>Status:</strong> {selectedDispute.status}</div>
                    <div><strong>Created:</strong> {new Date(selectedDispute.created_at).toLocaleString()}</div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Description</h3>
                  <p className="text-sm bg-gray-50 p-3 rounded-lg">
                    {selectedDispute.description}
                  </p>
                </div>

                {selectedDispute.status !== 'resolved' && selectedDispute.status !== 'closed' && (
                  <div>
                    <h3 className="font-medium mb-2">Resolve Dispute</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Resolution Type</label>
                        <select
                          value={resolutionType}
                          onChange={(e) => setResolutionType(e.target.value as any)}
                          className="w-full p-2 border rounded-md"
                        >
                          <option value="refund_buyer">Refund Buyer</option>
                          <option value="side_with_merchant">Side with Merchant</option>
                          <option value="partial_refund">Partial Refund</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Resolution Details</label>
                        <Textarea
                          value={resolution}
                          onChange={(e) => setResolution(e.target.value)}
                          placeholder="Explain the resolution decision..."
                          rows={4}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={handleResolveDispute}
                          disabled={!resolution.trim()}
                          className="flex items-center gap-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Resolve Dispute
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => setSelectedDispute(null)}
                          className="flex items-center gap-2"
                        >
                          <XCircle className="h-4 w-4" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {selectedDispute.resolution && (
                  <div>
                    <h3 className="font-medium mb-2">Resolution</h3>
                    <p className="text-sm bg-green-50 p-3 rounded-lg">
                      {selectedDispute.resolution}
                    </p>
                    {selectedDispute.resolved_at && (
                      <p className="text-xs text-gray-500 mt-2">
                        Resolved on {new Date(selectedDispute.resolved_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Select a dispute from the list to view details and manage resolution
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DisputeManagement;
