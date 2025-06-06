import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Car, 
  MapPin, 
  Clock, 
  Search, 
  Download, 
  Send, 
  Wifi, 
  WifiOff, 
  AlertTriangle, 
  Calendar 
} from 'lucide-react';
import { format } from 'date-fns';
import { useUnifiedVehicleData } from '@/hooks/useUnifiedVehicleData';
import { useVehicleDetails } from '@/hooks/useVehicleDetails';
import VehicleDetailsModal from '@/components/vehicles/VehicleDetailsModal';
import TripHistoryModal from '@/components/vehicles/TripHistoryModal';
import AlertModal from '@/components/vehicles/AlertModal';
import type { Vehicle } from '@/services/unifiedVehicleData';

const LiveTracking: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline' | 'alerts'>('all');
  const [selectedVehicle, setSelectedVehicle] = useState('all');
  const [plateNumber, setPlateNumber] = useState('all');
  const [fromDate, setFromDate] = useState<Date>();
  const [toDate, setToDate] = useState<Date>();
  const [showReportTable, setShowReportTable] = useState(false);
  const [selectedVehicleDetails, setSelectedVehicleDetails] = useState<Vehicle | null>(null);
  const [isVehicleDialogOpen, setIsVehicleDialogOpen] = useState(false);

  const { 
    vehicles, 
    metrics, 
    syncMetrics, 
    isLoading, 
    isRefreshing, 
    forceRefresh,
    getVehiclesByStatus 
  } = useUnifiedVehicleData({
    search: searchTerm,
    status: statusFilter
  });

  const {
    selectedVehicle: modalSelectedVehicle,
    isDetailsModalOpen,
    isTripHistoryModalOpen,
    isAlertModalOpen,
    openDetailsModal,
    closeDetailsModal,
    openTripHistoryModal,
    closeTripHistoryModal,
    openAlertModal,
    closeAlertModal,
  } = useVehicleDetails();

  const vehiclesByStatus = getVehiclesByStatus();

  const getVehicleStatus = (vehicle: Vehicle) => {
    if (!vehicle.lastPosition?.updatetime) return 'offline';
    
    const lastUpdate = new Date(vehicle.lastPosition.updatetime);
    const now = new Date();
    const minutesSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
    
    if (minutesSinceUpdate <= 5) return 'online';
    if (minutesSinceUpdate <= 30) return 'idle';
    return 'offline';
  };

  const getStatusBadge = (vehicle: Vehicle) => {
    const status = getVehicleStatus(vehicle);
    const hasAlert = vehicle.status?.toLowerCase().includes('alert') || 
                    vehicle.status?.toLowerCase().includes('alarm');
    
    if (hasAlert) {
      return <Badge variant="destructive" className="flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" />
        Alert
      </Badge>;
    }
    
    return <Badge variant={status === 'online' ? 'default' : 'secondary'} className="flex items-center gap-1">
      <div className={`w-2 h-2 rounded-full ${status === 'online' ? 'bg-green-500' : status === 'idle' ? 'bg-yellow-500' : 'bg-gray-400'}`}></div>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>;
  };

  const getLastUpdateText = (vehicle: Vehicle) => {
    if (!vehicle.lastPosition?.updatetime) return 'Never';
    
    const lastUpdate = new Date(vehicle.lastPosition.updatetime);
    const now = new Date();
    const minutesSinceUpdate = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60));
    
    if (minutesSinceUpdate < 1) return 'Just now';
    if (minutesSinceUpdate === 1) return '1min ago';
    if (minutesSinceUpdate < 60) return `${minutesSinceUpdate}min ago`;
    
    const hours = Math.floor(minutesSinceUpdate / 60);
    if (hours === 1) return '1h ago';
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const handleVehicleClick = (vehicle: Vehicle) => {
    setSelectedVehicleDetails(vehicle);
    setIsVehicleDialogOpen(true);
  };

  const handleTripHistory = (vehicle: Vehicle) => {
    openTripHistoryModal(vehicle);
  };

  const handleSendAlert = (vehicle: Vehicle) => {
    openAlertModal(vehicle);
  };

  const filteredVehicles = vehicles.filter(
    (vehicle) =>
      vehicle.devicename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.deviceid.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-6 p-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Live Tracking</h1>
          <p className="text-gray-600 mt-2">Real-time vehicle location and status monitoring</p>
        </div>
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Live Tracking</h1>
        <p className="text-gray-600 mt-2">Real-time vehicle location and status monitoring</p>
      </div>

      {/* Vehicle Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Online</CardTitle>
            <div className="flex items-center">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
              <Wifi className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{metrics.online}</div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Offline</CardTitle>
            <WifiOff className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{metrics.offline}</div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{metrics.alerts}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Live Map View */}
        <Card className="border-slate-200 lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-slate-900">Live Vehicle Map</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Send className="h-4 w-4 mr-2" />
                  Send Mass Update
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export All
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-500" />
                <Input 
                  placeholder="Search vehicles..." 
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                  <SelectItem value="alerts">Alerts</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-96 bg-slate-100 rounded-lg flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300"></div>
              <div className="relative z-10 text-center">
                <MapPin className="h-12 w-12 text-slate-500 mx-auto mb-2" />
                <p className="text-slate-600">Interactive Map View</p>
                <p className="text-sm text-slate-500">Vehicle locations and real-time tracking</p>
              </div>

              {/* Simulated vehicle markers */}
              <div className="absolute top-20 left-20 z-20">
                <div className="flex items-center justify-center w-8 h-8 bg-green-500 rounded-full text-white text-xs font-bold animate-pulse">
                  🚗
                </div>
              </div>
              <div className="absolute top-32 right-24 z-20">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-500 rounded-full text-white text-xs font-bold">
                  🚛
                </div>
              </div>
              <div className="absolute bottom-20 left-32 z-20">
                <div className="flex items-center justify-center w-8 h-8 bg-red-500 rounded-full text-white text-xs font-bold">
                  🚐
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vehicle List */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-slate-900">Vehicle List</CardTitle>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search vehicles, plates, users..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredVehicles.slice(0, 8).map((vehicle) => (
                <div
                  key={vehicle.deviceid}
                  className="p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => handleVehicleClick(vehicle)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-slate-600" />
                      <span className="font-medium text-slate-900">{vehicle.devicename}</span>
                    </div>
                    {getStatusBadge(vehicle)}
                  </div>
                  <div className="space-y-1 text-sm text-slate-600">
                    <div className="flex items-center justify-between">
                      <span>Speed:</span>
                      <span>{vehicle.lastPosition?.speed || 0} km/h</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Last Update:</span>
                      <span>{getLastUpdateText(vehicle)}</span>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-200">
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTripHistory(vehicle);
                        }}
                      >
                        Trip History
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSendAlert(vehicle);
                        }}
                      >
                        Send Alert
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {filteredVehicles.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <Car className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No vehicles found matching your search</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports Hub */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-900">Reports Hub</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="trips" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="trips">Trip Reports</TabsTrigger>
              <TabsTrigger value="geofence">Geofence</TabsTrigger>
              <TabsTrigger value="mileage">Mileage</TabsTrigger>
              <TabsTrigger value="places">Favorite Places</TabsTrigger>
            </TabsList>

            <TabsContent value="trips" className="space-y-4">
              <div className="flex flex-wrap items-center gap-4">
                <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select Vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Vehicles</SelectItem>
                    {vehicles.slice(0, 5).map((vehicle) => (
                      <SelectItem key={vehicle.deviceid} value={vehicle.deviceid}>
                        {vehicle.devicename}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                        <Calendar className="mr-2 h-4 w-4" />
                        {fromDate ? format(fromDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent mode="single" selected={fromDate} onSelect={setFromDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>

                <Button variant="outline" onClick={() => setShowReportTable(true)}>
                  <Search className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>

                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>

              {showReportTable && (
                <Card className="mt-4 border-slate-200">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-slate-900">Trip Report</CardTitle>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download CSV
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Vehicle</TableHead>
                          <TableHead>Start Time</TableHead>
                          <TableHead>End Time</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Distance</TableHead>
                          <TableHead>Avg. Speed</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>2025-06-06</TableCell>
                          <TableCell>{vehicles[0]?.devicename || 'Vehicle 1'}</TableCell>
                          <TableCell>08:15 AM</TableCell>
                          <TableCell>09:45 AM</TableCell>
                          <TableCell>1h 30m</TableCell>
                          <TableCell>45.2 km</TableCell>
                          <TableCell>30.1 km/h</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>2025-06-06</TableCell>
                          <TableCell>{vehicles[1]?.devicename || 'Vehicle 2'}</TableCell>
                          <TableCell>10:30 AM</TableCell>
                          <TableCell>11:15 AM</TableCell>
                          <TableCell>0h 45m</TableCell>
                          <TableCell>22.8 km</TableCell>
                          <TableCell>30.4 km/h</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="geofence" className="space-y-4">
              <div className="flex flex-wrap items-center gap-4">
                <Select value={plateNumber} onValueChange={setPlateNumber}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select Vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Vehicles</SelectItem>
                    {vehicles.slice(0, 5).map((vehicle) => (
                      <SelectItem key={vehicle.deviceid} value={vehicle.deviceid}>
                        {vehicle.devicename}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button variant="outline" onClick={() => setShowReportTable(true)}>
                  <Search className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>

                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>

              {showReportTable && (
                <Card className="mt-4 border-slate-200">
                  <CardHeader>
                    <CardTitle className="text-slate-900">Geofence Report</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Vehicle</TableHead>
                          <TableHead>Geofence</TableHead>
                          <TableHead>Event Type</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>2025-06-06</TableCell>
                          <TableCell>{vehicles[0]?.devicename || 'Vehicle 1'}</TableCell>
                          <TableCell>Downtown Zone</TableCell>
                          <TableCell>Exit</TableCell>
                          <TableCell>10:30 AM</TableCell>
                          <TableCell>
                            <Badge variant="destructive">Violation</Badge>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="mileage" className="space-y-4">
              <div className="flex flex-wrap items-center gap-4">
                <Select value={plateNumber} onValueChange={setPlateNumber}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select Vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Vehicles</SelectItem>
                    {vehicles.slice(0, 5).map((vehicle) => (
                      <SelectItem key={vehicle.deviceid} value={vehicle.deviceid}>
                        {vehicle.devicename}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button variant="outline" onClick={() => setShowReportTable(true)}>
                  <Search className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>

                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>

              {showReportTable && (
                <Card className="mt-4 border-slate-200">
                  <CardHeader>
                    <CardTitle className="text-slate-900">Mileage Report</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Vehicle</TableHead>
                          <TableHead>Distance</TableHead>
                          <TableHead>Fuel Efficiency</TableHead>
                          <TableHead>Cost</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>2025-06-06</TableCell>
                          <TableCell>{vehicles[0]?.devicename || 'Vehicle 1'}</TableCell>
                          <TableCell>146.5 km</TableCell>
                          <TableCell>11.4 km/L</TableCell>
                          <TableCell>$18.50</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="places" className="space-y-4">
              <div className="flex flex-wrap items-center gap-4">
                <Select value={plateNumber} onValueChange={setPlateNumber}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select Vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Vehicles</SelectItem>
                    {vehicles.slice(0, 5).map((vehicle) => (
                      <SelectItem key={vehicle.deviceid} value={vehicle.deviceid}>
                        {vehicle.devicename}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button variant="outline" onClick={() => setShowReportTable(true)}>
                  <Search className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>

                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>

              {showReportTable && (
                <Card className="mt-4 border-slate-200">
                  <CardHeader>
                    <CardTitle className="text-slate-900">Favorite Places Report</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Vehicle</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Visit Count</TableHead>
                          <TableHead>Duration</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>2025-06-06</TableCell>
                          <TableCell>{vehicles[0]?.devicename || 'Vehicle 1'}</TableCell>
                          <TableCell>Main Office</TableCell>
                          <TableCell>8</TableCell>
                          <TableCell>6h 30m</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Enhanced Vehicle Details Dialog */}
      <Dialog open={isVehicleDialogOpen} onOpenChange={setIsVehicleDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Vehicle Details - {selectedVehicleDetails?.devicename}
            </DialogTitle>
            <DialogDescription>Complete vehicle information and status overview</DialogDescription>
          </DialogHeader>

          {selectedVehicleDetails && (
            <div className="grid gap-6">
              {/* Basic Info */}
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-slate-600">Vehicle ID</Label>
                    <p className="text-slate-900">{selectedVehicleDetails.deviceid}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-600">Vehicle Name</Label>
                    <p className="text-slate-900">{selectedVehicleDetails.devicename}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-600">Current Status</Label>
                    {getStatusBadge(selectedVehicleDetails)}
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-600">Current Speed</Label>
                    <p className="text-slate-900">{selectedVehicleDetails.lastPosition?.speed || 0} km/h</p>
                  </div>
                  {selectedVehicleDetails.lastPosition && (
                    <>
                      <div>
                        <Label className="text-sm font-medium text-slate-600">Location</Label>
                        <p className="text-slate-900 font-mono text-sm">
                          {selectedVehicleDetails.lastPosition.lat.toFixed(6)}, {selectedVehicleDetails.lastPosition.lon.toFixed(6)}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-slate-600">Last Update</Label>
                        <p className="text-slate-900">{getLastUpdateText(selectedVehicleDetails)}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsVehicleDialogOpen(false)}>
                  Close
                </Button>
                <Button className="bg-slate-900 hover:bg-slate-800">Edit Vehicle</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Existing Modals */}
      <VehicleDetailsModal
        vehicle={modalSelectedVehicle}
        isOpen={isDetailsModalOpen}
        onClose={closeDetailsModal}
        onViewHistory={openTripHistoryModal}
        onSendAlert={openAlertModal}
      />

      <TripHistoryModal
        vehicle={modalSelectedVehicle}
        isOpen={isTripHistoryModalOpen}
        onClose={closeTripHistoryModal}
      />

      <AlertModal
        vehicle={modalSelectedVehicle}
        isOpen={isAlertModalOpen}
        onClose={closeAlertModal}
      />
    </div>
  );
};

export default LiveTracking;
