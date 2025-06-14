
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const BulkPackageAssignment: React.FC = () => {
  // Placeholder for mass/bulk assignment admin tools
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk Assignment Tool</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-muted-foreground">
          Assign packages and features to users in bulk here. (Feature in progress)
        </div>
      </CardContent>
    </Card>
  );
};

export default BulkPackageAssignment;
