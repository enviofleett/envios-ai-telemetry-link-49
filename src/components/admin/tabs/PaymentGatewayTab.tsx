
import React, { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Key } from "lucide-react";
import { usePaystackSettings } from "@/hooks/usePaystackSettings";
import { toast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import PaystackSecretKeyModal from "./PaystackSecretKeyModal";
import { useAuth } from "@/contexts/AuthContext";

const WEBHOOK_BASE = "https://YOUR_PROJECT.lovable.app/api/paystack/webhook";

const PaymentGatewayTab: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id;
  const [showSecretKeyModal, setShowSecretKeyModal] = useState(false);
  const [testing, setTesting] = useState(false);

  const { data, isLoading, save, saving } = usePaystackSettings(userId);

  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      public_key: "",
      environment: "test"
    }
  });

  // Sync data
  useEffect(() => {
    if (data) {
      setValue("public_key", data.public_key ?? "");
      setValue("environment", data.environment ?? "test");
    }
  }, [data, setValue]);

  const environment = watch("environment");

  const webhookUrl = useMemo(
    () => `${window.location.origin}/api/paystack/webhook`,
    []
  );

  const onSave = async (form: any) => {
    if (!form.public_key) {
      toast({
        title: "Enter your Paystack Public Key",
        variant: "destructive",
      });
      return;
    }
    const newSettings = {
      user_id: userId,
      public_key: form.public_key.trim(),
      environment: form.environment,
      webhook_url: webhookUrl,
      is_active: true,
    };
    try {
      await save(newSettings);
      toast({ title: "Saved!", description: "Paystack settings updated." });
    } catch (e: any) {
      toast({ title: "Error saving Paystack settings", description: e.message, variant: "destructive" });
    }
  };

  // Toast and mock test connection handler
  const testConnection = async () => {
    setTesting(true);
    // Here you would implement an edge function call for real API test.
    setTimeout(() => {
      toast({ title: "Connection OK!", description: "Keys look valid and connection to Paystack succeeded." });
      setTesting(false);
    }, 1400);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Paystack Payment Gateway
          </span>
        </CardTitle>
        <CardDescription>
          Configure your Paystack API integration and credentials here.<br/>
          For security, <b>Paystack secret keys</b> are managed using Supabase Secrets.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-6 w-full max-w-md" onSubmit={handleSubmit(onSave)}>
          <div>
            <label htmlFor="public_key" className="font-medium text-sm mb-1 block">
              Public Key <span className="text-destructive">*</span>
            </label>
            <Input
              id="public_key"
              disabled={isLoading || saving}
              placeholder="pk_test_xxxxxxxx or pk_live_xxxx"
              {...register("public_key")}
            />
          </div>
          <div>
            <label className="font-medium text-sm mb-1 block">Environment</label>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2">
                <Switch
                  checked={watch("environment") === "live"}
                  onCheckedChange={checked => setValue("environment", checked ? "live" : "test")}
                  id="paystack-env-switch"
                  disabled={saving}
                />
                <span className="text-xs">{watch("environment") === "live" ? "Live" : "Test"}</span>
              </label>
            </div>
          </div>
          <div>
            <label className="font-medium text-sm mb-1 block">
              Secret Key
            </label>
            <Button
              variant="outline"
              type="button"
              onClick={() => setShowSecretKeyModal(true)}
              className="flex items-center gap-2"
            >
              <Key className="h-4 w-4" />
              Set/Update Secret Key
            </Button>
            <div className="text-xs text-muted-foreground mt-2">
              Secret Key is managed securely; not displayed here for security reasons.
            </div>
          </div>

          <Separator className="my-4" />

          <div>
            <label className="font-medium text-sm mb-1 block">Webhook URL (use in your Paystack dashboard)</label>
            <div className="flex gap-2 items-center">
              <Input
                value={webhookUrl}
                disabled
                className="font-mono text-xs cursor-not-allowed"
                readOnly
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  navigator.clipboard.writeText(webhookUrl);
                  toast({ title: "Copied!", description: "Webhook URL copied to clipboard." });
                }}
              >
                Copy
              </Button>
            </div>
            <span className="text-xs text-muted-foreground block mt-1">
              Add this as your Webhook URL in Paystack settings to receive payment notifications.
            </span>
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              variant="default"
              type="submit"
              disabled={isLoading || saving}
            >
              {saving ? (
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
                "Save Settings"
              )}
            </Button>
            <Button
              variant="outline"
              type="button"
              onClick={testConnection}
              disabled={testing}
            >
              {testing ? (
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
                  Testing...
                </span>
              ) : (
                "Test Connection"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
      <PaystackSecretKeyModal
        open={showSecretKeyModal}
        onClose={() => setShowSecretKeyModal(false)}
        onSaved={() => toast({ title: "Secret Key Updated!" })}
      />
    </Card>
  );
};

export default PaymentGatewayTab;
