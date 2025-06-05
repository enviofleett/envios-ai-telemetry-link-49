
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Search, ArrowUpDown } from 'lucide-react';
import type { VehicleAnalytics } from '@/services/analytics/analyticsService';

interface VehicleAnalyticsTableProps {
  vehicleAnalytics: VehicleAnalytics[];
  isLoading: boolean;
}

const VehicleAnalyticsTable: React.FC<VehicleAnalyticsTableProps> = ({ 
  vehicleAnalytics, 
  isLoading 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof VehicleAnalytics>('performanceRating');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: keyof VehicleAnalytics) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getPerformanceBadge = (rating: number) => {
    if (rating >= 80) return <Badge variant="default">Excellent</Badge>;
    if (rating >= 60) return <Badge variant="secondary">Good</Badge>;
    return <Badge variant="destructive">Needs Attention</Badge>;
  };

  const getUtilizationBadge = (rate: number) => {
    if (rate >= 0.8) return <Badge variant="default">High</Badge>;
    if (rate >= 0.6) return <Badge variant="secondary">Medium</Badge>;
    return <Badge variant="outline">Low</Badge>;
  };

  const filteredAndSortedData = vehicleAnalytics
    .filter(vehicle => 
      vehicle.deviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.deviceId.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      const aStr = String(aValue);
      const bStr = String(bValue);
      return sortDirection === 'asc' 
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vehicle Performance Analytics</CardTitle>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search vehicles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle</TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('performanceRating')}
                    className="flex items-center gap-1"
                  >
                    Performance
                    <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('utilizationRate')}
                    className="flex items-center gap-1"
                  >
                    Utilization
                    <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('fuelEfficiency')}
                    className="flex items-center gap-1"
                  >
                    Fuel Efficiency
                    <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('totalDistance')}
                    className="flex items-center gap-1"
                  >
                    Distance
                    <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('alertsCount')}
                    className="flex items-center gap-1"
                  >
                    Alerts
                    <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedData.map((vehicle) => (
                <TableRow key={vehicle.deviceId}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{vehicle.deviceName}</div>
                      <div className="text-sm text-gray-500">{vehicle.deviceId}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{vehicle.performanceRating.toFixed(1)}%</span>
                      {getPerformanceBadge(vehicle.performanceRating)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{(vehicle.utilizationRate * 100).toFixed(1)}%</span>
                      {getUtilizationBadge(vehicle.utilizationRate)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{vehicle.fuelEfficiency.toFixed(1)}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{vehicle.totalDistance.toFixed(0)} km</span>
                  </TableCell>
                  <TableCell>
                    {vehicle.alertsCount > 0 ? (
                      <Badge variant="destructive">{vehicle.alertsCount}</Badge>
                    ) : (
                      <span className="text-gray-400">None</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      new Date(vehicle.lastActiveDate) > new Date(Date.now() - 30 * 60 * 1000) 
                        ? "default" 
                        : "secondary"
                    }>
                      {new Date(vehicle.lastActiveDate) > new Date(Date.now() - 30 * 60 * 1000) 
                        ? "Online" 
                        : "Offline"
                      }
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default VehicleAnalyticsTable;
