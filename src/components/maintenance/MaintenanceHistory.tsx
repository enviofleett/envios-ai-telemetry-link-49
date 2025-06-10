
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Search, FileText, DollarSign, Wrench } from 'lucide-react';
import { useMaintenanceRecords } from '@/hooks/maintenance/useMaintenanceRecords';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import type { MaintenanceRecord } from '@/types/maintenance';

export const MaintenanceHistory: React.FC = () => {
  const { getMaintenanceHistory } = useMaintenanceRecords();
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<MaintenanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await getMaintenanceHistory();
        setRecords(data);
        setFilteredRecords(data);
      } catch (error) {
        console.error('Failed to fetch maintenance history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [getMaintenanceHistory]);

  useEffect(() => {
    let filtered = records;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(record =>
        record.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.maintenance_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.vehicle_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(record => record.status === statusFilter);
    }

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(record => record.maintenance_type === typeFilter);
    }

    setFilteredRecords(filtered);
  }, [records, searchTerm, statusFilter, typeFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateTotalCost = () => {
    return filteredRecords
      .filter(record => record.cost && record.status === 'completed')
      .reduce((total, record) => total + (record.cost || 0), 0);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Maintenance History</CardTitle>
          <CardDescription>Loading maintenance records...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Maintenance History</CardTitle>
        <CardDescription>
          View and manage your vehicle maintenance records
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search maintenance records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="oil_change">Oil Change</SelectItem>
              <SelectItem value="tire_rotation">Tire Rotation</SelectItem>
              <SelectItem value="brake_service">Brake Service</SelectItem>
              <SelectItem value="engine_diagnostic">Engine Diagnostic</SelectItem>
              <SelectItem value="inspection">Inspection</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{filteredRecords.length}</div>
            <div className="text-sm text-muted-foreground">Total Records</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {filteredRecords.filter(r => r.status === 'completed').length}
            </div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              ${calculateTotalCost().toFixed(2)}
            </div>
            <div className="text-sm text-muted-foreground">Total Cost</div>
          </div>
        </div>

        {/* Records List */}
        {filteredRecords.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">No maintenance records found</h3>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
                ? 'Try adjusting your filters' 
                : 'Your maintenance history will appear here'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRecords.map((record) => (
              <div key={record.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getStatusColor(record.status)}>
                        {record.status}
                      </Badge>
                      <Badge className={getPriorityColor(record.priority)}>
                        {record.priority}
                      </Badge>
                      <Badge variant="outline">
                        {record.maintenance_type.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <h3 className="font-semibold mb-1">{record.description}</h3>
                    
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        <span>Performed: {new Date(record.performed_at).toLocaleDateString()}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Wrench className="h-3 w-3" />
                        <span>Vehicle: {record.vehicle_id}</span>
                      </div>
                      
                      {record.mileage && (
                        <div className="flex items-center gap-2">
                          <span>Mileage: {record.mileage.toLocaleString()} miles</span>
                        </div>
                      )}
                      
                      {record.performed_by && (
                        <div className="flex items-center gap-2">
                          <span>Performed by: {record.performed_by}</span>
                        </div>
                      )}
                    </div>
                    
                    {record.parts_used && record.parts_used.length > 0 && (
                      <div className="mt-2">
                        <span className="text-sm font-medium">Parts used: </span>
                        <span className="text-sm text-muted-foreground">
                          {record.parts_used.map((part: any) => part.name || part).join(', ')}
                        </span>
                      </div>
                    )}
                    
                    {record.next_maintenance_date && (
                      <div className="mt-2 text-sm">
                        <span className="font-medium">Next maintenance due: </span>
                        <span className="text-blue-600">
                          {new Date(record.next_maintenance_date).toLocaleDateString()}
                        </span>
                        {record.next_maintenance_mileage && (
                          <span className="text-muted-foreground ml-2">
                            or {record.next_maintenance_mileage.toLocaleString()} miles
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end gap-2 ml-4">
                    {record.cost && (
                      <div className="flex items-center gap-1 text-green-600 font-medium">
                        <DollarSign className="h-4 w-4" />
                        <span>${record.cost}</span>
                      </div>
                    )}
                    
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
