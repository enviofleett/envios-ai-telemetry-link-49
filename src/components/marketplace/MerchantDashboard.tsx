import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DollarSign,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  BarChart3,
  Bell,
  Settings,
} from 'lucide-react';
import { MerchantAnalytics } from './MerchantAnalytics';
import { MerchantOrderManagement } from './MerchantOrderManagement';
import { MerchantProductManagement } from './MerchantProductManagement';

interface MerchantStats {
  totalSales: number;
  totalOrders: number;
  activeProducts: number;
  pendingOrders: number;
  rating: number;
  reviewCount: number;
  monthlyGrowth: number;
  conversionRate: number;
}

interface RecentOrder {
  id: string;
  customerName: string;
  productName: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  date: string;
  validationCode?: string;
}

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  status: 'active' | 'inactive' | 'pending';
  sales: number;
  views: number;
  rating: number;
}

const mockStats: MerchantStats = {
  totalSales: 45280.5,
  totalOrders: 127,
  activeProducts: 8,
  pendingOrders: 3,
  rating: 4.8,
  reviewCount: 89,
  monthlyGrowth: 12.5,
  conversionRate: 3.2,
};

const mockRecentOrders: RecentOrder[] = [
  {
    id: 'ORD-001',
    customerName: 'John Smith',
    productName: 'Advanced Driver Analytics',
    amount: 299.99,
    status: 'pending',
    date: '2024-03-15',
    validationCode: 'ABC123',
  },
  {
    id: 'ORD-002',
    customerName: 'Sarah Johnson',
    productName: 'Fuel Optimization Suite',
    amount: 199.99,
    status: 'completed',
    date: '2024-03-14',
  },
  {
    id: 'ORD-003',
    customerName: 'Mike Wilson',
    productName: 'Premium Brake Kit',
    amount: 249.99,
    status: 'confirmed',
    date: '2024-03-13',
    validationCode: 'XYZ789',
  },
];

const mockProducts: Product[] = [
  {
    id: 'PROD-001',
    name: 'Advanced Driver Analytics',
    category: 'Telemetry',
    price: 29.99,
    status: 'active',
    sales: 45,
    views: 1247,
    rating: 4.8,
  },
  {
    id: 'PROD-002',
    name: 'Fuel Optimization Suite',
    category: 'Telemetry',
    price: 19.99,
    status: 'active',
    sales: 32,
    views: 892,
    rating: 4.6,
  },
  {
    id: 'PROD-003',
    name: 'Premium Brake Kit',
    category: 'Parts',
    price: 249.99,
    status: 'pending',
    sales: 18,
    views: 456,
    rating: 4.9,
  },
];

export const MerchantDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [merchantInfo] = useState({
    brandName: 'AutoCare Pro',
    fullName: 'John Smith',
    email: 'john@autocarepro.com',
    joinDate: 'January 2024',
    status: 'approved',
  });

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
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getProductStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending Review</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (activeTab === 'analytics') {
    return <MerchantAnalytics />;
  }

  if (activeTab === 'products') {
    return <MerchantProductManagement />;
  }

  if (activeTab === 'orders') {
    return <MerchantOrderManagement />;
  }

  if (activeTab === 'settings') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Merchant Settings</h2>
            <p className="text-muted-foreground">Configure your merchant account</p>
          </div>
          <Button onClick={() => setActiveTab('overview')}>
            Back to Dashboard
          </Button>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8 text-muted-foreground">
              <Settings className="h-12 w-12 mx-auto mb-4" />
              <p>Merchant settings interface coming soon</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Merchant Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {merchantInfo.fullName}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </Button>
          <Avatar>
            <AvatarImage src="/placeholder.svg" alt={merchantInfo.brandName} />
            <AvatarFallback>
              {merchantInfo.brandName
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">My Products</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${mockStats.totalSales.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">+{mockStats.monthlyGrowth}% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockStats.totalOrders}</div>
                <p className="text-xs text-muted-foreground">{mockStats.pendingOrders} pending validation</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Products</CardTitle>
                <Package className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockStats.activeProducts}</div>
                <p className="text-xs text-muted-foreground">{mockStats.conversionRate}% conversion rate</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rating</CardTitle>
                <Star className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockStats.rating}</div>
                <p className="text-xs text-muted-foreground">{mockStats.reviewCount} reviews</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Recent Orders
                  <Button variant="outline" size="sm" onClick={() => setActiveTab('orders')}>
                    View All
                  </Button>
                </CardTitle>
                <CardDescription>Latest customer orders requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockRecentOrders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium">{order.customerName}</div>
                          <div className="text-sm text-muted-foreground">{order.productName}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">${order.amount}</div>
                        <div className="text-sm">{getStatusBadge(order.status)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Product Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Product Performance
                  <Button variant="outline" size="sm" onClick={() => setActiveTab('products')}>
                    Manage Products
                  </Button>
                </CardTitle>
                <CardDescription>Your top performing products</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockProducts.slice(0, 5).map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Package className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-muted-foreground">{product.category}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{product.sales} sales</div>
                        <div className="text-sm">{getProductStatusBadge(product.status)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <Button className="h-20 flex flex-col gap-2" onClick={() => setActiveTab('products')}>
                  <Plus className="h-6 w-6" />
                  Add Product
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2" onClick={() => setActiveTab('orders')}>
                  <CheckCircle className="h-6 w-6" />
                  Validate Orders
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex flex-col gap-2"
                  onClick={() => setActiveTab('analytics')}
                >
                  <BarChart3 className="h-6 w-6" />
                  View Analytics
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2" onClick={() => setActiveTab('settings')}>
                  <Settings className="h-6 w-6" />
                  Settings
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Notifications & Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>Notifications & Alerts</CardTitle>
              <CardDescription>Important updates and reminders</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <div>
                    <div className="font-medium">3 orders pending validation</div>
                    <div className="text-sm text-muted-foreground">
                      Customers are waiting for service validation codes
                    </div>
                  </div>
                  <Button size="sm" onClick={() => setActiveTab('orders')}>
                    Review
                  </Button>
                </div>
                <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="font-medium">Monthly payout scheduled</div>
                    <div className="text-sm text-muted-foreground">
                      Your next payout of $2,450.30 is scheduled for March 30th
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-medium">Sales increased by 12.5%</div>
                    <div className="text-sm text-muted-foreground">
                      Great job! Your sales are up compared to last month
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
