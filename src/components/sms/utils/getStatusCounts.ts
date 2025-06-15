
import { SMSLog } from "@/types/sms";

// Aggregate status counts from logs
export function getStatusCounts(logs: SMSLog[] = []) {
  const counts: Record<string, number> = {};
  for (const log of logs) {
    const key = (log.status || "unknown").toLowerCase();
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}
