
import React from "react";
import { DeliveryStatusBadge } from "./DeliveryStatusBadge";
import type { SMSLog } from "@/types/sms";

interface Props {
  logs?: SMSLog[];
  loading?: boolean;
}

export default function SMSDeliveryStatusTable({ logs = [], loading }: Props) {
  if (loading) {
    return (
      <div className="py-8 flex justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!logs.length) {
    return (
      <div className="p-4 text-center text-muted-foreground">No SMS found.</div>
    );
  }

  return (
    <div className="overflow-x-auto rounded border mt-2">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-muted">
            <th className="px-3 py-2 text-left">Recipient</th>
            <th className="px-3 py-2 text-left">Message</th>
            <th className="px-3 py-2 text-left">Status</th>
            <th className="px-3 py-2 text-left">Created</th>
            <th className="px-3 py-2 text-left">Provider</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className="border-t last:border-b">
              <td className="px-3 py-2">{log.recipient_phone}</td>
              <td className="px-3 py-2 max-w-xs truncate" title={log.message}>
                {log.message}
              </td>
              <td className="px-3 py-2">
                <DeliveryStatusBadge status={log.status} />
              </td>
              <td className="px-3 py-2">
                {log.created_at ? new Date(log.created_at).toLocaleString() : "-"}
              </td>
              <td className="px-3 py-2">{log.provider_name ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
