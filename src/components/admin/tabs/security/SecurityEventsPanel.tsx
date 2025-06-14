
import React from "react";

interface SecurityEventsPanelProps {
  onViewDetails?: (event: any) => void;
}

const SecurityEventsPanel: React.FC<SecurityEventsPanelProps> = ({ onViewDetails }) => {
  return (
    <div className="p-4">
      <div className="font-semibold">Security Events</div>
      <div className="text-muted-foreground text-sm mt-2">
        Security events display coming soon.
      </div>
    </div>
  );
};

export default SecurityEventsPanel;
