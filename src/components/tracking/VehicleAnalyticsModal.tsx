import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { X, Fuel, Gauge, Calendar, TrendingUp, Activity, MapPin } from 'lucide-react';
import type { EnhancedVehicle, FuelRecord, EngineRecord, MileageRecord } from '@/types/vehicle';
import { generateFuelData, generateEngineData, generateMileageData } from '@/utils/trackingDataGenerator';

interface VehicleAnalyticsModalProps {
  vehicle: EnhancedVehicle | null;
  isOpen: boolean;
  onOpenChange: () => void;
}

export const VehicleAnalyticsModal: React.FC<VehicleAnalyticsModalProps> = ({
  vehicle,
  isOpen,
  onOpenChange
}) => {
  const [timeRange, setTimeRange] = useState('30');

  if (!vehicle) return null;

  const fuelData = generateFuelData(parseInt(timeRange));
  const engineData = generateEngineData(parseInt(timeRange));
  const mileageData = generateMileageData(parseInt(timeRange));

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatValue = (value: number, unit: string) => {
    return `${value.toFixed(1)} ${unit}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            Analytics for {vehicle.device_name}
            {vehicle.plateNumber && <span className="text-sm text-gray-500 ml-2">({vehicle.plateNumber})</span>}
          </DialogTitle>
          <DialogDescription>
            Detailed analytics and historical data for your vehicle.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Key Metrics</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm text-gray-500 mb-1">Fuel Level</h4>
                <p className="text-2xl font-bold">{vehicle.fuel !== undefined && vehicle.fuel !== null ? `${vehicle.fuel}%` : 'N/A'}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm text-gray-500 mb-1">Engine Hours</h4>
                <p className="text-2xl font-bold">{vehicle.engineHours !== undefined && vehicle.engineHours !== null ? `${vehicle.engineHours} hrs` : 'N/A'}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm text-gray-500 mb-1">Mileage</h4>
                <p className="text-2xl font-bold">{vehicle.mileage !== undefined && vehicle.mileage !== null ? `${(vehicle.mileage / 1000).toFixed(1)}k km` : 'N/A'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Time Range Selector */}
          <div className="flex items-center gap-2 mb-6">
            <span className="text-sm font-medium">Time Range:</span>
            {['7', '30', '90'].map((days) => (
              <Button
                key={days}
                variant={timeRange === days ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange(days)}
              >
                {days} days
              </Button>
            ))}
          </div>

          <Tabs defaultValue="fuel" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="fuel">Fuel Analytics</TabsTrigger>
              <TabsTrigger value="engine">Engine Performance</TabsTrigger>
              <TabsTrigger value="mileage">Mileage & Trips</TabsTrigger>
            </TabsList>

            <TabsContent value="fuel" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Fuel Consumption Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Daily Fuel Consumption</CardTitle>
                    <CardDescription>Liters consumed per day</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={fuelData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={formatDate}
                        />
                        <YAxis />
                        <Tooltip 
                          labelFormatter={formatDate}
                          formatter={(value: number) => [formatValue(value, 'L'), 'Consumption']}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="consumption" 
                          stroke="#8884d8" 
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Fuel Efficiency Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Fuel Efficiency</CardTitle>
                    <CardDescription>Kilometers per liter</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={fuelData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={formatDate}
                        />
                        <YAxis />
                        <Tooltip 
                          labelFormatter={formatDate}
                          formatter={(value: number) => [formatValue(value, 'km/L'), 'Efficiency']}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="efficiency" 
                          stroke="#82ca9d" 
                          fill="#82ca9d" 
                          fillOpacity={0.6}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Fuel Cost Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Daily Fuel Costs</CardTitle>
                  <CardDescription>Fuel expenses over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={fuelData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={formatDate}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={formatDate}
                        formatter={(value: number) => [`$${value.toFixed(2)}`, 'Cost']}
                      />
                      <Bar 
                        dataKey="cost" 
                        fill="#ffc658"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="engine" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Engine Hours Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Daily Engine Hours</CardTitle>
                    <CardDescription>Hours of engine operation per day</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={engineData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={formatDate}
                        />
                        <YAxis />
                        <Tooltip 
                          labelFormatter={formatDate}
                          formatter={(value: number) => [formatValue(value, 'hrs'), 'Engine Hours']}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="engineHours" 
                          stroke="#ff7300"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Idle Time Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Daily Idle Time</CardTitle>
                    <CardDescription>Hours spent idling per day</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={engineData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={formatDate}
                        />
                        <YAxis />
                        <Tooltip 
                          labelFormatter={formatDate}
                          formatter={(value: number) => [formatValue(value, 'hrs'), 'Idle Time']}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="idleTime" 
                          stroke="#ff4444" 
                          fill="#ff4444" 
                          fillOpacity={0.6}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Performance and Utilization */}
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Engine Utilization</CardTitle>
                    <CardDescription>Percentage of engine capacity used</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={engineData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={formatDate}
                        />
                        <YAxis />
                        <Tooltip 
                          labelFormatter={formatDate}
                          formatter={(value: number) => [`${value.toFixed(1)}%`, 'Utilization']}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="utilization" 
                          stroke="#8884d8"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Engine Performance</CardTitle>
                    <CardDescription>Overall engine performance rating</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={engineData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={formatDate}
                        />
                        <YAxis />
                        <Tooltip 
                          labelFormatter={formatDate}
                          formatter={(value: number) => [`${value.toFixed(1)}%`, 'Performance']}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="performance" 
                          stroke="#00d4aa" 
                          fill="#00d4aa" 
                          fillOpacity={0.6}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="mileage" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Daily Distance Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Daily Distance</CardTitle>
                    <CardDescription>Kilometers traveled per day</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={mileageData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={formatDate}
                        />
                        <YAxis />
                        <Tooltip 
                          labelFormatter={formatDate}
                          formatter={(value: number) => [formatValue(value, 'km'), 'Distance']}
                        />
                        <Bar 
                          dataKey="distance" 
                          fill="#8884d8"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Daily Trips Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Daily Trips</CardTitle>
                    <CardDescription>Number of trips per day</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={mileageData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={formatDate}
                        />
                        <YAxis />
                        <Tooltip 
                          labelFormatter={formatDate}
                          formatter={(value: number) => [`${value.toString()}`, 'Trips']}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="trips" 
                          stroke="#82ca9d"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Activity and Estimated Fuel */}
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Vehicle Activity</CardTitle>
                    <CardDescription>Daily activity level percentage</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={mileageData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={formatDate}
                        />
                        <YAxis />
                        <Tooltip 
                          labelFormatter={formatDate}
                          formatter={(value: number) => [`${value.toFixed(1)}%`, 'Activity']}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="activity" 
                          stroke="#ff7300" 
                          fill="#ff7300" 
                          fillOpacity={0.6}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Estimated Fuel Usage</CardTitle>
                    <CardDescription>Projected fuel consumption based on trips</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={mileageData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={formatDate}
                        />
                        <YAxis />
                        <Tooltip 
                          labelFormatter={formatDate}
                          formatter={(value: number) => [formatValue(value, 'L'), 'Estimated Fuel']}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="estimatedFuel" 
                          stroke="#00d4aa"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Vehicle Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Vehicle Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell>Fuel Type</TableCell>
                    <TableCell>{vehicle.fuelType || 'N/A'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Engine Size</TableCell>
                    <TableCell>{vehicle.engineSize ? `${vehicle.engineSize}L` : 'N/A'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Driver</TableCell>
                    <TableCell>{vehicle.driver?.name || 'N/A'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Status</TableCell>
                    <TableCell>
                      <Badge variant={vehicle.status === 'active' || vehicle.status === 'online' ? 'default' : 'secondary'}>
                        {vehicle.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
