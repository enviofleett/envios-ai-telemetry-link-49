
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { referralApi } from '@/services/referralApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, AlertTriangle, DollarSign } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import RequestPayoutModal from './RequestPayoutModal';
import { Checkbox } from '@/components/ui/checkbox';

const CommissionHistoryTable: React.FC = () => {
  const { data: commissions, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['my-commission-history'],
    queryFn: referralApi.getCommissionHistory,
  });

  const [selectedCommissionIds, setSelectedCommissionIds] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const payableCommissions = useMemo(() => {
    return commissions?.filter(c => c.status === 'pending_payout') ?? [];
  }, [commissions]);

  const selectedCommissions = useMemo(() => {
    return payableCommissions.filter(c => selectedCommissionIds.includes(c.id));
  }, [payableCommissions, selectedCommissionIds]);

  const totalSelectedAmount = useMemo(() => {
    return selectedCommissions.reduce((acc, c) => acc + c.commission_amount, 0);
  }, [selectedCommissions]);


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case 'pending_payout':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending Payout</Badge>;
      case 'processing_payout':
        return <Badge className="bg-purple-100 text-purple-800">Processing Payout</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedCommissionIds(payableCommissions.map(c => c.id));
    } else {
      setSelectedCommissionIds([]);
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
    <>
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
            <div>
            <CardTitle>Commission History</CardTitle>
            <CardDescription>
                Select payable commissions to request a payout.
            </CardDescription>
            </div>
            <Button 
            disabled={selectedCommissions.length === 0}
            onClick={() => setIsModalOpen(true)}
            >
            Request Payout ({formatCurrency(totalSelectedAmount)})
            </Button>
        </CardHeader>
        <CardContent>
          {commissions && commissions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        payableCommissions.length > 0 &&
                        (selectedCommissionIds.length === payableCommissions.length
                          ? true
                          : selectedCommissionIds.length > 0
                          ? 'indeterminate'
                          : false)
                      }
                      onCheckedChange={handleSelectAll}
                      disabled={payableCommissions.length === 0}
                    />
                  </TableHead>
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
                    <TableCell>
                      {commission.status === 'pending_payout' && (
                        <Checkbox
                          checked={selectedCommissionIds.includes(commission.id)}
                          onCheckedChange={(checked) => {
                            if(checked) {
                              setSelectedCommissionIds(prev => [...prev, commission.id]);
                            } else {
                              setSelectedCommissionIds(prev => prev.filter(id => id !== commission.id));
                            }
                          }}
                        />
                      )}
                    </TableCell>
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
      {isModalOpen && (
        <RequestPayoutModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          commissions={selectedCommissions}
          onSuccess={() => {
            setSelectedCommissionIds([]);
            setIsModalOpen(false);
            refetch();
          }}
        />
      )}
    </>
  );
};

export default CommissionHistoryTable;
