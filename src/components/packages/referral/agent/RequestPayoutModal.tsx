import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { referralApi } from '@/services/referral';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { CommissionWithDetails } from '@/types/referral';

interface RequestPayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  commissions: CommissionWithDetails[];
  onSuccess: () => void;
}

const RequestPayoutModal: React.FC<RequestPayoutModalProps> = ({ isOpen, onClose, commissions, onSuccess }) => {
  const queryClient = useQueryClient();
  const totalAmount = commissions.reduce((sum, c) => sum + c.commission_amount, 0);

  const mutation = useMutation({
    mutationFn: () => referralApi.createPayoutRequest(
      totalAmount,
      commissions.map(c => c.id)
    ),
    onSuccess: () => {
      toast.success('Payout request submitted successfully!');
      queryClient.invalidateQueries({ queryKey: ['my-commission-history'] });
      queryClient.invalidateQueries({ queryKey: ['my-payout-requests'] });
      queryClient.invalidateQueries({ queryKey: ['agent-dashboard-analytics'] });
      onSuccess();
    },
    onError: (error: Error) => {
      toast.error(`Failed to submit payout request: ${error.message}`);
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const handleSubmit = () => {
    mutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Payout Request</DialogTitle>
          <DialogDescription>
            You are about to request a payout for {commissions.length} commission(s) totaling {formatCurrency(totalAmount)}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <h4 className="font-semibold mb-2">Selected Commissions:</h4>
          <ul className="max-h-60 overflow-y-auto space-y-1 text-sm">
            {commissions.map(c => (
              <li key={c.id} className="flex justify-between">
                <span>From: {c.referred_user_name}</span>
                <span className="font-medium">{formatCurrency(c.commission_amount)}</span>
              </li>
            ))}
          </ul>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Confirm Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RequestPayoutModal;
