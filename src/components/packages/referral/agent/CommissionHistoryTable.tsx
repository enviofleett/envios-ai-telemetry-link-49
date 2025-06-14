
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { referralApi } from '@/services/referralApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, AlertTriangle, DollarSign } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const CommissionHistoryTable: React.FC = () => {
  const { data: commissions, isLoading, isError, error } = useQuery({
    queryKey: ['my-commission-history'],
    queryFn: referralApi.getCommissionHistory,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case 'pending_payout':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
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
        <AlertTitle>Error Loading Commissions</AlertTitle>
        <AlertDescription>{(error as Error)?.message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Commission History</CardTitle>
        <CardDescription>
          A detailed history of all commissions you've earned.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {commissions && commissions.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>From User</TableHead>
                <TableHead>Source Type</TableHead>
                <TableHead>Source Amount</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {commissions.map((commission) => (
                <TableRow key={commission.id}>
                  <TableCell>{format(new Date(commission.created_at), 'PPP')}</TableCell>
                  <TableCell>{commission.referred_user_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {commission.source_type.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(commission.source_amount)}</TableCell>
                  <TableCell className="font-bold text-green-600">{formatCurrency(commission.commission_amount)}</TableCell>
                  <TableCell>{getStatusBadge(commission.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-10">
            <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No commissions earned yet</h3>
            <p className="mt-1 text-sm text-gray-500">Your earned commissions will appear here.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CommissionHistoryTable;
