
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Eye, Upload, Star, TrendingUp, Package, DollarSign, Search, Archive } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  fullDescription: string;
  category: string;
  price: number;
  priceUnit: string;
  status: 'active' | 'inactive' | 'pending' | 'rejected';
  images: string[];
  features: string[];
  tags: string[];
  inventory: number;
  sales: number;
  views: number;
  rating: number;
  reviewCount: number;
  createdDate: string;
  lastUpdated: string;
}

interface ProductFormData {
  name: string;
  description: string;
  fullDescription: string;
  category: string;
  price: string;
  priceUnit: string;
  features: string[];
  tags: string[];
  inventory: string;
  images: string[];
}

const categories = [
  'Auto Parts & Accessories',
  'Security & Safety',
  'Smart Vehicle Gadgets',
  'Vehicle Ownership Support',
];

const priceUnits = ['per item', 'per kit', 'per vehicle/month', 'per vehicle/year', 'per service', 'per hour'];

const mockProducts: Product[] = [
  {
    id: 'PROD-001',
    name: 'Advanced Driver Analytics',
    description: 'Real-time driver behavior monitoring and analytics platform',
    fullDescription: 'Comprehensive driver analytics solution with AI-powered insights...',
    category: 'Smart Vehicle Gadgets',
    price: 29.99,
    priceUnit: 'per vehicle/month',
    status: 'active',
    images: ['/placeholder.svg?height=200&width=300&text=Product+Image'],
    features: ['Real-time monitoring', 'AI analytics', 'Custom reports'],
    tags: ['analytics', 'driver behavior', 'safety'],
    inventory: 999,
    sales: 45,
    views: 1247,
    rating: 4.8,
    reviewCount: 89,
    createdDate: '2024-01-15',
    lastUpdated: '2024-03-10',
  },
  {
    id: 'PROD-002',
    name: 'Premium Brake Kit',
    description: 'High-performance brake pads and rotors for commercial vehicles',
    fullDescription: 'Professional-grade brake components designed for heavy-duty use...',
    category: 'Auto Parts & Accessories',
    price: 249.99,
    priceUnit: 'per kit',
    status: 'active',
    images: ['/placeholder.svg?height=200&width=300&text=Brake+Kit'],
    features: ['Heavy-duty components', '50,000-mile warranty', 'Professional installation'],
    tags: ['brakes', 'safety', 'maintenance'],
    inventory: 25,
    sales: 18,
    views: 456,
    rating: 4.9,
    reviewCount: 23,
    createdDate: '2024-02-01',
    lastUpdated: '2024-03-05',
  },
];

