
import React from "react";
import classNames from "clsx";

const STATUS_COLORS: Record<string, string> = {
  delivered: "bg-green-100 text-green-800 border-green-400",
  sent: "bg-blue-100 text-blue-800 border-blue-400",
  submitted: "bg-blue-100 text-blue-800 border-blue-400",
  failed: "bg-red-100 text-red-800 border-red-400",
  pending: "bg-yellow-100 text-yellow-800 border-yellow-400",
  unknown: "bg-gray-100 text-gray-800 border-gray-400",
};

export function DeliveryStatusBadge({ status }: { status?: string }) {
  const normalized = (status ?? "unknown").toLowerCase();
  return (
    <span
      className={classNames(
        "inline-block px-2 py-0.5 text-xs font-semibold rounded border",
        STATUS_COLORS[normalized] || STATUS_COLORS.unknown
      )}
    >
      {status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown"}
    </span>
  );
}
