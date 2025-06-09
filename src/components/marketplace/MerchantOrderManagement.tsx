
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Search,
  Eye,
  CheckCircle,
  Clock,
  DollarSign,
  Package,
  Phone,
  Mail,
  Car,
  AlertTriangle,
  Download,
  RefreshCw,
} from 'lucide-react';

interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  productName: string;
  productId: string;
  vehicleInfo: {
    plateNumber: string;
    model: string;
    year: string;
  };
  amount: number;
  commission: number;
  netAmount: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'disputed';
  paymentStatus: 'paid' | 'escrow' | 'released' | 'refunded';
  validationCode: string;
  orderDate: string;
  completedDate?: string;
  notes?: string;
}

const mockOrders: Order[] = [
  {
    id: 'ORD-001',
    customerName: 'John Smith',
    customerEmail: 'john.smith@email.com',
    customerPhone: '+1 (555) 123-4567',
    productName: 'Advanced Driver Analytics',
    productId: 'PROD-001',
    vehicleInfo: {
      plateNumber: 'ABC-1234',
      model: 'Ford Transit',
      year: '2022',
    },
    amount: 299.99,
    commission: 29.99,
    netAmount: 270.0,
    status: 'pending',
    paymentStatus: 'escrow',
    validationCode: 'ABC123',
    orderDate: '2024-03-15T10:30:00Z',
    notes: 'Customer requested installation assistance',
  },
  {
    id: 'ORD-002',
    customerName: 'Sarah Johnson',
    customerEmail: 'sarah.j@email.com',
    customerPhone: '+1 (555) 987-6543',
    productName: 'Premium Brake Kit',
    productId: 'PROD-002',
    vehicleInfo: {
      plateNumber: 'XYZ-5678',
      model: 'Mercedes Sprinter',
      year: '2023',
    },
    amount: 249.99,
    commission: 24.99,
    netAmount: 225.0,
    status: 'completed',
    paymentStatus: 'released',
    validationCode: 'XYZ789',
    orderDate: '2024-03-14T14:20:00Z',
    completedDate: '2024-03-14T16:45:00Z',
  },
  {
    id: 'ORD-003',
    customerName: 'Mike Wilson',
    customerEmail: 'mike.w@email.com',
    customerPhone: '+1 (555) 456-7890',
    productName: 'Fuel Optimization Suite',
    productId: 'PROD-003',
    vehicleInfo: {
      plateNumber: 'DEF-9012',
      model: 'Iveco Daily',
      year: '2021',
    },
    amount: 199.99,
    commission: 19.99,
    netAmount: 180.0,
    status: 'confirmed',
    paymentStatus: 'escrow',
    validationCode: 'DEF456',
    orderDate: '2024-03-13T09:15:00Z',
  },
];

