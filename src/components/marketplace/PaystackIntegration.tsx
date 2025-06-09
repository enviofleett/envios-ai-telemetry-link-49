
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, CheckCircle, Clock, RefreshCw, Download, Eye, Shield, Banknote, Calendar } from 'lucide-react';

interface PaystackTransaction {
  id: string;
  reference: string;
  orderId: string;
  customerEmail: string;
  amount: number;
  commission: number;
  netAmount: number;
  status: 'success' | 'pending' | 'failed' | 'abandoned';
  paymentMethod: string;
  currency: string;
  paidAt: string;
  channel: string;
  gatewayResponse: string;
}

interface EscrowTransaction {
  id: string;
  orderId: string;
  amount: number;
  status: 'held' | 'released' | 'refunded';
  heldAt: string;
  releasedAt?: string;
  validationCode: string;
  merchantId: string;
  customerId: string;
}

interface PayoutSummary {
  totalEarnings: number;
  pendingPayouts: number;
  completedPayouts: number;
  nextPayoutDate: string;
  nextPayoutAmount: number;
}

const mockTransactions: PaystackTransaction[] = [
  {
    id: 'txn_001',
    reference: 'PSK_001_1234567890',
    orderId: 'ORD-001',
    customerEmail: 'john.smith@email.com',
    amount: 29999,
    commission: 2999,
    netAmount: 27000,
    status: 'success',
    paymentMethod: 'card',
    currency: 'USD',
    paidAt: '2024-03-15T10:30:00Z',
    channel: 'card',
    gatewayResponse: 'Successful',
  },
  {
    id: 'txn_002',
    reference: 'PSK_002_1234567891',
    orderId: 'ORD-002',
    customerEmail: 'sarah.j@email.com',
    amount: 24999,
    commission: 2499,
    netAmount: 22500,
    status: 'success',
    paymentMethod: 'bank_transfer',
    currency: 'USD',
    paidAt: '2024-03-14T14:20:00Z',
    channel: 'bank',
    gatewayResponse: 'Successful',
  },
];

const mockEscrowTransactions: EscrowTransaction[] = [
  {
    id: 'esc_001',
    orderId: 'ORD-001',
    amount: 27000,
    status: 'held',
    heldAt: '2024-03-15T10:30:00Z',
    validationCode: 'ABC123',
    merchantId: 'merchant-1',
    customerId: 'customer-1',
  },
  {
    id: 'esc_002',
    orderId: 'ORD-002',
    amount: 22500,
    status: 'released',
    heldAt: '2024-03-14T14:20:00Z',
    releasedAt: '2024-03-14T16:45:00Z',
    validationCode: 'XYZ789',
    merchantId: 'merchant-1',
    customerId: 'customer-2',
  },
];

const mockPayoutSummary: PayoutSummary = {
  totalEarnings: 49500,
  pendingPayouts: 27000,
  completedPayouts: 22500,
  nextPayoutDate: '2024-03-22',
  nextPayoutAmount: 27000,
};

