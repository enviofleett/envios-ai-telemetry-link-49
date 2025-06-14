
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface Props {
  children: React.ReactNode;
}

const MarketplaceSettingsCard: React.FC<Props> = ({ children }) => (
  <Card className="max-w-xl mx-auto mt-6">
    <CardHeader>
      <CardTitle>Marketplace Settings</CardTitle>
    </CardHeader>
    <CardContent>
      {children}
    </CardContent>
  </Card>
);

export default MarketplaceSettingsCard;