export const MerchantOrderManagement: React.FC = () => {
  const [orders, setOrders] = useState(mockOrders);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [validationInput, setValidationInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const handleValidateOrder = (order: Order) => {
    setSelectedOrder(order);
    setValidationInput('');
    setShowValidationDialog(true);
  };

  const handleConfirmValidation = () => {
    if (selectedOrder && validationInput === selectedOrder.validationCode) {
      setOrders((prev) =>
        prev.map((order) =>
          order.id === selectedOrder.id
            ? {
                ...order,
                status: 'completed',
                paymentStatus: 'released',
                completedDate: new Date().toISOString(),
              }
            : order,
        ),
      );
      setShowValidationDialog(false);
      setValidationInput('');
      setSelectedOrder(null);
      alert('Order validated successfully! Funds have been released to your account.');
    } else {
      alert('Invalid validation code. Please check and try again.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending Validation</Badge>;
      case 'confirmed':
        return <Badge className="bg-blue-100 text-blue-800">Confirmed</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      case 'disputed':
        return <Badge className="bg-red-100 text-red-800">Disputed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-blue-100 text-blue-800">Paid</Badge>;
      case 'escrow':
        return <Badge className="bg-yellow-100 text-yellow-800">In Escrow</Badge>;
      case 'released':
        return <Badge className="bg-green-100 text-green-800">Released</Badge>;
      case 'refunded':
        return <Badge variant="destructive">Refunded</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const completedOrders = orders.filter((o) => o.status === 'completed');
  const totalRevenue = orders.filter((o) => o.status === 'completed').reduce((sum, o) => sum + o.netAmount, 0);
  const pendingRevenue = orders.filter((o) => o.paymentStatus === 'escrow').reduce((sum, o) => sum + o.netAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Order Management</h2>
          <p className="text-muted-foreground">Track and manage your customer orders</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Orders
          </Button>
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
            <p className="text-xs text-muted-foreground">{pendingOrders.length} pending validation</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Orders</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedOrders.length}</div>
            <p className="text-xs text-muted-foreground">
              {((completedOrders.length / orders.length) * 100).toFixed(1)}% completion rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Released</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Net after commission</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Revenue</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${pendingRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">In escrow</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Orders</TabsTrigger>
          <TabsTrigger value="pending">
            Pending Validation
            {pendingOrders.length > 0 && (
              <Badge className="ml-2 bg-yellow-100 text-yellow-800">{pendingOrders.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Orders</CardTitle>
              <CardDescription>Complete list of customer orders</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search orders..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src="/placeholder.svg" alt={order.customerName} />
                            <AvatarFallback className="text-xs">
                              {order.customerName
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-sm">{order.customerName}</div>
                            <div className="text-xs text-muted-foreground">{order.customerEmail}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{order.productName}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{order.vehicleInfo.plateNumber}</div>
                          <div className="text-muted-foreground">
                            {order.vehicleInfo.model} {order.vehicleInfo.year}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">${order.amount}</div>
                          <div className="text-xs text-muted-foreground">Net: ${order.netAmount}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>{getPaymentStatusBadge(order.paymentStatus)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowOrderDetails(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {order.status === 'pending' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleValidateOrder(order)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Orders Pending Validation</CardTitle>
              <CardDescription>Orders waiting for service completion validation</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingOrders.length > 0 ? (
                <div className="space-y-4">
                  {pendingOrders.map((order) => (
                    <Card key={order.id} className="border-yellow-200 bg-yellow-50">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src="/placeholder.svg" alt={order.customerName} />
                              <AvatarFallback>
                                {order.customerName
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold text-lg">{order.customerName}</h3>
                              <div className="space-y-1 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                  <Package className="h-3 w-3" />
                                  {order.productName}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Car className="h-3 w-3" />
                                  {order.vehicleInfo.plateNumber} - {order.vehicleInfo.model}
                                </div>
                                <div className="flex items-center gap-2">
                                  <DollarSign className="h-3 w-3" />${order.amount} (Net: ${order.netAmount})
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setSelectedOrder(order);
                                setShowOrderDetails(true);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                            <Button onClick={() => handleValidateOrder(order)}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Validate Order
                            </Button>
                          </div>
                        </div>
                        <div className="mt-4 p-3 bg-white border rounded-lg">
                          <div className="flex items-center gap-2 text-sm">
                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                            <strong>Validation Code:</strong> {order.validationCode}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Customer will provide this code when service is completed
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No pending validations</p>
                  <p className="text-sm">All orders have been processed</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Completed Orders</CardTitle>
              <CardDescription>Successfully completed and paid orders</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Completed Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>{order.customerName}</TableCell>
                      <TableCell>{order.productName}</TableCell>
                      <TableCell>${order.netAmount}</TableCell>
                      <TableCell>
                        {order.completedDate ? new Date(order.completedDate).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowOrderDetails(true);
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
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Order Trends</CardTitle>
                <CardDescription>Order volume over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  <Package className="h-8 w-8 mr-2" />
                  Order Analytics Chart Placeholder
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trends</CardTitle>
                <CardDescription>Revenue growth over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  <DollarSign className="h-8 w-8 mr-2" />
                  Revenue Analytics Chart Placeholder
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Order Details Dialog */}
      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="max-w-2xl">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle>Order Details - {selectedOrder.id}</DialogTitle>
                <DialogDescription>Complete order information and customer details</DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Customer Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src="/placeholder.svg" alt={selectedOrder.customerName} />
                          <AvatarFallback>
                            {selectedOrder.customerName
                              .split(' ')
                              .map((n) => n[0])
                              .join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{selectedOrder.customerName}</div>
                          <div className="text-sm text-muted-foreground">Customer</div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{selectedOrder.customerEmail}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{selectedOrder.customerPhone}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Vehicle Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Car className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{selectedOrder.vehicleInfo.plateNumber}</div>
                          <div className="text-sm text-muted-foreground">License Plate</div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm">
                          <span className="font-medium">Model:</span> {selectedOrder.vehicleInfo.model}
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Year:</span> {selectedOrder.vehicleInfo.year}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Order Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label className="text-sm font-medium">Product</Label>
                        <div className="mt-1">{selectedOrder.productName}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Order Date</Label>
                        <div className="mt-1">{new Date(selectedOrder.orderDate).toLocaleString()}</div>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <Label className="text-sm font-medium">Total Amount</Label>
                        <div className="mt-1 text-lg font-bold">${selectedOrder.amount}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Commission</Label>
                        <div className="mt-1 text-lg font-bold text-red-600">-${selectedOrder.commission}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Net Amount</Label>
                        <div className="mt-1 text-lg font-bold text-green-600">${selectedOrder.netAmount}</div>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label className="text-sm font-medium">Order Status</Label>
                        <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Payment Status</Label>
                        <div className="mt-1">{getPaymentStatusBadge(selectedOrder.paymentStatus)}</div>
                      </div>
                    </div>

                    {selectedOrder.status === 'pending' && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          Validation Code: {selectedOrder.validationCode}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Customer will provide this code when service is completed
                        </p>
                      </div>
                    )}

                    {selectedOrder.notes && (
                      <div>
                        <Label className="text-sm font-medium">Notes</Label>
                        <div className="mt-1 p-3 bg-muted rounded-lg text-sm">{selectedOrder.notes}</div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowOrderDetails(false)}>
                  Close
                </Button>
                {selectedOrder.status === 'pending' && (
                  <Button onClick={() => handleValidateOrder(selectedOrder)}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Validate Order
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Validation Dialog */}
      <Dialog open={showValidationDialog} onOpenChange={setShowValidationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Validate Order Completion</DialogTitle>
            <DialogDescription>
              Enter the validation code provided by the customer to confirm service completion
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedOrder && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="font-medium">{selectedOrder.customerName}</div>
                <div className="text-sm text-muted-foreground">{selectedOrder.productName}</div>
                <div className="text-sm text-muted-foreground">Order: {selectedOrder.id}</div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="validation-code">Validation Code *</Label>
              <Input
                id="validation-code"
                value={validationInput}
                onChange={(e) => setValidationInput(e.target.value.toUpperCase())}
                placeholder="Enter validation code"
                className="text-center text-lg font-mono"
                maxLength={6}
              />
              <p className="text-xs text-muted-foreground">
                The customer should provide this code after service completion
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowValidationDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmValidation} disabled={!validationInput.trim()}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Validate & Release Funds
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
