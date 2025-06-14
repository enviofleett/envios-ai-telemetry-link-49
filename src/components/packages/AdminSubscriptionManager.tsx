
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const AdminSubscriptionManager: React.FC = () => {
  // Here, later, you would add logic to list, edit, and migrate user subscriptions.
  return (
    <Card>
      <CardHeader>
        <CardTitle>User Subscription Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-muted-foreground">
          Manage user subscriptions to packages here. (Feature in progress)
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminSubscriptionManager;
