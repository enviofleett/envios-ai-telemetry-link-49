
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import SMSLogsTable from "@/components/sms/SMSLogsTable";
import CreateSMSEventModal from "@/components/sms/CreateSMSEventModal";
import SMSLogsPagination from "@/components/sms/SMSLogsPagination";
import { useSMSLogs } from "@/components/sms/hooks/useSMSLogs";
import { toast } from "@/components/ui/use-toast";
import { AlertTriangle } from "lucide-react";

// Helper to check if ENCRYPTION_KEY error is present
function parseEncryptionKeyError(err: any) {
  if (!err) return false;
  if (typeof err === "string" && err.toLowerCase().includes("encryption key")) return true;
  if (err?.message && err.message.toLowerCase().includes("encryption key")) return true;
  return false;
}

// The main tab brings together other subcomponents.
const SMSLogsTab = () => {
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [encryptionKeyError, setEncryptionKeyError] = useState<string | null>(null);

  // --- EXISTING LOGS HOOK USAGE ---
  const {
    smsLogsResponse,
    setSmsLogsResponse,
    page,
    setPage,
    limit,
    setLimit,
    loading,
    lastError
  } = useSMSLogs(1, 10);

  useEffect(() => {
    // Listen for ENCRYPTION_KEY errors to show a user-friendly warning
    if (lastError && parseEncryptionKeyError(lastError)) {
      setEncryptionKeyError(
        "Encryption key misconfiguration: Please ensure ENCRYPTION_KEY is set to exactly 32 characters in Supabase Edge Function secrets."
      );
    } else {
      setEncryptionKeyError(null);
    }
  }, [lastError]);

  // --- Listen for SMS config update that should re-enable testing etc ---
  useEffect(() => {
    function handleConfigUpdate() {
      // You would add logic here to refresh whatever needs a valid config
      // For now, just a placeholder to demo pattern
      console.log('🔄 SMS config was updated, trigger dependent refresh as needed');
    }
    window.addEventListener('smsConfigUpdated', handleConfigUpdate);

    return () => {
      window.removeEventListener('smsConfigUpdated', handleConfigUpdate);
    };
  }, []);

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
      {/* If encryption error, show alert */}
      {encryptionKeyError && (
        <div className="flex items-center gap-2 mb-4 bg-yellow-100 border border-yellow-300 text-yellow-900 rounded p-3">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          <div>
            <b>Configuration Required:</b> {encryptionKeyError}<br />
            <span className="text-xs">Go to your Supabase dashboard &rarr; Edge Functions &rarr; settings-management &rarr; set ENCRYPTION_KEY (32 characters).</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">SMS Logs</h2>
        {/* FIX: Use Dialog to wrap the Trigger + Modal */}
        <Dialog open={isCreateEventOpen} onOpenChange={setIsCreateEventOpen}>
          <DialogTrigger asChild>
            <Button>Create Event</Button>
          </DialogTrigger>
          <CreateSMSEventModal
            open={isCreateEventOpen}
            setOpen={setIsCreateEventOpen}
            onEventCreated={handleEventCreated}
          />
        </Dialog>
      </div>

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
