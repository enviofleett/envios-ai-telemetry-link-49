import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Download, Search } from 'lucide-react';
import type { VehicleData } from '@/services/unifiedVehicleData';

interface ReportsHubProps {
  vehicles: VehicleData[];
}

interface TripReport {
  date: string;
  vehicleId: string;
  plateNumber: string;
  startTime: string;
  endTime: string;
  duration: string;
  distance: string;
}

const ReportsHub: React.FC<ReportsHubProps> = ({ vehicles }) => {
  const [activeTab, setActiveTab] = useState('trip-reports');
  const [selectedVehicle, setSelectedVehicle] = useState('all');
  const [selectedPlate, setSelectedPlate] = useState('all');
  const [fromDate, setFromDate] = useState('');

  // Mock trip data
  const mockTripReports: TripReport[] = [
    {
      date: '6/6',
      vehicleId: 'VH-7842',
      plateNumber: 'ABC-123',
      startTime: '8:15AM',
      endTime: '9:45AM',
      duration: '1h 30m',
      distance: '45.2km'
    },
    {
      date: '6/6',
      vehicleId: 'VH-7842',
      plateNumber: 'ABC-123',
      startTime: '10:30AM',
      endTime: '11:15AM',
      duration: '0h 45m',
      distance: '22.8km'
    },
    {
      date: '6/6',
      vehicleId: 'VH-7842',
      plateNumber: 'ABC-123',
      startTime: '1:00PM',
      endTime: '3:30PM',
      duration: '2h 30m',
      distance: '78.5km'
    }
  ];

  const tabs = [
    { id: 'trip-reports', label: 'Trip Reports' },
    { id: 'geofence', label: 'Geofence' },
    { id: 'mileage', label: 'Mileage' },
    { id: 'favorite-places', label: 'Favorite Places' }
  ];

  const handleGenerate = () => {
    console.log('Generate report clicked');
    // TODO: Implement report generation
  };

  const handleExport = () => {
    console.log('Export report clicked');
    // TODO: Implement export functionality
  };

  return (
    <Card className="bg-white border border-gray-lighter shadow-sm">
      <CardHeader className="p-6 border-b border-gray-lighter">
        <CardTitle className="text-lg font-semibold text-primary-dark">
          Reports Hub
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6">
        {/* Tab List */}
        <div className="mb-6">
          <div className="flex bg-gray-background rounded p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-primary-dark border-b-2 border-teal-primary'
                    : 'text-gray-mid hover:text-primary-dark'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {/* Vehicle Dropdown */}
          <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
            <SelectTrigger className="h-10 border-gray-lighter">
              <SelectValue placeholder="Vehicle" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-lighter">
              <SelectItem value="all">All Vehicles</SelectItem>
              {vehicles.map((vehicle) => (
                <SelectItem key={vehicle.deviceId} value={vehicle.deviceId}>
                  {vehicle.deviceName || vehicle.deviceId}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Plate Number Dropdown */}
          <Select value={selectedPlate} onValueChange={setSelectedPlate}>
            <SelectTrigger className="h-10 border-gray-lighter">
              <SelectValue placeholder="Plate #" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-lighter">
              <SelectItem value="all">All Plates</SelectItem>
              <SelectItem value="ABC-123">ABC-123</SelectItem>
              <SelectItem value="XYZ-789">XYZ-789</SelectItem>
              <SelectItem value="DEF-456">DEF-456</SelectItem>
            </SelectContent>
          </Select>

          {/* From Date */}
          <div className="relative">
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-10 border-gray-lighter pl-10"
              placeholder="From Date"
            />
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-mid" />
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            className="bg-white border border-gray-lighter text-primary-dark hover:bg-gray-background"
            variant="outline"
          >
            <Search className="w-4 h-4 mr-2" />
            Generate
          </Button>
        </div>

        {/* Report Table */}
        {activeTab === 'trip-reports' && (
          <div className="border border-gray-lighter rounded">
            {/* Table Header */}
            <div className="flex items-center justify-between bg-gray-background px-4 py-3 border-b border-gray-lighter">
              <h4 className="text-sm font-medium text-primary-dark">Trip Report</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="bg-white border-gray-lighter text-primary-dark hover:bg-gray-background"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-background">
                  <tr className="border-b border-gray-lighter">
                    <th className="px-3 py-2 text-left text-sm font-medium text-gray-dark">Date</th>
                    <th className="px-3 py-2 text-left text-sm font-medium text-gray-dark">Vehicle</th>
                    <th className="px-3 py-2 text-left text-sm font-medium text-gray-dark">Plate</th>
                    <th className="px-3 py-2 text-left text-sm font-medium text-gray-dark">Start</th>
                    <th className="px-3 py-2 text-left text-sm font-medium text-gray-dark">End</th>
                    <th className="px-3 py-2 text-left text-sm font-medium text-gray-dark">Duration</th>
                    <th className="px-3 py-2 text-left text-sm font-medium text-gray-dark">Dist</th>
                  </tr>
                </thead>
                <tbody>
                  {mockTripReports.map((report, index) => (
                    <tr key={index} className="border-b border-gray-lighter">
                      <td className="px-3 py-2 text-sm text-primary-dark">{report.date}</td>
                      <td className="px-3 py-2 text-sm text-primary-dark">{report.vehicleId}</td>
                      <td className="px-3 py-2 text-sm text-primary-dark">{report.plateNumber}</td>
                      <td className="px-3 py-2 text-sm text-primary-dark">{report.startTime}</td>
                      <td className="px-3 py-2 text-sm text-primary-dark">{report.endTime}</td>
                      <td className="px-3 py-2 text-sm text-primary-dark">{report.duration}</td>
                      <td className="px-3 py-2 text-sm text-primary-dark">{report.distance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Placeholder for other tabs */}
        {activeTab !== 'trip-reports' && (
          <div className="text-center py-8 text-gray-mid">
            {tabs.find(tab => tab.id === activeTab)?.label} functionality coming soon
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReportsHub;
