
import React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { FileText } from "lucide-react";

const TransactionManagementTab: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Transaction Management
        </CardTitle>
        <CardDescription>
          Browse and manage all transactions, refunds, and payment histories for workshops.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 text-muted-foreground">
          Select a transaction to see full Paystack status, workflow, and associated invoices and refunds.
        </div>
        <div className="bg-muted px-4 py-8 rounded-md text-center text-sm text-muted-foreground">
          Transaction/refund management UI coming soon.
        </div>
      </CardContent>
    </Card>
  );
};

export default TransactionManagementTab;
