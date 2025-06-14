import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { referralApi } from '@/services/referral';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, AlertTriangle, Inbox } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { PayoutRequestStatus } from '@/types/referral';

const AgentPayoutsTable: React.FC = () => {
  const { data: payoutRequests, isLoading, isError, error } = useQuery({
    queryKey: ['my-payout-requests'],
    queryFn: referralApi.getMyPayoutRequests,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  }

  const getStatusBadge = (status: PayoutRequestStatus) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'approved':
        return <Badge className="bg-blue-100 text-blue-800">Approved</Badge>;
      case 'processing':
        return <Badge className="bg-purple-100 text-purple-800">Processing</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error Loading Payout Requests</AlertTitle>
        <AlertDescription>{(error as Error)?.message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payout History</CardTitle>
        <CardDescription>
          A history of all your payout requests.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {payoutRequests && payoutRequests.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Requested At</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Processed At</TableHead>
                <TableHead>Transaction Ref</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payoutRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>{format(new Date(request.requested_at), 'PPP p')}</TableCell>
                  <TableCell className="font-bold">{formatCurrency(request.amount)}</TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell>{request.processed_at ? format(new Date(request.processed_at), 'PPP p') : 'N/A'}</TableCell>
                  <TableCell>{request.transaction_ref ?? 'N/A'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-10">
            <Inbox className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No payout requests yet</h3>
            <p className="mt-1 text-sm text-gray-500">Your payout history will appear here.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AgentPayoutsTable;
