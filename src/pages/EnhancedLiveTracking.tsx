
import React, { useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUnifiedVehicleData } from '@/hooks/useUnifiedVehicleData';
import { useToast } from '@/hooks/use-toast';
import {
  MapPin,
  Search,
  Download,
  RefreshCw,
  Car,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  Fuel,
  Wrench,
  ShoppingCart,
} from 'lucide-react';
import type { EnhancedVehicle, ReportType } from '@/types/enhancedVehicle';
import { convertToEnhancedVehicle } from '@/utils/trackingDataGenerator';
import { VehicleAnalyticsModal } from '@/components/tracking/VehicleAnalyticsModal';
import { ReportGenerationModal } from '@/components/tracking/ReportGenerationModal';

const reportTypes: ReportType[] = [
  {
    id: "parking",
    name: "Parking Report",
    description: "Analyze vehicle parking patterns and locations",
    icon: MapPin,
    color: "bg-blue-100 text-blue-800",
  },
  {
    id: "favorite-places",
    name: "Favorite Places Report",
    description: "Identify most frequently visited locations",
    icon: MapPin,
    color: "bg-green-100 text-green-800",
  },
  {
    id: "engine-work-time",
    name: "Engine Work Time Report",
    description: "Track engine operating hours and efficiency",
    icon: Clock,
    color: "bg-orange-100 text-orange-800",
  },
  {
    id: "vehicle-idling",
    name: "Vehicle Idling Report",
    description: "Monitor excessive idling and fuel waste",
    icon: Clock,
    color: "bg-yellow-100 text-yellow-800",
  },
  {
    id: "alarm",
    name: "Alarm Report",
    description: "Security alerts and alarm history",
    icon: AlertTriangle,
    color: "bg-red-100 text-red-800",
  },
  {
    id: "fuel-consumption",
    name: "Fuel Consumption Report (VIN Analysis)",
    description: "Detailed fuel analysis based on VIN data",
    icon: Fuel,
    color: "bg-purple-100 text-purple-800",
  },
  {
    id: "vehicle-inspection",
    name: "Vehicle Inspection Report",
    description: "Maintenance and inspection status overview",
    icon: Wrench,
    color: "bg-teal-100 text-teal-800",
  },
  {
    id: "marketplace",
    name: "Marketplace Report",
    description: "Service usage and marketplace analytics",
    icon: ShoppingCart,
    color: "bg-indigo-100 text-indigo-800",
  },
];

