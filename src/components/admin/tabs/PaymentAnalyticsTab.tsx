
import React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

const PaymentAnalyticsTab: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Payment Analytics
        </CardTitle>
        <CardDescription>
          Dashboard of Paystack and workshop payment performance.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-2">
          View payment summaries, revenue trends, and recent workshop payment events.
        </p>
        <div className="bg-muted px-4 py-8 rounded-md text-center text-sm text-muted-foreground">
          Analytics dashboard coming soon.
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentAnalyticsTab;
