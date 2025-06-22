
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  ShoppingCart, 
  Star, 
  Package, 
  TrendingUp,
  Users,
  DollarSign,
  Store
} from 'lucide-react';

export function EnhancedMarketplace() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Mock data for demonstration
  const categories = [
    { id: 'all', name: 'All Products', count: 156 },
    { id: 'hardware', name: 'Hardware', count: 45 },
    { id: 'software', name: 'Software', count: 32 },
    { id: 'services', name: 'Services', count: 28 },
    { id: 'accessories', name: 'Accessories', count: 51 }
  ];

  const featuredProducts = [
    {
      id: '1',
      name: 'GPS Tracker Pro',
      description: 'Advanced GPS tracking device with real-time monitoring',
      price: 199.99,
      rating: 4.8,
      reviews: 124,
      category: 'hardware',
      image: '/api/placeholder/200/150'
    },
    {
      id: '2',
      name: 'Fleet Management Software',
      description: 'Complete fleet management solution with analytics',
      price: 89.99,
      rating: 4.6,
      reviews: 89,
      category: 'software',
      image: '/api/placeholder/200/150'
    },
    {
      id: '3',
      name: 'Installation Service',
      description: 'Professional GPS tracker installation service',
      price: 49.99,
      rating: 4.9,
      reviews: 203,
      category: 'services',
      image: '/api/placeholder/200/150'
    }
  ];

  const marketplaceStats = {
    totalProducts: 156,
    totalMerchants: 23,
    totalSales: '$45,670',
    avgRating: 4.7
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Marketplace</h1>
          <p className="text-muted-foreground">
            Discover products and services for your fleet management needs
          </p>
        </div>
        <Button>
          <Store className="h-4 w-4 mr-2" />
          Become a Merchant
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{marketplaceStats.totalProducts}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Merchants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{marketplaceStats.totalMerchants}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{marketplaceStats.totalSales}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{marketplaceStats.avgRating}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="browse" className="space-y-4">
        <TabsList>
          <TabsTrigger value="browse">Browse Products</TabsTrigger>
          <TabsTrigger value="merchants">Merchants</TabsTrigger>
          <TabsTrigger value="orders">My Orders</TabsTrigger>
          <TabsTrigger value="wishlist">Wishlist</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4">
          {/* Search and Filter Bar */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>

          {/* Categories */}
          <div className="flex gap-2 flex-wrap">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name} ({category.count})
              </Button>
            ))}
          </div>

          {/* Featured Products */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Featured Products</h3>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featuredProducts.map((product) => (
                <Card key={product.id} className="overflow-hidden">
                  <div className="aspect-video bg-gray-100">
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Package className="h-12 w-12" />
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="font-semibold">{product.name}</h4>
                        <Badge variant="secondary">{product.category}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{product.description}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm ml-1">{product.rating}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          ({product.reviews} reviews)
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold">${product.price}</span>
                        <Button size="sm">
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Add to Cart
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="merchants" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Merchants Directory</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Browse our verified merchants and their product offerings.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Order History</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                View your past orders and track current shipments.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wishlist" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Wishlist</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Save products for later and get notified of price changes.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
