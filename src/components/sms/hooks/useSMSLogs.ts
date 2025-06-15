
import { useState, useEffect } from "react";
import { smsService, SMSLogsResponse } from "@/services/smsService";
import { toast } from "@/components/ui/use-toast";

export function useSMSLogs(initialPage = 1, initialLimit = 10) {
  const [smsLogsResponse, setSmsLogsResponse] = useState<SMSLogsResponse | null>(null);
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSMSLogs = async () => {
      setLoading(true);
      try {
        const response = await smsService.getSMSLogs(page, limit);
        setSmsLogsResponse(response);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch SMS logs.",
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
  };
}