export const MerchantProductManagement: React.FC = () => {
  const [products, setProducts] = useState(mockProducts);
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [showEditProduct, setShowEditProduct] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentFeature, setCurrentFeature] = useState('');
  const [currentTag, setCurrentTag] = useState('');

  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    fullDescription: '',
    category: '',
    price: '',
    priceUnit: '',
    features: [],
    tags: [],
    inventory: '',
    images: [],
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      fullDescription: '',
      category: '',
      price: '',
      priceUnit: '',
      features: [],
      tags: [],
      inventory: '',
      images: [],
    });
    setCurrentFeature('');
    setCurrentTag('');
  };

  const handleCreateProduct = () => {
    resetForm();
    setShowCreateProduct(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      fullDescription: product.fullDescription,
      category: product.category,
      price: product.price.toString(),
      priceUnit: product.priceUnit,
      features: [...product.features],
      tags: [...product.tags],
      inventory: product.inventory.toString(),
      images: [...product.images],
    });
    setShowEditProduct(true);
  };

  const handleAddFeature = () => {
    if (currentFeature.trim() && !formData.features.includes(currentFeature.trim())) {
      setFormData((prev) => ({
        ...prev,
        features: [...prev.features, currentFeature.trim()],
      }));
      setCurrentFeature('');
    }
  };

  const handleRemoveFeature = (feature: string) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((f) => f !== feature),
    }));
  };

  const handleAddTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim().toLowerCase())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim().toLowerCase()],
      }));
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  const handleSubmitProduct = () => {
    const newProduct: Product = {
      id: `PROD-${Date.now()}`,
      name: formData.name,
      description: formData.description,
      fullDescription: formData.fullDescription,
      category: formData.category,
      price: Number.parseFloat(formData.price),
      priceUnit: formData.priceUnit,
      status: 'pending',
      images: formData.images,
      features: formData.features,
      tags: formData.tags,
      inventory: Number.parseInt(formData.inventory),
      sales: 0,
      views: 0,
      rating: 0,
      reviewCount: 0,
      createdDate: new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString().split('T')[0],
    };

    if (showEditProduct && selectedProduct) {
      setProducts((prev) =>
        prev.map((p) => (p.id === selectedProduct.id ? { ...newProduct, id: selectedProduct.id } : p)),
      );
    } else {
      setProducts((prev) => [...prev, newProduct]);
    }

    setShowCreateProduct(false);
    setShowEditProduct(false);
    resetForm();
    setSelectedProduct(null);
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const handleToggleStatus = (productId: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, status: p.status === 'active' ? 'inactive' : 'active' } : p)),
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending Review</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Product Management</h2>
          <p className="text-muted-foreground">Create and manage your products and services</p>
        </div>
        <Button onClick={handleCreateProduct}>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">
              {products.filter((p) => p.status === 'active').length} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.reduce((sum, p) => sum + p.sales, 0)}</div>
            <p className="text-xs text-muted-foreground">Across all products</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.reduce((sum, p) => sum + p.views, 0)}</div>
            <p className="text-xs text-muted-foreground">Product page views</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Rating</CardTitle>
            <Star className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(products.reduce((sum, p) => sum + p.rating, 0) / products.length || 0).toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              {products.reduce((sum, p) => sum + p.reviewCount, 0)} total reviews
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
          <CardDescription>Manage your product catalog</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
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
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sales</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img
                        src={product.images[0] || '/placeholder.svg'}
                        alt={product.name}
                        className="h-10 w-10 rounded object-cover"
                      />
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">{product.description}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">${product.price}</div>
                      <div className="text-sm text-muted-foreground">{product.priceUnit}</div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(product.status)}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{product.sales}</div>
                      <div className="text-sm text-muted-foreground">{product.views} views</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {product.rating > 0 ? (
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                        <span className="text-sm">{product.rating}</span>
                        <span className="text-xs text-muted-foreground">({product.reviewCount})</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">No reviews</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={() => handleEditProduct(product)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(product.id)}
                        className={product.status === 'active' ? 'text-orange-600' : 'text-green-600'}
                      >
                        {product.status === 'active' ? (
                          <Archive className="h-4 w-4" />
                        ) : (
                          <TrendingUp className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteProduct(product.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Product Dialog */}
      <Dialog
        open={showCreateProduct || showEditProduct}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateProduct(false);
            setShowEditProduct(false);
            resetForm();
            setSelectedProduct(null);
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{showEditProduct ? 'Edit Product' : 'Create New Product'}</DialogTitle>
            <DialogDescription>
              {showEditProduct ? 'Update your product information' : 'Add a new product to your catalog'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="product-name">Product Name *</Label>
                    <Input
                      id="product-name"
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter product name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Short Description *</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description for product cards"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="full-description">Full Description *</Label>
                  <Textarea
                    id="full-description"
                    value={formData.fullDescription}
                    onChange={(e) => setFormData((prev) => ({ ...prev, fullDescription: e.target.value }))}
                    placeholder="Detailed product description"
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pricing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price-unit">Price Unit *</Label>
                    <Select
                      value={formData.priceUnit}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, priceUnit: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {priceUnits.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inventory">Inventory</Label>
                    <Input
                      id="inventory"
                      type="number"
                      value={formData.inventory}
                      onChange={(e) => setFormData((prev) => ({ ...prev, inventory: e.target.value }))}
                      placeholder="Available quantity"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Features</CardTitle>
                <CardDescription>Add key features and benefits of your product</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={currentFeature}
                    onChange={(e) => setCurrentFeature(e.target.value)}
                    placeholder="Enter a feature"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddFeature();
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddFeature} disabled={!currentFeature.trim()}>
                    Add
                  </Button>
                </div>
                {formData.features.length > 0 && (
                  <div className="space-y-2">
                    <Label>Added Features</Label>
                    <div className="space-y-2">
                      {formData.features.map((feature, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm">{feature}</span>
                          <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveFeature(feature)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tags</CardTitle>
                <CardDescription>Add keywords to help customers find your product</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    placeholder="Enter a tag"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddTag} disabled={!currentTag.trim()}>
                    Add
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="space-y-2">
                    <Label>Added Tags</Label>
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {tag}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 hover:bg-transparent"
                            onClick={() => handleRemoveTag(tag)}
                          >
                            ×
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Images */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Product Images</CardTitle>
                <CardDescription>Upload images to showcase your product</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">Click to upload images or drag and drop</p>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateProduct(false);
                setShowEditProduct(false);
                resetForm();
                setSelectedProduct(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmitProduct}>{showEditProduct ? 'Update Product' : 'Create Product'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
