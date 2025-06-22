
import { useState, useEffect } from "react";
import { smsService, SMSLogsResponse } from "@/services/smsService";
import { toast } from "@/hooks/use-toast";

export function useSMSLogs(initialPage = 1, initialLimit = 10) {
  const [smsLogsResponse, setSmsLogsResponse] = useState<SMSLogsResponse | null>(null);
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [loading, setLoading] = useState(false);
  const [lastError, setLastError] = useState<any>(null);

  useEffect(() => {
    const fetchSMSLogs = async () => {
      setLoading(true);
      setLastError(null);
      try {
        const response = await smsService.getSMSLogs(page, limit);
        setSmsLogsResponse(response);
      } catch (error: any) {
        setLastError(error);
        toast({
          title: "Error",
          description: `Failed to fetch SMS logs.${error?.message ? ` ${error.message}` : ""}`,
          variant: "destructive",
        });
      }
      setLoading(false);
    };

    fetchSMSLogs();
  }, [page, limit]);

  return {
    smsLogsResponse,
    setSmsLogsResponse,
    page,
    setPage,
    limit,
    setLimit,
    loading,
    lastError,
  };
}
