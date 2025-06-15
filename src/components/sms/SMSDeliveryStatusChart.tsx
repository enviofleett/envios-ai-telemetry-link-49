
import React from "react";
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";
import { getStatusCounts } from "./utils/getStatusCounts";
import type { SMSLog } from "@/types/sms";

const STATUS_COLORS: Record<string, string> = {
  delivered: "#22c55e",
  sent: "#3b82f6",
  submitted: "#3b82f6",
  failed: "#ef4444",
  pending: "#facc15",
  unknown: "#64748b",
};

interface Props {
  logs?: SMSLog[];
}

export default function SMSDeliveryStatusChart({ logs = [] }: Props) {
  const counts = getStatusCounts(logs);
  const chartData = Object.entries(counts).map(([status, count]) => ({
    status: status.charAt(0).toUpperCase() + status.slice(1),
    value: count,
    color: STATUS_COLORS[status] || STATUS_COLORS.unknown,
  }));

  if (logs.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={230}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="status"
          cx="50%"
          cy="50%"
          outerRadius={72}
          label
        >
          {chartData.map((entry, i) => (
            <Cell key={entry.status} fill={entry.color} />
          ))}
        </Pie>
        <Legend />
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}
