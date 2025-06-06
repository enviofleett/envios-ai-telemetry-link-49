
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Download } from 'lucide-react';
import type { ReportData } from '@/hooks/useReports';

interface ReportTableProps {
  data: ReportData[];
  isLoading: boolean;
  type: string;
}

const ReportTable: React.FC<ReportTableProps> = ({ data, isLoading, type }) => {
  if (isLoading) {
    return (
      <div className="border border-gray-lighter rounded-lg">
        <div className="flex items-center justify-between bg-gray-background px-4 py-3 border-b border-gray-lighter">
          <h4 className="text-sm font-medium text-primary-dark">
            Loading {type} report...
          </h4>
        </div>
        <div className="p-8 text-center">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="border border-gray-lighter rounded-lg">
        <div className="flex items-center justify-between bg-gray-background px-4 py-3 border-b border-gray-lighter">
          <h4 className="text-sm font-medium text-primary-dark">
            {type.charAt(0).toUpperCase() + type.slice(1)} Report
          </h4>
        </div>
        <div className="p-8 text-center text-gray-mid">
          <p>No data available for the selected filters.</p>
          <p className="text-sm mt-2">Try adjusting your date range or vehicle selection.</p>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const variant = status === 'Alert' ? 'destructive' : 'default';
    return <Badge variant={variant}>{status}</Badge>;
  };

  return (
    <div className="border border-gray-lighter rounded-lg">
      {/* Table Header */}
      <div className="flex items-center justify-between bg-gray-background px-4 py-3 border-b border-gray-lighter">
        <h4 className="text-sm font-medium text-primary-dark">
          {type.charAt(0).toUpperCase() + type.slice(1)} Report ({data.length} records)
        </h4>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="bg-white border-gray-lighter text-primary-dark hover:bg-gray-background"
          >
            <Eye className="w-4 h-4 mr-2" />
            View Details
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-background">
            <tr className="border-b border-gray-lighter">
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-dark">Vehicle</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-dark">Type</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-dark">Start Time</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-dark">End Time</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-dark">Duration</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-dark">Distance</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-dark">Avg Speed</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-dark">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={row.id} className="border-b border-gray-lighter hover:bg-gray-background/50">
                <td className="px-4 py-3">
                  <div>
                    <div className="text-sm font-medium text-primary-dark">{row.vehicleName}</div>
                    <div className="text-xs text-gray-mid">{row.vehicleId}</div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-primary-dark">{row.type}</td>
                <td className="px-4 py-3 text-sm text-primary-dark">{row.startTime}</td>
                <td className="px-4 py-3 text-sm text-primary-dark">{row.endTime}</td>
                <td className="px-4 py-3 text-sm text-primary-dark">{row.duration}</td>
                <td className="px-4 py-3 text-sm text-primary-dark">{row.distance}</td>
                <td className="px-4 py-3 text-sm text-primary-dark">{row.averageSpeed}</td>
                <td className="px-4 py-3">{getStatusBadge(row.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="px-4 py-3 bg-gray-background border-t border-gray-lighter">
        <div className="flex items-center justify-between text-sm text-gray-mid">
          <span>Showing {data.length} of {data.length} records</span>
          <span>Generated at {new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
};

export default ReportTable;
