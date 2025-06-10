
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { CreditCard, DollarSign, Receipt, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WorkshopTransaction {
  id: string;
  workshop_id: string;
  customer_id: string;
  vehicle_id?: string;
  transaction_type: 'connection_fee' | 'activation_fee' | 'service_fee' | 'inspection_fee';
  amount: number;
  currency: string;
  payment_status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  payment_method?: string;
  transaction_date: string;
  service_description?: string;
  customer?: {
    name: string;
    email: string;
  };
  vehicle?: {
    device_id: string;
  };
}

interface WorkshopPaymentSystemProps {
  workshopId: string;
}

const WorkshopPaymentSystem: React.FC<WorkshopPaymentSystemProps> = ({
  workshopId
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateTransaction, setShowCreateTransaction] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<WorkshopTransaction | null>(null);
  
  // Form state
  const [customerId, setCustomerId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [transactionType, setTransactionType] = useState<'connection_fee' | 'activation_fee' | 'service_fee' | 'inspection_fee'>('service_fee');
  const [amount, setAmount] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');

  // Fetch transactions
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['workshop-transactions', workshopId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workshop_transactions')
        .select(`
          *,
          customer:envio_users(name, email),
          vehicle:vehicles(device_id)
        `)
        .eq('workshop_id', workshopId)
        .order('transaction_date', { ascending: false });

      if (error) throw error;
      return data as WorkshopTransaction[];
    }
  });

  // Fetch customers (users)
  const { data: customers } = useQuery({
    queryKey: ['workshop-customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('envio_users')
        .select('id, name, email')
        .limit(100);

      if (error) throw error;
      return data;
    }
  });

  // Fetch vehicles - only select existing columns
  const { data: vehicles } = useQuery({
    queryKey: ['workshop-vehicles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, device_id')
        .limit(100);

      if (error) throw error;
      return data;
    }
  });

  // Create transaction mutation
  const createTransactionMutation = useMutation({
    mutationFn: async (transactionData: any) => {
      const { data, error } = await supabase
        .from('workshop_transactions')
        .insert({
          workshop_id: workshopId,
          customer_id: customerId,
          vehicle_id: vehicleId || null,
          transaction_type: transactionType,
          amount: parseFloat(amount),
          service_description: serviceDescription,
          payment_status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workshop-transactions', workshopId] });
      setShowCreateTransaction(false);
      resetForm();
      toast({
        title: "Transaction Created",
        description: "Payment request has been created successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create transaction: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Update transaction status mutation
  const updateTransactionMutation = useMutation({
    mutationFn: async ({ transactionId, status }: { transactionId: string; status: string }) => {
      const { data, error } = await supabase
        .from('workshop_transactions')
        .update({ payment_status: status })
        .eq('id', transactionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workshop-transactions', workshopId] });
      toast({
        title: "Status Updated",
        description: "Transaction status has been updated"
      });
    }
  });

  const resetForm = () => {
    setCustomerId('');
    setVehicleId('');
    setTransactionType('service_fee');
    setAmount('');
    setServiceDescription('');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      processing: { color: 'bg-blue-100 text-blue-800', label: 'Processing' },
      completed: { color: 'bg-green-100 text-green-800', label: 'Completed' },
      failed: { color: 'bg-red-100 text-red-800', label: 'Failed' },
      refunded: { color: 'bg-gray-100 text-gray-800', label: 'Refunded' }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getTransactionStats = () => {
    if (!transactions) return { total: 0, completed: 0, pending: 0, revenue: 0 };

    const completed = transactions.filter(t => t.payment_status === 'completed');
    const pending = transactions.filter(t => t.payment_status === 'pending');
    const revenue = completed.reduce((sum, t) => sum + t.amount, 0);

    return {
      total: transactions.length,
      completed: completed.length,
      pending: pending.length,
      revenue
    };
  };

  const stats = getTransactionStats();

  const handleCreateTransaction = () => {
    if (!customerId || !amount || parseFloat(amount) <= 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields with valid values",
        variant: "destructive"
      });
      return;
    }

    createTransactionMutation.mutate({});
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Transactions</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Receipt className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <CreditCard className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Revenue</p>
                <p className="text-2xl font-bold text-green-600">${stats.revenue.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Payment Transactions</CardTitle>
              <CardDescription>
                Manage workshop payments and fees
              </CardDescription>
            </div>
            <Button onClick={() => setShowCreateTransaction(true)}>
              Create Transaction
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {transactions?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No transactions found. Create your first transaction to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {transactions?.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="font-medium">{transaction.customer?.name}</div>
                      <div className="text-sm text-muted-foreground">{transaction.customer?.email}</div>
                      <div className="text-sm text-muted-foreground">
                        {transaction.vehicle?.device_id && `Vehicle: ${transaction.vehicle.device_id}`}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="font-medium capitalize">
                      {transaction.transaction_type.replace('_', ' ')}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {transaction.service_description}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="font-bold text-lg">${transaction.amount}</div>
                    <div className="text-sm text-muted-foreground">{transaction.currency}</div>
                  </div>
                  
                  <div className="text-center">
                    {getStatusBadge(transaction.payment_status)}
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(transaction.transaction_date).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {transaction.payment_status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => updateTransactionMutation.mutate({
                            transactionId: transaction.id,
                            status: 'completed'
                          })}
                        >
                          Mark Paid
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateTransactionMutation.mutate({
                            transactionId: transaction.id,
                            status: 'failed'
                          })}
                        >
                          Mark Failed
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Transaction Dialog */}
      <Dialog open={showCreateTransaction} onOpenChange={setShowCreateTransaction}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Payment Transaction</DialogTitle>
            <DialogDescription>
              Create a new payment request for workshop services
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="customer">Customer *</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers?.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name} ({customer.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="vehicle">Vehicle (Optional)</Label>
              <Select value={vehicleId} onValueChange={setVehicleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No vehicle</SelectItem>
                  {vehicles?.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.device_id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="type">Transaction Type *</Label>
              <Select value={transactionType} onValueChange={(value: any) => setTransactionType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="connection_fee">Connection Fee</SelectItem>
                  <SelectItem value="activation_fee">Activation Fee</SelectItem>
                  <SelectItem value="service_fee">Service Fee</SelectItem>
                  <SelectItem value="inspection_fee">Inspection Fee</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Service Description</Label>
              <Textarea
                id="description"
                value={serviceDescription}
                onChange={(e) => setServiceDescription(e.target.value)}
                placeholder="Describe the service provided..."
                rows={3}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowCreateTransaction(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTransaction} disabled={createTransactionMutation.isPending}>
              Create Transaction
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkshopPaymentSystem;
