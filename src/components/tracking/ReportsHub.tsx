
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Search, 
  Download, 
  Calendar,
  Filter,
  TrendingUp,
  MapPin,
  Clock,
  BarChart3
} from 'lucide-react';
import ReportGenerationSection from './ReportGenerationSection';
import { useStableVehicleData } from '@/hooks/useStableVehicleData';

const ReportsHub: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedVehicle, setSelectedVehicle] = useState('all');

  // Use stable vehicle data
  const { vehicles, isLoading } = useStableVehicleData();

  const reportCategories = [
    { value: 'all', label: 'All Reports' },
    { value: 'activity', label: 'Activity Reports' },
    { value: 'location', label: 'Location Reports' },
    { value: 'summary', label: 'Summary Reports' },
    { value: 'analytics', label: 'Analytics Reports' }
  ];

  const quickReports = [
    {
      id: 'daily_summary',
      name: 'Daily Fleet Summary',
      description: 'Overview of fleet activity for the last 24 hours',
      icon: <BarChart3 className="h-5 w-5" />,
      color: 'bg-blue-500',
      category: 'summary'
    },
    {
      id: 'weekly_activity',
      name: 'Weekly Activity Report',
      description: 'Detailed activity patterns for the past week',
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'bg-green-500',
      category: 'activity'
    },
    {
      id: 'location_history',
      name: 'Location History',
      description: 'GPS tracking and route history for selected vehicles',
      icon: <MapPin className="h-5 w-5" />,
      color: 'bg-purple-500',
      category: 'location'
    },
    {
      id: 'usage_analytics',
      name: 'Usage Analytics',
      description: 'Vehicle utilization and efficiency metrics',
      icon: <Clock className="h-5 w-5" />,
      color: 'bg-orange-500',
      category: 'analytics'
    }
  ];

  const filteredReports = quickReports.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || report.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleQuickGenerate = (reportId: string) => {
    console.log('Generating quick report:', reportId);
    // Implement quick report generation
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports Hub</h1>
          <p className="text-gray-600 mt-1">
            Generate and manage vehicle tracking reports
          </p>
        </div>
        <Badge variant="outline">
          {vehicles.length} vehicles available
        </Badge>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium mb-2">Search Reports</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by report name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {reportCategories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Vehicle */}
            <div>
              <label className="block text-sm font-medium mb-2">Vehicle</label>
              <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vehicles</SelectItem>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.device_id} value={vehicle.device_id}>
                      {vehicle.device_name || vehicle.device_id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Quick Reports
            <Badge variant="outline">
              {filteredReports.length} available
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                className="p-4 border rounded-lg hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg text-white ${report.color}`}>
                    {report.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{report.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <Button
                        size="sm"
                        onClick={() => handleQuickGenerate(report.id)}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Generate
                      </Button>
                      <Badge variant="secondary" className="text-xs">
                        {report.category}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredReports.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Reports Found</h3>
              <p className="text-gray-500">
                Try adjusting your search criteria or category filter
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Custom Report Generation */}
      <ReportGenerationSection vehicles={vehicles} />
    </div>
  );
};

export default ReportsHub;
