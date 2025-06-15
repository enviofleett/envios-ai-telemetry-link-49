
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { DialogTrigger } from "@/components/ui/dialog";
import SMSLogsTable from "@/components/sms/SMSLogsTable";
import CreateSMSEventModal from "@/components/sms/CreateSMSEventModal";
import SMSLogsPagination from "@/components/sms/SMSLogsPagination";
import { useSMSLogs } from "@/components/sms/hooks/useSMSLogs";
import { toast } from "@/components/ui/use-toast";

// The main tab brings together other subcomponents.
const SMSLogsTab = () => {
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const {
    smsLogsResponse,
    setSmsLogsResponse,
    page,
    setPage,
    limit,
    setLimit,
    loading,
  } = useSMSLogs(1, 10);

  const logs = smsLogsResponse?.data ?? [];
  const pagination = {
    total: smsLogsResponse?.total ?? 0,
    page: smsLogsResponse?.page ?? 1,
    limit: smsLogsResponse?.limit ?? 50,
  };

  const handleEventCreated = () => {
    setPage(1);
    toast({
      title: "Success",
      description: "Event created successfully. Refreshing logs...",
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">SMS Logs</h2>
        <DialogTrigger asChild>
          <Button onClick={() => setIsCreateEventOpen(true)}>Create Event</Button>
        </DialogTrigger>
      </div>

      <CreateSMSEventModal open={isCreateEventOpen} setOpen={setIsCreateEventOpen} onEventCreated={handleEventCreated} />

      <div className="py-4">
        <SMSLogsTable logs={logs} loading={loading} />
        <SMSLogsPagination
          page={page}
          limit={limit}
          total={pagination.total}
          setPage={setPage}
          setLimit={setLimit}
        />
      </div>
    </div>
  );
};

export default SMSLogsTab;
