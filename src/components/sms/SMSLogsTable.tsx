
import {
  flexRender,
  ColumnDef,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ScrollArea } from "@/components/ui/scroll-area";

type SMSLog = {
  id: string;
  recipient_phone: string;
  message: string;
  event_type?: string;
  status?: string;
  provider_name?: string;
  cost?: number;
  created_at?: string;
};

interface SMSLogsTableProps {
  logs: SMSLog[];
  loading: boolean;
}

export const columns: ColumnDef<SMSLog>[] = [
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
      return sentAt
        ? new Date(sentAt as string).toLocaleString()
        : "";
    },
  },
];

export default function SMSLogsTable({ logs, loading }: SMSLogsTableProps) {
  const table = useReactTable({
    data: logs,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="rounded-md border">
      <ScrollArea>
        <div className="relative min-w-[600px] overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="h-24 text-center">
                    Loading...
                  </td>
                </tr>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} data-state={row.getIsSelected() && "selected"} className="border-b transition-colors data-[state=selected]:bg-muted hover:bg-muted/50">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="p-4 align-middle">
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
  );
}
