
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Search, Filter } from 'lucide-react';

const AdminMerchantManagement: React.FC = () => {
  // Mock merchant data
  const merchants = [
    {
      id: '1',
      name: 'AutoCare Workshop',
      email: 'contact@autocare.com',
      status: 'active',
      registeredDate: '2024-01-15',
      totalBookings: 156
    },
    {
      id: '2',
      name: 'QuickFix Garage',
      email: 'info@quickfix.com',
      status: 'pending',
      registeredDate: '2024-03-20',
      totalBookings: 0
    },
    {
      id: '3',
      name: 'Elite Motors',
      email: 'admin@elitemotors.com',
      status: 'active',
      registeredDate: '2024-02-10',
      totalBookings: 89
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Merchant Management</h2>
          <p className="text-muted-foreground">
            Manage workshop merchants and their accounts
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Merchant
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search merchants..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      <div className="grid gap-4">
        {merchants.map((merchant) => (
          <Card key={merchant.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{merchant.name}</h3>
                    <p className="text-gray-600">{merchant.email}</p>
                    <p className="text-sm text-gray-500">
                      Registered: {new Date(merchant.registeredDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Total Bookings</div>
                    <div className="font-semibold">{merchant.totalBookings}</div>
                  </div>
                  <Badge className={getStatusColor(merchant.status)}>
                    {merchant.status}
                  </Badge>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Merchant Statistics</CardTitle>
          <CardDescription>
            Overview of merchant activity and performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">3</div>
              <div className="text-sm text-gray-600">Active Merchants</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">1</div>
              <div className="text-sm text-gray-600">Pending Approval</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">245</div>
              <div className="text-sm text-gray-600">Total Bookings</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminMerchantManagement;
