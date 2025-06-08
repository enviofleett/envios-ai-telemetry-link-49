
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Users, UserPlus, Mail, Phone, MapPin, Package, Search, Download, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  username: string;
  subscriptionPackage: string;
  registrationSource: 'admin' | 'mobile' | 'web';
  status: 'pending_otp' | 'pending_password' | 'active' | 'suspended';
  createdAt: string;
  lastLogin?: string;
  registeredBy?: string;
}

interface SubscriptionPackage {
  id: string;
  name: string;
  price: number;
  features: string[];
  duration: string;
}

const subscriptionPackages: SubscriptionPackage[] = [
  {
    id: 'basic',
    name: 'Basic Fleet',
    price: 15000,
    features: ['Up to 5 vehicles', 'Basic tracking', 'Monthly reports'],
    duration: 'Monthly',
  },
  {
    id: 'standard',
    name: 'Standard Fleet',
    price: 25000,
    features: ['Up to 15 vehicles', 'Real-time tracking', 'Advanced analytics', 'Maintenance alerts'],
    duration: 'Monthly',
  },
  {
    id: 'premium',
    name: 'Premium Fleet',
    price: 45000,
    features: ['Unlimited vehicles', 'All features', 'Priority support', 'Custom integrations'],
    duration: 'Monthly',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 75000,
    features: ['Unlimited everything', 'Dedicated support', 'Custom development', 'SLA guarantee'],
    duration: 'Monthly',
  },
];

// Mock data for demonstration
const mockUsers: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@email.com',
    phone: '+234-801-234-5678',
    city: 'Lagos',
    username: 'johndoe_7834',
    subscriptionPackage: 'standard',
    registrationSource: 'admin',
    status: 'active',
    createdAt: '2024-01-15T10:30:00Z',
    lastLogin: '2024-01-20T14:22:00Z',
    registeredBy: 'Admin User',
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah.j@email.com',
    phone: '+234-802-345-6789',
    city: 'Abuja',
    username: 'sarahjohnson_2156',
    subscriptionPackage: 'premium',
    registrationSource: 'web',
    status: 'pending_otp',
    createdAt: '2024-01-18T09:15:00Z',
  },
  {
    id: '3',
    name: 'Michael Brown',
    email: 'mike.brown@email.com',
    phone: '+234-803-456-7890',
    city: 'Port Harcourt',
    username: 'michaelbrown_9432',
    subscriptionPackage: 'basic',
    registrationSource: 'mobile',
    status: 'pending_password',
    createdAt: '2024-01-19T16:45:00Z',
  },
  {
    id: '4',
    name: 'Emma Wilson',
    email: 'emma.wilson@email.com',
    phone: '+234-804-567-8901',
    city: 'Kano',
    username: 'emmawilson_5678',
    subscriptionPackage: 'enterprise',
    registrationSource: 'admin',
    status: 'active',
    createdAt: '2024-01-16T11:20:00Z',
    lastLogin: '2024-01-21T08:30:00Z',
    registeredBy: 'Admin User',
  },
];

const EnhancedUserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [filteredUsers, setFilteredUsers] = useState<User[]>(mockUsers);
  const [isRegistering, setIsRegistering] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const { toast } = useToast();

  // Registration form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    subscriptionPackage: '',
  });

  // Statistics
  const stats = {
    total: users.length,
    active: users.filter((u) => u.status === 'active').length,
    pendingOtp: users.filter((u) => u.status === 'pending_otp').length,
    pendingPassword: users.filter((u) => u.status === 'pending_password').length,
    suspended: users.filter((u) => u.status === 'suspended').length,
    adminRegistered: users.filter((u) => u.registrationSource === 'admin').length,
    selfRegistered: users.filter((u) => u.registrationSource !== 'admin').length,
  };

  // Generate username
  const generateUsername = (name: string): string => {
    const cleanName = name
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[^a-z]/g, '');
    const randomNum = Math.floor(Math.random() * 9000) + 1000;
    return `${cleanName}_${randomNum}`;
  };

  // Handle user registration
  const handleRegisterUser = async () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.city || !formData.subscriptionPackage) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setIsRegistering(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const username = generateUsername(formData.name);
      const newUser: User = {
        id: Date.now().toString(),
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        city: formData.city,
        username,
        subscriptionPackage: formData.subscriptionPackage,
        registrationSource: 'admin',
        status: 'pending_otp',
        createdAt: new Date().toISOString(),
        registeredBy: 'Admin User',
      };

      setUsers((prev) => [newUser, ...prev]);
      setFilteredUsers((prev) => [newUser, ...prev]);

      toast({
        title: 'User Registered Successfully',
        description: `OTP sent to ${formData.email}. Username: ${username}`,
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        city: '',
        subscriptionPackage: '',
      });
      setShowRegisterDialog(false);
    } catch (error) {
      toast({
        title: 'Registration Failed',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsRegistering(false);
    }
  };

  // Filter users
  useEffect(() => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.phone.includes(searchTerm)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((user) => user.status === statusFilter);
    }

    if (sourceFilter !== 'all') {
      filtered = filtered.filter((user) => user.registrationSource === sourceFilter);
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, statusFilter, sourceFilter]);

  // Resend OTP
  const handleResendOTP = async (userId: string) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast({
        title: 'OTP Resent',
        description: "New OTP has been sent to user's email",
      });
    } catch (error) {
      toast({
        title: 'Failed to Resend OTP',
        description: 'Please try again later',
        variant: 'destructive',
      });
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Active', variant: 'default' as const },
      pending_otp: { label: 'Pending OTP', variant: 'secondary' as const },
      pending_password: { label: 'Pending Password', variant: 'outline' as const },
      suspended: { label: 'Suspended', variant: 'destructive' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Get source badge
  const getSourceBadge = (source: string) => {
    const sourceConfig = {
      admin: { label: 'Admin', variant: 'default' as const },
      web: { label: 'Web', variant: 'secondary' as const },
      mobile: { label: 'Mobile', variant: 'outline' as const },
    };

    const config = sourceConfig[source as keyof typeof sourceConfig];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">User Directory</h2>
          <p className="text-muted-foreground">Manage user registrations and subscriptions</p>
        </div>
        <Dialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Register New User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Register New User</DialogTitle>
              <DialogDescription>Create a new user account. An OTP will be sent for verification.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="+234-XXX-XXX-XXXX"
                />
              </div>
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                  placeholder="Enter city"
                />
              </div>
              <div>
                <Label htmlFor="package">Subscription Package *</Label>
                <Select
                  value={formData.subscriptionPackage}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, subscriptionPackage: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select package" />
                  </SelectTrigger>
                  <SelectContent>
                    {subscriptionPackages.map((pkg) => (
                      <SelectItem key={pkg.id} value={pkg.id}>
                        {pkg.name} - ₦{pkg.price.toLocaleString()}/{pkg.duration}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleRegisterUser} disabled={isRegistering} className="w-full">
                {isRegistering ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Registering...
                  </>
                ) : (
                  'Register User'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">{stats.adminRegistered} admin registered</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <div className="h-2 w-2 bg-green-500 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">{((stats.active / stats.total) * 100).toFixed(1)}% of total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending OTP</CardTitle>
            <div className="h-2 w-2 bg-yellow-500 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingOtp}</div>
            <p className="text-xs text-muted-foreground">Awaiting verification</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Password</CardTitle>
            <div className="h-2 w-2 bg-blue-500 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingPassword}</div>
            <p className="text-xs text-muted-foreground">Need to set password</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>User Directory</CardTitle>
          <CardDescription>View and manage all registered users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users by name, email, username, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending_otp">Pending OTP</SelectItem>
                <SelectItem value="pending_password">Pending Password</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="admin">Admin Registered</SelectItem>
                <SelectItem value="web">Web Registration</SelectItem>
                <SelectItem value="mobile">Mobile Registration</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
          </div>

          {/* Users Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User Details</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Registration Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">@{user.username}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <Mail className="h-3 w-3 mr-1" />
                          {user.email}
                        </div>
                        <div className="flex items-center text-sm">
                          <Phone className="h-3 w-3 mr-1" />
                          {user.phone}
                        </div>
                        <div className="flex items-center text-sm">
                          <MapPin className="h-3 w-3 mr-1" />
                          {user.city}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Package className="h-4 w-4 mr-2" />
                        {subscriptionPackages.find((p) => p.id === user.subscriptionPackage)?.name || 'Unknown'}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                    <TableCell>{getSourceBadge(user.registrationSource)}</TableCell>
                    <TableCell>
                      <div className="text-sm">{new Date(user.createdAt).toLocaleDateString()}</div>
                      {user.registeredBy && <div className="text-xs text-muted-foreground">by {user.registeredBy}</div>}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {user.status === 'pending_otp' && (
                          <Button size="sm" variant="outline" onClick={() => handleResendOTP(user.id)}>
                            Resend OTP
                          </Button>
                        )}
                        <Button size="sm" variant="ghost">
                          View Details
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No users found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' || sourceFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Start by registering your first user'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Registration Flow Info */}
      <Card>
        <CardHeader>
          <CardTitle>Registration Process</CardTitle>
          <CardDescription>How the user registration and authentication flow works</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                1
              </div>
              <h4 className="font-medium mb-2">Admin Registration</h4>
              <p className="text-sm text-muted-foreground">
                Admin creates user account with basic details and subscription package
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="w-8 h-8 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-2">
                2
              </div>
              <h4 className="font-medium mb-2">OTP Verification</h4>
              <p className="text-sm text-muted-foreground">System sends OTP to user's email for account verification</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                3
              </div>
              <h4 className="font-medium mb-2">Password Setup</h4>
              <p className="text-sm text-muted-foreground">
                User creates password after OTP verification and gains full access
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedUserManagement;
