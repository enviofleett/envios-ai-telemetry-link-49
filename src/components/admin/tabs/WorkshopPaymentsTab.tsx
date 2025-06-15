
import React from "react";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign } from "lucide-react";

const WorkshopPaymentsTab: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Workshop Payments
        </CardTitle>
        <CardDescription>
          Configure workshop activation/connection fees and Paystack product integration.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-muted-foreground mb-4">
          This section will allow you to manage workshop-specific payment rules, enable/disable fees, and configure refund policies linked to tracked Paystack transactions.
        </div>
        <ul className="list-disc ml-8 text-sm text-muted-foreground">
          <li>Set fees per workshop or product.</li>
          <li>Configure automatic invoice issuance.</li>
          <li>Manage connection/activation requirements.</li>
        </ul>
      </CardContent>
    </Card>
  );
};

export default WorkshopPaymentsTab;
