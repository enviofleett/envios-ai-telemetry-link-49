import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface MerchantOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export const MerchantOnboardingModal: React.FC<MerchantOnboardingModalProps> = ({
  isOpen, onClose, onSubmit
}) => {
  const [form, setForm] = React.useState({ org_name: "", email: "", registration_fee: 100, commission_rate: 0.10 });
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Create merchant profile (pending approval)
      const res = await fetch("/api/create-merchant", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("sb-access-token")}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });
      const { merchant, error } = await res.json();
      if (error || !merchant) throw new Error(error || "Merchant creation failed.");

      // Pay registration fee
      const payRes = await fetch("/api/pay-merchant-registration", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("sb-access-token")}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ merchant_id: merchant.id })
      });
      const { url: stripeUrl, error: pError } = await payRes.json();
      if (pError || !stripeUrl) throw new Error(pError || "Stripe registration fee error.");

      window.open(stripeUrl, "_blank");
      onSubmit(merchant);
    } catch (err: any) {
      alert(err.message);
    }
    setSubmitting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Merchant Registration</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Organization Name"
            value={form.org_name}
            onChange={e => setForm({ ...form, org_name: e.target.value })}
          />
          <Input
            placeholder="Email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
          />
          <Input
            placeholder="Registration Fee ($)"
            type="number"
            value={form.registration_fee}
            onChange={e => setForm({ ...form, registration_fee: +e.target.value })}
          />
          <Input
            placeholder="Commission Rate (e.g. 0.10 for 10%)"
            type="number"
            step="0.01"
            value={form.commission_rate}
            onChange={e => setForm({ ...form, commission_rate: +e.target.value })}
          />
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Processing..." : "Submit & Pay"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
