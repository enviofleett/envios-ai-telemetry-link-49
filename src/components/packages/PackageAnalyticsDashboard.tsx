
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const PackageAnalyticsDashboard: React.FC = () => {
  // In the next steps, we'll fetch analytics from the API and show package/revenue stats.
  return (
    <Card>
      <CardHeader>
        <CardTitle>Package Analytics Dashboard</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-muted-foreground">
          Visualize package revenue, usage, and subscriber statistics here. (Feature in progress)
        </div>
      </CardContent>
    </Card>
  );
};

export default PackageAnalyticsDashboard;
