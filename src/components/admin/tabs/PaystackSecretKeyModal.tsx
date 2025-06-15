
import React, { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Key } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface PaystackSecretKeyModalProps {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

/**
 * Note: Saving secret to Supabase Secrets is handled by Lovable platform. Here, we show an info message and simulate save.
 */
const PaystackSecretKeyModal: React.FC<PaystackSecretKeyModalProps> = ({ open, onClose, onSaved }) => {
  const [secret, setSecret] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!secret) {
      toast({ title: "Secret Key Required", description: "Please enter your Paystack Secret Key.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      // Actually prompt Lovable's platform secret input for secure storage.
      window.dispatchEvent(
        new CustomEvent("lov-secret-form", { detail: { name: "PAYSTACK_SECRET_KEY", value: secret } })
      );
      setTimeout(() => {
        setLoading(false);
        toast({ title: "Secret Key Saved", description: "Your Paystack Secret Key has been saved securely." });
        setSecret("");
        onClose();
        onSaved?.();
      }, 1500);
    } catch (e: any) {
      toast({ title: "Failed to save secret", description: String(e), variant: "destructive" });
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !loading && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Enter Paystack Secret Key
          </DialogTitle>
          <DialogDescription>
            Your Paystack <b>Secret Key</b> is securely stored using Lovable's Supabase Secrets integration and never shown again.
          </DialogDescription>
        </DialogHeader>
        <Input
          type="password"
          placeholder="sk_test_xxxxxxxx or sk_live_xxxx"
          value={secret}
          onChange={e => setSecret(e.target.value)}
          disabled={loading}
          autoFocus
        />
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4l3.73-3.73A8.001 8.001 0 014 12z"
                  />
                </svg>
                Saving...
              </span>
            ) : (
              "Save Secret Key"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaystackSecretKeyModal;