export const PaystackIntegration: React.FC = () => {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState(mockTransactions);
  const [escrowTransactions, setEscrowTransactions] = useState(mockEscrowTransactions);
  const [payoutSummary, setPayoutSummary] = useState(mockPayoutSummary);
  const [selectedTransaction, setSelectedTransaction] = useState<PaystackTransaction | null>(null);
  const [showTransactionDetails, setShowTransactionDetails] = useState(false);
  const [showPayoutDialog, setShowPayoutDialog] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Success</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'abandoned':
        return <Badge className="bg-gray-100 text-gray-800">Abandoned</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getEscrowStatusBadge = (status: string) => {
    switch (status) {
      case 'held':
        return <Badge className="bg-yellow-100 text-yellow-800">Held in Escrow</Badge>;
      case 'released':
        return <Badge className="bg-green-100 text-green-800">Released</Badge>;
      case 'refunded':
        return <Badge variant="destructive">Refunded</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatAmount = (amount: number) => {
    return (amount / 100).toFixed(2);
  };

  const handleRequestPayout = () => {
    toast({
      title: "Payout Requested",
      description: "Funds will be transferred to your bank account within 1-2 business days.",
    });
    setShowPayoutDialog(false);
  };

  const handleRefreshTransactions = () => {
    toast({
      title: "Transactions Updated",
      description: "Payment data has been refreshed from Paystack.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Payment Management</h2>
          <p className="text-muted-foreground">Track payments, escrow, and payouts via Paystack</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefreshTransactions}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Payment Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${formatAmount(payoutSummary.totalEarnings)}</div>
            <p className="text-xs text-muted-foreground">Net after commission</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${formatAmount(payoutSummary.pendingPayouts)}</div>
            <p className="text-xs text-muted-foreground">Awaiting validation</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Payouts</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${formatAmount(payoutSummary.completedPayouts)}</div>
            <p className="text-xs text-muted-foreground">Successfully transferred</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Payout</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${formatAmount(payoutSummary.nextPayoutAmount)}</div>
            <p className="text-xs text-muted-foreground">{payoutSummary.nextPayoutDate}</p>
          </CardContent>
        </Card>
      </div>

      {/* Next Payout Card */}
      {payoutSummary.nextPayoutAmount > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                  <Banknote className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-800">Payout Ready</h3>
                  <p className="text-sm text-green-700">
                    ${formatAmount(payoutSummary.nextPayoutAmount)} is ready to be transferred to your bank account
                  </p>
                </div>
              </div>
              <Button onClick={() => setShowPayoutDialog(true)} className="bg-green-600 hover:bg-green-700">
                <Banknote className="h-4 w-4 mr-2" />
                Request Payout
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Transactions</CardTitle>
          <CardDescription>All payments processed through Paystack</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Net Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-mono text-sm">{transaction.reference}</TableCell>
                  <TableCell>{transaction.orderId}</TableCell>
                  <TableCell>{transaction.customerEmail}</TableCell>
                  <TableCell>${formatAmount(transaction.amount)}</TableCell>
                  <TableCell className="text-red-600">-${formatAmount(transaction.commission)}</TableCell>
                  <TableCell className="font-medium text-green-600">${formatAmount(transaction.netAmount)}</TableCell>
                  <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                  <TableCell>{new Date(transaction.paidAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedTransaction(transaction);
                        setShowTransactionDetails(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Escrow Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Escrow Management</CardTitle>
          <CardDescription>Funds held in escrow pending service validation</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Validation Code</TableHead>
                <TableHead>Held Since</TableHead>
                <TableHead>Released At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {escrowTransactions.map((escrow) => (
                <TableRow key={escrow.id}>
                  <TableCell>{escrow.orderId}</TableCell>
                  <TableCell>${formatAmount(escrow.amount)}</TableCell>
                  <TableCell>{getEscrowStatusBadge(escrow.status)}</TableCell>
                  <TableCell className="font-mono">{escrow.validationCode}</TableCell>
                  <TableCell>{new Date(escrow.heldAt).toLocaleDateString()}</TableCell>
                  <TableCell>{escrow.releasedAt ? new Date(escrow.releasedAt).toLocaleDateString() : '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Transaction Details Dialog */}
      <Dialog open={showTransactionDetails} onOpenChange={setShowTransactionDetails}>
        <DialogContent className="max-w-2xl">
          {selectedTransaction && (
            <>
              <DialogHeader>
                <DialogTitle>Transaction Details</DialogTitle>
                <DialogDescription>Complete payment information from Paystack</DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Payment Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label className="text-sm font-medium">Reference</Label>
                        <div className="mt-1 font-mono text-sm">{selectedTransaction.reference}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Order ID</Label>
                        <div className="mt-1">{selectedTransaction.orderId}</div>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label className="text-sm font-medium">Customer Email</Label>
                        <div className="mt-1">{selectedTransaction.customerEmail}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Payment Method</Label>
                        <div className="mt-1 capitalize">{selectedTransaction.paymentMethod.replace('_', ' ')}</div>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <Label className="text-sm font-medium">Total Amount</Label>
                        <div className="mt-1 text-lg font-bold">${formatAmount(selectedTransaction.amount)}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Commission</Label>
                        <div className="mt-1 text-lg font-bold text-red-600">
                          -${formatAmount(selectedTransaction.commission)}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Net Amount</Label>
                        <div className="mt-1 text-lg font-bold text-green-600">
                          ${formatAmount(selectedTransaction.netAmount)}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label className="text-sm font-medium">Status</Label>
                        <div className="mt-1">{getStatusBadge(selectedTransaction.status)}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Payment Date</Label>
                        <div className="mt-1">{new Date(selectedTransaction.paidAt).toLocaleString()}</div>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label className="text-sm font-medium">Channel</Label>
                        <div className="mt-1 capitalize">{selectedTransaction.channel}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Gateway Response</Label>
                        <div className="mt-1">{selectedTransaction.gatewayResponse}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowTransactionDetails(false)}>
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Payout Request Dialog */}
      <Dialog open={showPayoutDialog} onOpenChange={setShowPayoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Payout</DialogTitle>
            <DialogDescription>Transfer your available earnings to your registered bank account</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800 font-medium">
                <CheckCircle className="h-4 w-4" />
                Payout Amount: ${formatAmount(payoutSummary.nextPayoutAmount)}
              </div>
              <p className="text-sm text-green-700 mt-1">
                This amount will be transferred to your registered bank account
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>Available Balance:</span>
                <span className="font-medium">${formatAmount(payoutSummary.nextPayoutAmount)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Transfer Fee:</span>
                <span className="font-medium">$0.00</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between font-medium">
                <span>You will receive:</span>
                <span>${formatAmount(payoutSummary.nextPayoutAmount)}</span>
              </div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800 font-medium">
                <Shield className="h-4 w-4" />
                Secure Transfer via Paystack
              </div>
              <p className="text-sm text-blue-700 mt-1">
                Funds will be transferred within 1-2 business days to your verified bank account
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowPayoutDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRequestPayout}>
              <Banknote className="h-4 w-4 mr-2" />
              Request Payout
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
