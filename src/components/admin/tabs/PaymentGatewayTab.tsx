
import React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { CreditCard } from "lucide-react";

const PaymentGatewayTab: React.FC = () => {
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
          For security, Paystack secret keys are managed through Supabase Secrets.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 p-2">
          <p className="text-muted-foreground">
            You will be able to enter your Paystack <b>Public Key</b> (for frontend checkout) and securely link your <b>Secret Key</b> in the next step using Lovable’s <i>Supabase Secrets</i> panel.
          </p>
          <ul className="list-disc ml-8 mt-4 text-muted-foreground text-sm">
            <li>Webhook setup & verification coming soon.</li>
            <li>Test mode support for development (toggle in Paystack dashboard).</li>
            <li>Contact support if you need help setting up Paystack.</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentGatewayTab;
