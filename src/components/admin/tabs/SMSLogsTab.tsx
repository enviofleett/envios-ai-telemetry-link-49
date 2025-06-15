import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { smsService, SMSLog, SMSLogsResponse } from "@/services/smsService";

interface CreateEventFormProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onEventCreated: () => void;
}

const CreateEventForm: React.FC<CreateEventFormProps> = ({ open, setOpen, onEventCreated }) => {
  const [recipientPhone, setRecipientPhone] = useState("");
  const [message, setMessage] = useState("");
  const [eventType, setEventType] = useState("CUSTOM");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const isValidPhone = smsService.validatePhoneNumber(recipientPhone);
      if (!isValidPhone) {
        toast({
          title: "Invalid Phone Number",
          description: "Please enter a valid phone number.",
          variant: "destructive",
        });
        return;
      }

      const formattedPhoneNumber = smsService.formatPhoneNumber(recipientPhone);
      await smsService.sendSMS(formattedPhoneNumber, message, eventType);
      toast({
        title: "Success",
        description: "SMS event created successfully.",
      });
      onEventCreated();
      setOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create SMS event.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create SMS Event</DialogTitle>
          <DialogDescription>Create a new SMS event to send.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="recipientPhone">Recipient Phone</Label>
            <Input
              type="tel"
              id="recipientPhone"
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              placeholder="Recipient Phone"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="message">Message</Label>
            <Input
              type="text"
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Message"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="eventType">Event Type</Label>
            <Select value={eventType} onValueChange={setEventType}>
              <SelectTrigger>
                <SelectValue placeholder="Event Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CUSTOM">Custom</SelectItem>
                <SelectItem value="NOTIFICATION">Notification</SelectItem>
                <SelectItem value="REMINDER">Reminder</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const SMSLogsTab = () => {
  const [smsLogsResponse, setSmsLogsResponse] = useState<SMSLogsResponse | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);

  useEffect(() => {
    const fetchSMSLogs = async () => {
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
    };

    fetchSMSLogs();
  }, [page, limit]);

  const logs = smsLogsResponse?.data ?? [];
  const pagination = {
    total: smsLogsResponse?.total ?? 0,
    page: smsLogsResponse?.page ?? 1,
    limit: smsLogsResponse?.limit ?? 50,
  };

  const columns: ColumnDef<SMSLog>[] = [
    {
      accessorKey: "recipient_phone",
      header: "Recipient Phone",
    },
    {
      accessorKey: "message",
      header: "Message",
    },
    {
      accessorKey: "event_type",
      header: "Event Type",
    },
    {
      accessorKey: "status",
      header: "Status",
    },
    {
      accessorKey: "provider_name",
      header: "Provider",
    },
    {
      accessorKey: "cost",
      header: "Cost",
    },
    {
      accessorKey: "created_at",
      header: "Sent At",
      cell: ({ row }) => {
        const sentAt = row.getValue("created_at");
        return new Date(sentAt).toLocaleString();
      },
    },
  ];

  const table = useReactTable({
    data: logs,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

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

      <CreateEventForm open={isCreateEventOpen} setOpen={setIsCreateEventOpen} onEventCreated={handleEventCreated} />

      <div className="py-4">
        <div className="rounded-md border">
          <ScrollArea>
            <div className="relative min-w-[600px] overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        return (
                          <th key={header.id} className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=columnheader][data-state=sorted])]:after:content-['\u2191_']">
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                          </th>
                        );
                      })}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <tr key={row.id} data-state={row.getIsSelected() && "selected"} className="border-b transition-colors data-[state=selected]:bg-muted hover:bg-muted/50">
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="p-4 align-middle [&:has([role=checkbox])]:pr-0">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={columns.length} className="h-24 text-center">
                        No results.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </ScrollArea>
        </div>
        <div className="flex items-center justify-between py-4">
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLimit((prev) => (prev > 5 ? prev - 5 : 5))}
              disabled={limit <= 5}
            >
              Decrease Limit
            </Button>
            <Button variant="outline" size="sm" onClick={() => setLimit(limit + 5)}>
              Increase Limit
            </Button>
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationPrevious
                href="#"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
              />
              <PaginationNext
                href="#"
                onClick={() => setPage((prev) => prev + 1)}
                disabled={page === Math.ceil(pagination.total / pagination.limit)}
              />
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
};

export default SMSLogsTab;
