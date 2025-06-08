
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { SecureVehicleService, SecureVehicleCreationRequest } from '@/services/secureVehicleService';
import { gp51ServiceApi } from '@/services/gp51ServiceManagementApi';
import { getVehicles } from '@/lib/vehicleRegistrationActions';
import { useQuery } from '@tanstack/react-query';
import {
  Car,
  Plus,
  Search,
  Download,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertTriangle,
  Clock,
  Settings,
  Eye,
  Edit,
} from 'lucide-react';

interface UserType {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  status: 'active' | 'inactive';
  registrationSource: 'admin' | 'web' | 'mobile';
}

interface SubscriptionPackage {
  id: string;
  name: string;
  type: 'Basic' | 'Premium' | 'Enterprise';
  monthlyFee: number;
  features: string[];
  description: string;
}

interface GPSType {
  id: string;
  name: string;
  manufacturer: string;
  model: string;
  deviceType: number; // GP51 device type
  configurationCode: string;
  description: string;
}

interface NetworkProvider {
  id: string;
  name: string;
  country: string;
  apnSettings: string;
}

const mockUsers: UserType[] = [
  {
    id: 'user-1',
    name: 'John Smith',
    email: 'john.smith@email.com',
    phone: '+1234567890',
    city: 'New York',
    status: 'active',
    registrationSource: 'admin',
  },
  {
    id: 'user-2',
    name: 'Sarah Johnson',
    email: 'sarah.j@email.com',
    phone: '+1234567891',
    city: 'Los Angeles',
    status: 'active',
    registrationSource: 'web',
  },
  {
    id: 'user-3',
    name: 'Mike Wilson',
    email: 'mike.w@email.com',
    phone: '+1234567892',
    city: 'Chicago',
    status: 'active',
    registrationSource: 'mobile',
  },
];

const subscriptionPackages: SubscriptionPackage[] = [
  {
    id: 'basic',
    name: 'Fleet Basic',
    type: 'Basic',
    monthlyFee: 19.99,
    features: ['Basic tracking', 'Maintenance reminders', 'Email support'],
    description: 'Essential fleet management features',
  },
  {
    id: 'premium',
    name: 'Fleet Pro',
    type: 'Premium',
    monthlyFee: 49.99,
    features: [
      'Real-time tracking',
      'Advanced analytics',
      'Maintenance alerts',
      'Driver behavior monitoring',
      'Phone support',
    ],
    description: 'Advanced fleet management with analytics',
  },
  {
    id: 'enterprise',
    name: 'Fleet Enterprise',
    type: 'Enterprise',
    monthlyFee: 99.99,
    features: [
      'Real-time tracking',
      'Advanced analytics',
      'Maintenance alerts',
      'Driver behavior monitoring',
      'Route optimization',
      'Fuel management',
      '24/7 support',
      'Custom integrations',
    ],
    description: 'Complete fleet management solution',
  },
];

const gpsTypes: GPSType[] = [
  {
    id: 'gps-1',
    name: 'TrackMaster Pro',
    manufacturer: 'TechTrack',
    model: 'TM-2024',
    deviceType: 1, // GP51 GPS Tracker type
    configurationCode: 'AT+GPRMC=1,30,{apn},{user},{pass},0,0,0,0',
    description: 'Professional grade GPS tracker with 4G connectivity',
  },
  {
    id: 'gps-2',
    name: 'FleetGuard Elite',
    manufacturer: 'FleetTech',
    model: 'FG-Elite-X',
    deviceType: 2, // GP51 Vehicle Tracker type
    configurationCode: 'CONFIG:APN={apn};USER={user};PASS={pass};INTERVAL=30',
    description: 'Enterprise GPS solution with advanced features',
  },
  {
    id: 'gps-3',
    name: 'SmartTrack Basic',
    manufacturer: 'SmartDevices',
    model: 'ST-B100',
    deviceType: 3, // GP51 Personal Tracker type
    configurationCode: 'SETUP,{apn},{user},{pass},30,1',
    description: 'Cost-effective GPS tracking solution',
  },
];

const networkProviders: NetworkProvider[] = [
  {
    id: 'provider-1',
    name: 'Verizon',
    country: 'USA',
    apnSettings: 'vzwinternet',
  },
  {
    id: 'provider-2',
    name: 'AT&T',
    country: 'USA',
    apnSettings: 'phone',
  },
  {
    id: 'provider-3',
    name: 'T-Mobile',
    country: 'USA',
    apnSettings: 'fast.t-mobile.com',
  },
];

