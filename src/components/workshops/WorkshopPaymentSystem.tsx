
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CreditCard, 
  DollarSign, 
  TrendingUp,
  Receipt,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  date: string;
  customer_name?: string;
}

interface PaymentSummary {
  totalRevenue: number;
  monthlyRevenue: number;
  pendingPayments: number;
  completedTransactions: number;
}

interface WorkshopPaymentSystemProps {
  workshopId: string;
}

const WorkshopPaymentSystem: React.FC<WorkshopPaymentSystemProps> = ({
  workshopId
}) => {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<PaymentSummary>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    pendingPayments: 0,
    completedTransactions: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPaymentData();
  }, [workshopId]);

  const loadPaymentData = async () => {
    try {
      // Mock data for demonstration
      const mockTransactions: Transaction[] = [
        {
          id: '1',
          type: 'inspection_fee',
          amount: 150.00,
          currency: 'USD',
          status: 'completed',
          description: 'Annual vehicle inspection',
          date: new Date().toISOString(),
          customer_name: 'John Doe'
        },
        {
          id: '2',
          type: 'connection_fee',
          amount: 99.99,
          currency: 'USD',
          status: 'pending',
          description: 'Workshop connection fee',
          date: new Date().toISOString(),
          customer_name: 'Jane Smith'
        },
        {
          id: '3',
          type: 'service_fee',
          amount: 250.00,
          currency: 'USD',
          status: 'completed',
          description: 'Diagnostic service',
          date: new Date(Date.now() - 86400000).toISOString(),
          customer_name: 'Mike Johnson'
        }
      ];

      setTransactions(mockTransactions);
      
      // Calculate summary
      const totalRevenue = mockTransactions
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0);
        
      const monthlyRevenue = mockTransactions
        .filter(t => {
          const transactionDate = new Date(t.date);
          const now = new Date();
          return transactionDate.getMonth() === now.getMonth() && 
                 transactionDate.getFullYear() === now.getFullYear() &&
                 t.status === 'completed';
        })
        .reduce((sum, t) => sum + t.amount, 0);

      const pendingPayments = mockTransactions
        .filter(t => t.status === 'pending')
        .reduce((sum, t) => sum + t.amount, 0);

      const completedTransactions = mockTransactions
        .filter(t => t.status === 'completed').length;

      setSummary({
        totalRevenue,
        monthlyRevenue,
        pendingPayments,
        completedTransactions
      });

    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load payment data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'connection_fee': return 'Connection Fee';
      case 'activation_fee': return 'Activation Fee';
      case 'service_fee': return 'Service Fee';
      case 'inspection_fee': return 'Inspection Fee';
      default: return type;
    }
  };

  const summaryCards = [
    {
      title: 'Total Revenue',
      value: `$${summary.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      title: 'Monthly Revenue',
      value: `$${summary.monthlyRevenue.toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-blue-600'
    },
    {
      title: 'Pending Payments',
      value: `$${summary.pendingPayments.toFixed(2)}`,
      icon: Clock,
      color: 'text-yellow-600'
    },
    {
      title: 'Completed Transactions',
      value: summary.completedTransactions.toString(),
      icon: Receipt,
      color: 'text-purple-600'
    }
  ];

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Payment Management</h2>
        <p className="text-muted-foreground">
          Track payments, revenue, and financial transactions
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold">{card.value}</p>
                </div>
                <card.icon className={`h-8 w-8 ${card.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="transactions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="transactions">Recent Transactions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Payment Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          {transactions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Transactions</h3>
                <p className="text-muted-foreground">
                  Payment transactions will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {transactions.map((transaction) => (
                <Card key={transaction.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">
                            ${transaction.amount.toFixed(2)} {transaction.currency}
                          </h3>
                          <Badge variant="outline">{getTypeLabel(transaction.type)}</Badge>
                          {getStatusBadge(transaction.status)}
                        </div>
                        
                        <p className="text-muted-foreground mb-2">
                          {transaction.description}
                        </p>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div>
                            <Calendar className="h-4 w-4 inline mr-1" />
                            {new Date(transaction.date).toLocaleDateString()}
                          </div>
                          {transaction.customer_name && (
                            <div>
                              Customer: {transaction.customer_name}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                        {transaction.status === 'pending' && (
                          <Button size="sm">
                            Process Payment
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Analytics</CardTitle>
              <CardDescription>
                Payment analytics and revenue trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Analytics Coming Soon</h3>
                <p className="text-muted-foreground">
                  Detailed payment analytics and charts will be available here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Settings</CardTitle>
              <CardDescription>
                Configure payment methods and pricing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Payment Configuration</h3>
                <p className="text-muted-foreground mb-4">
                  Set up payment processors and configure pricing
                </p>
                <Button>
                  Configure Payments
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WorkshopPaymentSystem;
