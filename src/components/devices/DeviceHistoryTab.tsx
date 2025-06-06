
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface DeviceHistoryTabProps {
  deviceId: string;
}

const DeviceHistoryTab: React.FC<DeviceHistoryTabProps> = ({ deviceId }) => {
  const serviceHistory = [
    {
      date: '2024-05-15',
      serviceType: 'Routine Check',
      technician: 'Mike Johnson',
      status: 'Complete',
      notes: 'All systems OK'
    },
    {
      date: '2024-02-10',
      serviceType: 'Firmware Update',
      technician: 'Sarah Wilson',
      status: 'Complete',
      notes: 'Updated to v2.1'
    },
    {
      date: '2024-01-15',
      serviceType: 'Initial Install',
      technician: 'John Smith',
      status: 'Complete',
      notes: 'First setup'
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Service History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Service Type</TableHead>
                <TableHead>Technician</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {serviceHistory.map((record, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{record.date}</TableCell>
                  <TableCell>{record.serviceType}</TableCell>
                  <TableCell>{record.technician}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <Badge variant="default" className="bg-green-50 text-green-700">
                        {record.status}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">{record.notes}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeviceHistoryTab;
