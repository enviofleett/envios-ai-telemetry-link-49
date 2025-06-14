
import React, { useMemo } from "react";
import { useSecurityContext } from "@/components/security/SecurityProvider";

interface SecurityEventsPanelProps {
  onViewDetails?: (event: any) => void;
  refreshToken?: number;
}

const formatDate = (timestamp: string) => {
  try {
    const d = new Date(timestamp);
    return d.toLocaleString();
  } catch {
    return timestamp;
  }
};

const SecurityEventsPanel: React.FC<SecurityEventsPanelProps> = ({
  onViewDetails,
  refreshToken,
}) => {
  const { securityEvents } = useSecurityContext();

  const sortedEvents = useMemo(() =>
    [...securityEvents].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ),
    [securityEvents, refreshToken]
  );

  return (
    <div className="p-4">
      <div className="font-semibold text-lg mb-4">Security Events</div>
      {sortedEvents.length === 0 ? (
        <div className="text-muted-foreground text-sm mt-2">
          No security events found.
        </div>
      ) : (
        <div className="overflow-x-auto border rounded-md">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-muted">
                <th className="p-2 text-left">Time</th>
                <th className="p-2 text-left">Type</th>
                <th className="p-2 text-left">Severity</th>
                <th className="p-2 text-left">Description</th>
                <th className="p-2 text-right">Details</th>
              </tr>
            </thead>
            <tbody>
              {sortedEvents.map((ev, ix) => (
                <tr key={ix} className="border-b hover:bg-accent/30">
                  <td className="p-2">{formatDate(ev.timestamp)}</td>
                  <td className="p-2 capitalize">{ev.type.replace("_", " ")}</td>
                  <td className="p-2">
                    <span
                      className={
                        ev.severity === "critical"
                          ? "text-red-600 font-bold"
                          : ev.severity === "high"
                          ? "text-red-400"
                          : ev.severity === "medium"
                          ? "text-yellow-600"
                          : "text-green-600"
                      }
                    >
                      {ev.severity}
                    </span>
                  </td>
                  <td className="p-2">{ev.description}</td>
                  <td className="p-2 text-right">
                    {onViewDetails && (
                      <button
                        className="btn btn-xs btn-outline"
                        onClick={() => onViewDetails(ev)}
                      >
                        View
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SecurityEventsPanel;
