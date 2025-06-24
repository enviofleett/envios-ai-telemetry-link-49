
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useImportPreviewData } from '@/hooks/useImportPreviewData';
import DataPreviewModal from './DataPreviewModal';
import ConflictIndicator from './ConflictIndicator';
import { Search, Eye, MapPin, Clock, AlertTriangle } from 'lucide-react';

const ImportDataTable: React.FC = () => {
  const { previewData, isLoading, error } = useImportPreviewData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Handle error state
  if (error) {
    console.error('ImportDataTable error:', error);
    return (
      <Card>
        <CardHeader>
          <CardTitle>Import Data Review</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Failed to load import data: {error instanceof Error ? error.message : 'Unknown error'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Safe filtering with null checks
  const filteredData = previewData?.filter(record => {
    if (!record) return false;
    
    try {
      const vehicleData = Array.isArray(record.raw_vehicle_data) ? record.raw_vehicle_data : [];
      const username = record.gp51_username || '';
      
      const matchesSearch = username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           vehicleData.some((vehicle: any) => 
                             vehicle?.deviceid?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             vehicle?.devicename?.toLowerCase().includes(searchTerm.toLowerCase())
                           );
      
      const matchesStatus = statusFilter === 'all' || record.review_status === statusFilter;
      
      return matchesSearch && matchesStatus;
    } catch (err) {
      console.warn('Error filtering record:', record.id, err);
      return false;
    }
  }) || [];

  const getStatusBadge = (status: string, eligibility: string) => {
    if (eligibility === 'conflict') {
      return <Badge variant="destructive">Conflict</Badge>;
    }
    
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending Review</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Import Data Review</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
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
        <CardTitle>Import Data Review</CardTitle>
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by username, device ID, or name..."
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
              <SelectItem value="all">All Records</SelectItem>
              <SelectItem value="pending">Pending Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {previewData?.length === 0 
                ? "No import data available. Please fetch data from GP51 first."
                : "No import data found matching your criteria."
              }
            </div>
          ) : (
            filteredData.map((record) => {
              if (!record) return null;
              
              try {
                const vehicleData = Array.isArray(record.raw_vehicle_data) ? record.raw_vehicle_data : [];
                const conflictFlags = Array.isArray(record.conflict_flags) ? record.conflict_flags : [];

                return (
                  <div key={record.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="font-medium">{record.gp51_username || 'Unknown User'}</div>
                        {getStatusBadge(record.review_status, record.import_eligibility)}
                        <ConflictIndicator conflicts={conflictFlags} />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedRecord(record)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                      {vehicleData.slice(0, 3).map((vehicle: any, index) => (
                        <div key={index} className="border rounded p-3 space-y-2">
                          <div className="font-medium">{vehicle?.devicename || vehicle?.deviceid || 'Unknown Device'}</div>
                          <div className="text-muted-foreground">ID: {vehicle?.deviceid || 'N/A'}</div>
                          
                          {vehicle?.lastactivetime && (
                            <div className="flex items-center gap-1 text-xs">
                              <Clock className="h-3 w-3" />
                              {new Date(vehicle.lastactivetime * 1000).toLocaleDateString()}
                            </div>
                          )}
                          
                          {vehicle?.callat && vehicle?.callon && (
                            <div className="flex items-center gap-1 text-xs">
                              <MapPin className="h-3 w-3" />
                              {vehicle.callat.toFixed(4)}, {vehicle.callon.toFixed(4)}
                            </div>
                          )}
                          
                          <Badge variant="outline" className="text-xs">
                            Status: {vehicle?.status || 'Unknown'}
                          </Badge>
                        </div>
                      ))}
                      
                      {vehicleData.length > 3 && (
                        <div className="border rounded p-3 flex items-center justify-center text-muted-foreground">
                          +{vehicleData.length - 3} more vehicles
                        </div>
                      )}
                    </div>
                  </div>
                );
              } catch (err) {
                console.warn('Error rendering record:', record.id, err);
                return (
                  <div key={record.id} className="border rounded-lg p-4 bg-red-50">
                    <div className="text-red-600 text-sm">
                      Error displaying record {record.id}
                    </div>
                  </div>
                );
              }
            })
          )}
        </div>
      </CardContent>
      
      {selectedRecord && (
        <DataPreviewModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      )}
    </Card>
  );
};

export default ImportDataTable;
