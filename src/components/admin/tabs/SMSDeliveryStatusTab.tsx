
import React from "react";
import { useSMSLogs } from "@/components/sms/hooks/useSMSLogs";
import SMSDeliveryStatusSummary from "@/components/sms/SMSDeliveryStatusSummary";
import SMSDeliveryStatusChart from "@/components/sms/SMSDeliveryStatusChart";
import SMSDeliveryStatusTable from "@/components/sms/SMSDeliveryStatusTable";

const SMSDeliveryStatusTab: React.FC = () => {
  const { smsLogsResponse, loading } = useSMSLogs(1, 50);
  const logs = smsLogsResponse?.data ?? [];

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight mb-2">SMS Delivery Status</h2>
      <div className="flex flex-wrap md:flex-nowrap gap-6 mb-6">
        <div className="flex-1">
          <SMSDeliveryStatusSummary logs={logs} />
        </div>
        <div className="w-full md:w-[350px] max-w-sm">
          <SMSDeliveryStatusChart logs={logs} />
        </div>
      </div>
      <SMSDeliveryStatusTable logs={logs} loading={loading} />
    </div>
  );
};

export default SMSDeliveryStatusTab;
