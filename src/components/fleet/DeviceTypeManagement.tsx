
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, RefreshCw, DollarSign, Settings, Cpu } from 'lucide-react';
import { enhancedDeviceApi } from '@/services/enhancedDeviceManagementApi';
import { useToast } from '@/hooks/use-toast';
import { DeviceType } from '@/types/device-management';

const DeviceTypeManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: deviceTypes, isLoading } = useQuery({
    queryKey: ['device-types'],
    queryFn: () => enhancedDeviceApi.getDeviceTypes(),
  });

  const syncMutation = useMutation({
    mutationFn: () => enhancedDeviceApi.syncDeviceTypes(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device-types'] });
      toast({ title: 'Device types synced successfully' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Sync failed', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  const filteredDeviceTypes = deviceTypes?.filter(type =>
    type.type_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    type.type_code?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const DeviceTypeCard = ({ deviceType }: { deviceType: DeviceType }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{deviceType.type_name}</CardTitle>
            {deviceType.type_code && (
              <div className="text-sm text-gray-500">Code: {deviceType.type_code}</div>
            )}
          </div>
          <Badge variant={deviceType.is_active ? 'default' : 'secondary'}>
            {deviceType.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Features */}
        <div className="flex items-center gap-2 text-sm">
          <Cpu className="h-4 w-4 text-blue-600" />
          <span>Functions: {deviceType.functions || 'N/A'}</span>
          {deviceType.functions_long && (
            <span className="text-gray-500">({deviceType.functions_long})</span>
          )}
        </div>

        {/* Configuration */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Settings className="h-4 w-4" />
          <span>
            ID Length: {deviceType.default_id_length || 'Auto'} | 
            Offline Delay: {deviceType.default_offline_delay || 'Default'}min
          </span>
        </div>

        {/* Pricing */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <DollarSign className="h-4 w-4 text-green-600" />
            Pricing Plans
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {deviceType.price_1_year && (
              <div>1 Year: ${deviceType.price_1_year}</div>
            )}
            {deviceType.price_3_year && (
              <div>3 Years: ${deviceType.price_3_year}</div>
            )}
            {deviceType.price_5_year && (
              <div>5 Years: ${deviceType.price_5_year}</div>
            )}
            {deviceType.price_10_year && (
              <div>10 Years: ${deviceType.price_10_year}</div>
            )}
          </div>
        </div>

        {/* Description */}
        {(deviceType.remark || deviceType.remark_en) && (
          <div className="text-sm text-gray-600 border-t pt-3">
            {deviceType.remark_en || deviceType.remark}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Device Type Management</h2>
          <p className="text-gray-600 mt-1">Manage and monitor available GP51 device types</p>
        </div>
        <Button 
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          {syncMutation.isPending ? 'Syncing...' : 'Sync Device Types'}
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search device types..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Content */}
      <Tabs defaultValue="grid" className="space-y-4">
        <TabsList>
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="grid">
          {isLoading ? (
            <div className="text-center py-12">Loading device types...</div>
          ) : filteredDeviceTypes.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                {searchTerm ? 'No device types found matching your search.' : 'No device types available.'}
              </div>
              {!searchTerm && (
                <Button onClick={() => syncMutation.mutate()}>
                  Sync Device Types
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredDeviceTypes.map((deviceType) => (
                <DeviceTypeCard key={deviceType.id} deviceType={deviceType} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="comparison">
          <Card>
            <CardHeader>
              <CardTitle>Device Type Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Device Type</th>
                      <th className="text-left p-2">Functions</th>
                      <th className="text-left p-2">1 Year Price</th>
                      <th className="text-left p-2">3 Year Price</th>
                      <th className="text-left p-2">5 Year Price</th>
                      <th className="text-left p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDeviceTypes.map((type) => (
                      <tr key={type.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          <div>
                            <div className="font-medium">{type.type_name}</div>
                            {type.type_code && (
                              <div className="text-gray-500 text-xs">{type.type_code}</div>
                            )}
                          </div>
                        </td>
                        <td className="p-2">{type.functions || 'N/A'}</td>
                        <td className="p-2">${type.price_1_year || 'N/A'}</td>
                        <td className="p-2">${type.price_3_year || 'N/A'}</td>
                        <td className="p-2">${type.price_5_year || 'N/A'}</td>
                        <td className="p-2">
                          <Badge variant={type.is_active ? 'default' : 'secondary'}>
                            {type.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DeviceTypeManagement;
