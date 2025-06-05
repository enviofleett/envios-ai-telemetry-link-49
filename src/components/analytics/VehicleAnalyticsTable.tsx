
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ArrowUpDown } from 'lucide-react';
import { VehicleAnalytics } from '@/hooks/useFleetAnalytics';

interface VehicleAnalyticsTableProps {
  vehicleAnalytics: VehicleAnalytics[];
  isLoading?: boolean;
}

type SortField = 'deviceName' | 'utilizationRate' | 'fuelEfficiency' | 'maintenanceScore' | 'driverScore' | 'alerts';
type SortDirection = 'asc' | 'desc';

const VehicleAnalyticsTable: React.FC<VehicleAnalyticsTableProps> = ({ vehicleAnalytics, isLoading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('utilizationRate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filterAlerts, setFilterAlerts] = useState<string>('all');

  // Filter and sort data
  const filteredAndSortedData = React.useMemo(() => {
    let filtered = vehicleAnalytics.filter(vehicle =>
      vehicle.deviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.deviceId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Filter by alerts
    if (filterAlerts !== 'all') {
      if (filterAlerts === 'with-alerts') {
        filtered = filtered.filter(vehicle => vehicle.alerts > 0);
      } else if (filterAlerts === 'no-alerts') {
        filtered = filtered.filter(vehicle => vehicle.alerts === 0);
      }
    }

    // Sort data
    filtered.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal as string).toLowerCase();
      }
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [vehicleAnalytics, searchTerm, sortField, sortDirection, filterAlerts]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getPerformanceBadge = (score: number, type: 'utilization' | 'fuel' | 'maintenance' | 'driver') => {
    let variant: 'default' | 'secondary' | 'destructive' = 'default';
    let threshold1, threshold2;
    
    switch (type) {
      case 'utilization':
        threshold1 = 80;
        threshold2 = 60;
        break;
      case 'fuel':
        threshold1 = 8.5;
        threshold2 = 7.5;
        break;
      case 'maintenance':
      case 'driver':
        threshold1 = 90;
        threshold2 = 75;
        break;
    }
    
    if (score >= threshold1) variant = 'default'; // Green/Blue
    else if (score >= threshold2) variant = 'secondary'; // Yellow
    else variant = 'destructive'; // Red

    return <Badge variant={variant}>{score.toFixed(1)}{type === 'fuel' ? ' km/l' : '%'}</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle className="text-lg font-semibold">Vehicle Analytics</CardTitle>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search vehicles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>
            <Select value={filterAlerts} onValueChange={setFilterAlerts}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vehicles</SelectItem>
                <SelectItem value="with-alerts">With Alerts</SelectItem>
                <SelectItem value="no-alerts">No Alerts</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3">
                  <Button variant="ghost" onClick={() => handleSort('deviceName')} className="h-auto p-0 font-semibold">
                    Vehicle <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </th>
                <th className="text-center p-3">
                  <Button variant="ghost" onClick={() => handleSort('utilizationRate')} className="h-auto p-0 font-semibold">
                    Utilization <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </th>
                <th className="text-center p-3">
                  <Button variant="ghost" onClick={() => handleSort('fuelEfficiency')} className="h-auto p-0 font-semibold">
                    Fuel Efficiency <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </th>
                <th className="text-center p-3">
                  <Button variant="ghost" onClick={() => handleSort('maintenanceScore')} className="h-auto p-0 font-semibold">
                    Maintenance <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </th>
                <th className="text-center p-3">
                  <Button variant="ghost" onClick={() => handleSort('driverScore')} className="h-auto p-0 font-semibold">
                    Driver Score <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </th>
                <th className="text-center p-3">
                  <Button variant="ghost" onClick={() => handleSort('alerts')} className="h-auto p-0 font-semibold">
                    Alerts <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </th>
                <th className="text-left p-3 font-semibold">Last Update</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedData.map((vehicle) => (
                <tr key={vehicle.deviceId} className="border-b hover:bg-gray-50">
                  <td className="p-3">
                    <div>
                      <div className="font-medium">{vehicle.deviceName}</div>
                      <div className="text-sm text-gray-500">{vehicle.deviceId}</div>
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    {getPerformanceBadge(vehicle.utilizationRate, 'utilization')}
                  </td>
                  <td className="p-3 text-center">
                    {getPerformanceBadge(vehicle.fuelEfficiency, 'fuel')}
                  </td>
                  <td className="p-3 text-center">
                    {getPerformanceBadge(vehicle.maintenanceScore, 'maintenance')}
                  </td>
                  <td className="p-3 text-center">
                    {getPerformanceBadge(vehicle.driverScore, 'driver')}
                  </td>
                  <td className="p-3 text-center">
                    {vehicle.alerts > 0 ? (
                      <Badge variant="destructive">{vehicle.alerts}</Badge>
                    ) : (
                      <Badge variant="secondary">0</Badge>
                    )}
                  </td>
                  <td className="p-3 text-sm text-gray-600">
                    {new Date(vehicle.lastUpdate).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredAndSortedData.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No vehicles found matching your criteria.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default VehicleAnalyticsTable;
