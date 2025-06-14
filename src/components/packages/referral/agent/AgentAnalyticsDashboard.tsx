
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { referralApi } from '@/services/referralApi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, AlertTriangle, TrendingUp } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { format } from 'date-fns';

const AgentAnalyticsDashboard: React.FC = () => {
  const { data: snapshots, isLoading, isError, error } = useQuery({
    queryKey: ['agent-performance-snapshots'],
    queryFn: referralApi.getAgentPerformanceSnapshots,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  }

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
        <AlertTitle>Error Loading Analytics</AlertTitle>
        <AlertDescription>{(error as Error)?.message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Performance Snapshots</CardTitle>
        <CardDescription>
          A look at your referral performance over the last 30 days.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {snapshots && snapshots.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Referrals</TableHead>
                <TableHead>Sign-ups</TableHead>
                <TableHead>Conversions</TableHead>
                <TableHead>Commission Earned</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {snapshots.map((snapshot) => (
                <TableRow key={snapshot.id}>
                  <TableCell>{format(new Date(snapshot.snapshot_date), 'PPP')}</TableCell>
                  <TableCell>{snapshot.total_referrals}</TableCell>
                  <TableCell>{snapshot.total_signups}</TableCell>
                  <TableCell>{snapshot.total_conversions}</TableCell>
                  <TableCell>{formatCurrency(snapshot.total_commission_earned)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-10">
            <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No performance data yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Snapshots are generated daily. Check back tomorrow for your first report.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AgentAnalyticsDashboard;