export const EnhancedVehicleRegistration: React.FC = () => {
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [vehicleData, setVehicleData] = useState({
    plateNumber: '',
    make: '',
    model: '',
    year: '',
    vin: '',
    color: '',
    fuelType: '',
  });
  const [selectedPackage, setSelectedPackage] = useState<SubscriptionPackage | null>(null);
  const [selectedGPS, setSelectedGPS] = useState<GPSType | null>(null);
  const [simNumber, setSimNumber] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<NetworkProvider | null>(null);
  const [configurationStatus, setConfigurationStatus] = useState<'idle' | 'sending' | 'success' | 'failed'>('idle');
  const [dataRetrievalStatus, setDataRetrievalStatus] = useState<'idle' | 'retrieving' | 'success' | 'failed'>('idle');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch vehicles using existing hook
  const { data: vehiclesData, isLoading, error, refetch } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => getVehicles({ search: searchQuery, status: statusFilter }),
  });

  const vehicles = vehiclesData?.vehicles || [];
  const filteredVehicles = vehicles;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'configuring':
        return <Badge className="bg-yellow-100 text-yellow-800">Configuring</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'pending_payment':
        return <Badge className="bg-blue-100 text-blue-800">Pending Payment</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const handleNextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSecureVehicleCreation = async () => {
    if (!selectedUser || !selectedGPS || !selectedProvider) return;

    setCurrentStep(5);
    setConfigurationStatus('sending');

    try {
      // Generate unique device ID
      const deviceId = `VH-${Date.now().toString(36).toUpperCase()}`;

      // Create secure vehicle creation request
      const vehicleRequest: SecureVehicleCreationRequest = {
        deviceid: deviceId,
        devicename: `${vehicleData.make} ${vehicleData.model}`,
        devicetype: selectedGPS.deviceType,
        simnum: simNumber,
        timezone: 0, // UTC
        groupid: 0, // Default group
        loginname: selectedUser.email,
        remark: `${vehicleData.plateNumber} - ${vehicleData.vin}`,
        icon: 1,
        needloctype: 1,
        calmileageway: 0,
        creater: 'admin', // GP51 admin username
      };

      // Create vehicle using secure service
      const result = await SecureVehicleService.createVehicleSecurely(
        'admin-user-id', // Would be actual admin user ID
        vehicleRequest
      );

      if (result.success) {
        setConfigurationStatus('success');
        setDataRetrievalStatus('retrieving');

        // Simulate data retrieval delay
        setTimeout(() => {
          setDataRetrievalStatus('success');
          refetch(); // Refresh vehicle list
        }, 3000);
      } else {
        setConfigurationStatus('failed');
        console.error('Vehicle creation failed:', result.errors);
      }
    } catch (error) {
      setConfigurationStatus('failed');
      console.error('Vehicle creation error:', error);
    }
  };

  const handleRetryDataRetrieval = async () => {
    setDataRetrievalStatus('retrieving');
    
    // Simulate retry delay
    setTimeout(() => {
      const success = Math.random() > 0.3; // 70% success rate
      setDataRetrievalStatus(success ? 'success' : 'failed');
      if (success) {
        refetch();
      }
    }, 2000);
  };

  const resetForm = () => {
    setCurrentStep(1);
    setSelectedUser(null);
    setVehicleData({
      plateNumber: '',
      make: '',
      model: '',
      year: '',
      vin: '',
      color: '',
      fuelType: '',
    });
    setSelectedPackage(null);
    setSelectedGPS(null);
    setSimNumber('');
    setSelectedProvider(null);
    setConfigurationStatus('idle');
    setDataRetrievalStatus('idle');
    setShowAddVehicle(false);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Select User</h3>
            <p className="text-sm text-muted-foreground">Choose the user who will own this vehicle</p>
            <div className="grid gap-3">
              {mockUsers.map((user) => (
                <div
                  key={user.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedUser?.id === user.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedUser(user)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{user.name}</h4>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <p className="text-sm text-muted-foreground">
                        {user.phone} • {user.city}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>{user.status}</Badge>
                      <Badge variant="outline" className="text-xs">
                        {user.registrationSource}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Vehicle Details</h3>
            <p className="text-sm text-muted-foreground">Enter the vehicle information</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="plateNumber">Plate Number</Label>
                <Input
                  id="plateNumber"
                  value={vehicleData.plateNumber}
                  onChange={(e) => setVehicleData({ ...vehicleData, plateNumber: e.target.value })}
                  placeholder="e.g. ABC-123"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="make">Make</Label>
                <Input
                  id="make"
                  value={vehicleData.make}
                  onChange={(e) => setVehicleData({ ...vehicleData, make: e.target.value })}
                  placeholder="e.g. Ford"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  value={vehicleData.model}
                  onChange={(e) => setVehicleData({ ...vehicleData, model: e.target.value })}
                  placeholder="e.g. Transit"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  type="number"
                  value={vehicleData.year}
                  onChange={(e) => setVehicleData({ ...vehicleData, year: e.target.value })}
                  placeholder="e.g. 2023"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vin">VIN</Label>
                <Input
                  id="vin"
                  value={vehicleData.vin}
                  onChange={(e) => setVehicleData({ ...vehicleData, vin: e.target.value })}
                  placeholder="e.g. 1FTBW2CM6NKA12345"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  value={vehicleData.color}
                  onChange={(e) => setVehicleData({ ...vehicleData, color: e.target.value })}
                  placeholder="e.g. White"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="fuelType">Fuel Type</Label>
                <Select
                  value={vehicleData.fuelType}
                  onValueChange={(value) => setVehicleData({ ...vehicleData, fuelType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select fuel type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="petrol">Petrol</SelectItem>
                    <SelectItem value="diesel">Diesel</SelectItem>
                    <SelectItem value="electric">Electric</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Subscription Package</h3>
            <p className="text-sm text-muted-foreground">Choose a subscription package for this vehicle</p>
            <div className="grid gap-4">
              {subscriptionPackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedPackage?.id === pkg.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedPackage(pkg)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{pkg.name}</h4>
                        <Badge variant="outline">{pkg.type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{pkg.description}</p>
                      <ul className="space-y-1">
                        {pkg.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">${pkg.monthlyFee}</div>
                      <div className="text-sm text-muted-foreground">per month</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">GP51 GPS Configuration</h3>
              <p className="text-sm text-muted-foreground">Configure the GPS device for GP51 protocol compliance</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">GPS Device Type (GP51 Compatible)</Label>
                <div className="grid gap-3 mt-2">
                  {gpsTypes.map((gps) => (
                    <div
                      key={gps.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedGPS?.id === gps.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedGPS(gps)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{gps.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {gps.manufacturer} - {gps.model} (Type: {gps.deviceType})
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">{gps.description}</p>
                        </div>
                        <Settings className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="simNumber">SIM Number (IMEI)</Label>
                  <Input
                    id="simNumber"
                    value={simNumber}
                    onChange={(e) => setSimNumber(e.target.value)}
                    placeholder="e.g. 1234567890123456"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Network Provider</Label>
                  <Select
                    value={selectedProvider?.id}
                    onValueChange={(value) => {
                      const provider = networkProviders.find((p) => p.id === value);
                      setSelectedProvider(provider || null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {networkProviders.map((provider) => (
                        <SelectItem key={provider.id} value={provider.id}>
                          {provider.name} ({provider.country})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedProvider && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Settings className="h-4 w-4" />
                    <span className="font-medium">APN Settings</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedProvider.apnSettings}</p>
                </div>
              )}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">GP51 Device Registration & Activation</h3>
              <p className="text-sm text-muted-foreground">Registering device with GP51 protocol and activating tracking</p>
            </div>

            <div className="space-y-4">
              {/* Configuration Status */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      configurationStatus === 'success'
                        ? 'bg-green-100'
                        : configurationStatus === 'sending'
                          ? 'bg-yellow-100'
                          : configurationStatus === 'failed'
                            ? 'bg-red-100'
                            : 'bg-gray-100'
                    }`}
                  >
                    {configurationStatus === 'success' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : configurationStatus === 'sending' ? (
                      <Clock className="h-4 w-4 text-yellow-600" />
                    ) : configurationStatus === 'failed' ? (
                      <XCircle className="h-4 w-4 text-red-600" />
                    ) : (
                      <Settings className="h-4 w-4 text-gray-600" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium">GP51 Device Registration</h4>
                    <p className="text-sm text-muted-foreground">
                      {configurationStatus === 'idle' && 'Ready to register device with GP51'}
                      {configurationStatus === 'sending' && 'Registering device with GP51 protocol...'}
                      {configurationStatus === 'success' && 'Device registered successfully with GP51'}
                      {configurationStatus === 'failed' && 'Failed to register device with GP51'}
                    </p>
                  </div>
                </div>
                {configurationStatus === 'sending' && <Progress value={66} className="h-2" />}
              </div>

              {/* Data Retrieval Status */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      dataRetrievalStatus === 'success'
                        ? 'bg-green-100'
                        : dataRetrievalStatus === 'retrieving'
                          ? 'bg-yellow-100'
                          : dataRetrievalStatus === 'failed'
                            ? 'bg-red-100'
                            : 'bg-gray-100'
                    }`}
                  >
                    {dataRetrievalStatus === 'success' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : dataRetrievalStatus === 'retrieving' ? (
                      <RefreshCw className="h-4 w-4 text-yellow-600 animate-spin" />
                    ) : dataRetrievalStatus === 'failed' ? (
                      <XCircle className="h-4 w-4 text-red-600" />
                    ) : (
                      <Settings className="h-4 w-4 text-gray-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">Vehicle Data Retrieval</h4>
                    <p className="text-sm text-muted-foreground">
                      {dataRetrievalStatus === 'idle' && 'Waiting for device registration'}
                      {dataRetrievalStatus === 'retrieving' && 'Establishing connection and retrieving data...'}
                      {dataRetrievalStatus === 'success' && 'Vehicle data received successfully'}
                      {dataRetrievalStatus === 'failed' && 'Failed to retrieve vehicle data'}
                    </p>
                  </div>
                  {dataRetrievalStatus === 'failed' && (
                    <Button variant="outline" size="sm" onClick={handleRetryDataRetrieval}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry
                    </Button>
                  )}
                </div>
                {dataRetrievalStatus === 'retrieving' && <Progress value={33} className="h-2" />}
              </div>

              {/* Success Message */}
              {dataRetrievalStatus === 'success' && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800 font-medium mb-2">
                    <CheckCircle className="h-4 w-4" />
                    Vehicle Successfully Registered with GP51!
                  </div>
                  <p className="text-sm text-green-700">
                    The vehicle has been registered with GP51 protocol and is now actively sending tracking data.
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selectedUser !== null;
      case 2:
        return Object.values(vehicleData).every((value) => value.trim() !== '');
      case 3:
        return selectedPackage !== null;
      case 4:
        return selectedGPS !== null && simNumber.trim() !== '' && selectedProvider !== null;
      default:
        return false;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Enhanced Vehicle Management</h2>
          <p className="text-muted-foreground">GP51 compliant vehicle registration and tracking</p>
        </div>
        <Button onClick={() => setShowAddVehicle(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Register Vehicle
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vehicles.length}</div>
            <p className="text-xs text-muted-foreground">registered vehicles</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Vehicles</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {vehicles.filter((v) => v.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">sending data</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Configuring</CardTitle>
            <Settings className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {vehicles.filter((v) => v.status === 'inactive').length}
            </div>
            <p className="text-xs text-muted-foreground">in setup</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">0</div>
            <p className="text-xs text-muted-foreground">need attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Vehicle List */}
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Inventory</CardTitle>
          <CardDescription>All registered vehicles with GP51 integration status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
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
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Device ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Update</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVehicles.map((vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{vehicle.plateNumber}</div>
                        <div className="text-sm text-muted-foreground">
                          {vehicle.make} {vehicle.model} ({vehicle.year})
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{vehicle.userName}</div>
                        <div className="text-sm text-muted-foreground">{vehicle.subscriptionPackage}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-sm">{vehicle.id}</div>
                    </TableCell>
                    <TableCell>{getStatusBadge(vehicle.status)}</TableCell>
                    <TableCell>
                      {vehicle.lastDataReceived ? (
                        <div>
                          <div className="text-sm">{new Date(vehicle.lastDataReceived).toLocaleDateString()}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(vehicle.lastDataReceived).toLocaleTimeString()}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No data</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Vehicle Dialog */}
      <Dialog open={showAddVehicle} onOpenChange={setShowAddVehicle}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Register New Vehicle - GP51 Protocol</DialogTitle>
            <DialogDescription>
              Step {currentStep} of 5: Complete vehicle registration with GP51 compliance
            </DialogDescription>
          </DialogHeader>

          {/* Progress Indicator */}
          <div className="flex items-center justify-between mb-6">
            {[1, 2, 3, 4, 5].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step <= currentStep ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step}
                </div>
                {step < 5 && <div className={`h-1 w-16 mx-2 ${step < currentStep ? 'bg-primary' : 'bg-muted'}`} />}
              </div>
            ))}
          </div>

          {renderStepContent()}

          <DialogFooter className="flex justify-between">
            <div className="flex gap-2">
              {currentStep > 1 && currentStep < 5 && (
                <Button variant="outline" onClick={handlePreviousStep}>
                  Previous
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              {currentStep < 4 && (
                <Button onClick={handleNextStep} disabled={!canProceed()}>
                  Next
                </Button>
              )}
              {currentStep === 4 && (
                <Button onClick={handleSecureVehicleCreation} disabled={!canProceed()}>
                  <Settings className="h-4 w-4 mr-2" />
                  Register with GP51
                </Button>
              )}
              {currentStep === 5 && dataRetrievalStatus === 'success' && (
                <Button onClick={resetForm}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
