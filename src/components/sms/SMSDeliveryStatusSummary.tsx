
import React from "react";
import { getStatusCounts } from "./utils/getStatusCounts";
import type { SMSLog } from "@/types/sms";
import { DeliveryStatusBadge } from "./DeliveryStatusBadge";

interface Props {
  logs?: SMSLog[];
}

const PRETTY_LABELS: Record<string, string> = {
  delivered: "Delivered",
  sent: "Sent",
  submitted: "Submitted",
  failed: "Failed",
  pending: "Pending",
  unknown: "Unknown",
};

const PRIORITY_ORDER = [
  "delivered", "sent", "submitted", "failed", "pending", "unknown"
];

export default function SMSDeliveryStatusSummary({ logs = [] }: Props) {
  const counts = getStatusCounts(logs);
  const total = logs.length;

  return (
    <div className="flex flex-wrap gap-4 mb-4">
      {PRIORITY_ORDER.map((status) =>
        counts[status] ? (
          <div
            key={status}
            className="flex flex-col items-center px-2 py-1"
          >
            <DeliveryStatusBadge status={status} />
            <span className="text-lg font-bold">{counts[status]}</span>
          </div>
        ) : null
      )}
      <div className="flex flex-col items-center px-2 py-1">
        <span className="text-sm text-muted-foreground">Total</span>
        <span className="text-lg font-bold">{total}</span>
      </div>
    </div>
  );
}