const EnhancedLiveTracking: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedVehicle, setSelectedVehicle] = useState<EnhancedVehicle | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  const { toast } = useToast();

  const { 
    vehicles: rawVehicles, 
    metrics, 
    isLoading, 
    isRefreshing, 
    forceRefresh 
  } = useUnifiedVehicleData();

  // Convert GPS51 vehicles to enhanced vehicles with additional data
  const enhancedVehicles: EnhancedVehicle[] = useMemo(() => {
    return rawVehicles.map(convertToEnhancedVehicle);
  }, [rawVehicles]);

  const filteredVehicles = enhancedVehicles.filter((vehicle) => {
    const matchesSearch =
      vehicle.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.driver.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || vehicle.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "idle":
        return <Badge className="bg-yellow-100 text-yellow-800">Idle</Badge>;
      case "maintenance":
        return <Badge variant="destructive">Maintenance</Badge>;
      case "offline":
        return <Badge variant="secondary">Offline</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "#22c55e";
      case "idle":
        return "#eab308";
      case "maintenance":
        return "#ef4444";
      case "offline":
        return "#6b7280";
      default:
        return "#6b7280";
    }
  };

  const handleVehicleClick = (vehicle: EnhancedVehicle) => {
    setSelectedVehicle(vehicle);
    setShowAnalytics(true);
  };

  const handleGenerateReport = (reportType: string) => {
    setSelectedReport(reportType);
    setShowReportModal(true);
  };

  const handleRefresh = async () => {
    await forceRefresh();
    toast({
      title: "Data Refreshed",
      description: "Vehicle data has been updated from GP51"
    });
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Loading enhanced vehicle data...</span>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight">Enhanced Live Tracking</h2>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Status Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
                <Car className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{enhancedVehicles.length}</div>
                <p className="text-xs text-muted-foreground">in fleet</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {enhancedVehicles.filter((v) => v.status === "active").length}
                </div>
                <p className="text-xs text-muted-foreground">on the road</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Idle</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {enhancedVehicles.filter((v) => v.status === "idle").length}
                </div>
                <p className="text-xs text-muted-foreground">stationary</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {enhancedVehicles.filter((v) => v.status === "maintenance").length}
                </div>
                <p className="text-xs text-muted-foreground">in service</p>
              </CardContent>
            </Card>
          </div>

          {/* Reports Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Fleet Reports
              </CardTitle>
              <CardDescription>Generate comprehensive reports for fleet analysis and compliance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                {reportTypes.map((report) => {
                  const IconComponent = report.icon;
                  return (
                    <Button
                      key={report.id}
                      variant="outline"
                      className="h-auto p-4 flex flex-col items-start gap-2 hover:bg-muted/50"
                      onClick={() => handleGenerateReport(report.id)}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <div className={`p-2 rounded-lg ${report.color}`}>
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-medium text-sm">{report.name}</div>
                          <div className="text-xs text-muted-foreground mt-1">{report.description}</div>
                        </div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Live Map */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Live Vehicle Map
                </CardTitle>
                <CardDescription>Real-time vehicle locations and status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative h-[400px] bg-muted rounded-lg overflow-hidden">
                  {/* Map placeholder with vehicle markers */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Interactive Map View</p>
                    </div>
                  </div>

                  {/* Vehicle markers */}
                  {enhancedVehicles.slice(0, 8).map((vehicle, index) => (
                    <button
                      key={vehicle.id}
                      onClick={() => handleVehicleClick(vehicle)}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 hover:scale-110 transition-transform"
                      style={{
                        left: `${20 + index * 10}%`,
                        top: `${30 + (index % 3) * 20}%`,
                      }}
                    >
                      <div className="relative">
                        <div
                          className="w-4 h-4 rounded-full border-2 border-white shadow-lg cursor-pointer"
                          style={{ backgroundColor: getStatusColor(vehicle.status) }}
                        />
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity whitespace-nowrap">
                          {vehicle.plateNumber}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Vehicle List */}
            <Card>
              <CardHeader>
                <CardTitle>Vehicle List</CardTitle>
                <CardDescription>Click on any vehicle to view detailed analytics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Search and Filter */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search vehicles..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="idle">Idle</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="offline">Offline</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Vehicle Cards */}
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {filteredVehicles.map((vehicle) => (
                      <div
                        key={vehicle.id}
                        onClick={() => handleVehicleClick(vehicle)}
                        className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: getStatusColor(vehicle.status) }}
                            />
                            <div>
                              <div className="font-medium">{vehicle.plateNumber}</div>
                              <div className="text-sm text-muted-foreground">{vehicle.model}</div>
                            </div>
                          </div>
                          {getStatusBadge(vehicle.status)}
                        </div>
                        <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                          <div>Speed: {vehicle.speed} km/h</div>
                          <div>Fuel: {vehicle.fuel}%</div>
                          <div>Driver: {vehicle.driver}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Vehicle Analytics Modal */}
          <VehicleAnalyticsModal
            vehicle={selectedVehicle}
            isOpen={showAnalytics}
            onClose={() => setShowAnalytics(false)}
          />

          {/* Report Generation Modal */}
          <ReportGenerationModal
            isOpen={showReportModal}
            onClose={() => setShowReportModal(false)}
            selectedReport={selectedReport}
            reportTypes={reportTypes}
            vehicles={enhancedVehicles}
          />
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default EnhancedLiveTracking;
