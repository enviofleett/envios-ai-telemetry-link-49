
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { referralApi } from '@/services/referralApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, AlertTriangle, Users } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const ReferredUsersTable: React.FC = () => {
  const { data: referredUsers, isLoading, isError, error } = useQuery({
    queryKey: ['my-referred-users'],
    queryFn: referralApi.getReferredUsers,
  });

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
        <AlertTitle>Error Loading Referred Users</AlertTitle>
        <AlertDescription>{(error as Error)?.message}</AlertDescription>
      </Alert>
    );
  }

  const isCommissionActive = (endDate: string) => {
    return new Date(endDate) > new Date();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Referred Users</CardTitle>
        <CardDescription>
          Here is a list of all users who have signed up using your referral codes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {referredUsers && referredUsers.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Signed Up</TableHead>
                <TableHead>Referral Code</TableHead>
                <TableHead>Commission Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {referredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.referred_user_name}</TableCell>
                  <TableCell>{user.referred_user_email}</TableCell>
                  <TableCell>{format(new Date(user.signed_up_at), 'PPP')}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{user.referral_code}</Badge>
                  </TableCell>
                  <TableCell>
                    {isCommissionActive(user.commission_earnings_end_date) ? (
                      <Badge>Active until {format(new Date(user.commission_earnings_end_date), 'PPP')}</Badge>
                    ) : (
                      <Badge variant="outline">Expired</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-10">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No referred users yet</h3>
            <p className="mt-1 text-sm text-gray-500">Share your referral codes to start earning commissions.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReferredUsersTable;
