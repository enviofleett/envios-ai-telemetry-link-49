import React, { useState } from 'react';
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
  onClose: () => void;
}

export const VehicleAnalyticsModal: React.FC<VehicleAnalyticsModalProps> = ({
  vehicle,
  isOpen,
  onClose
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Vehicle Analytics - {vehicle.plateNumber}
              </DialogTitle>
              <DialogDescription>
                Comprehensive analytics and performance metrics for {vehicle.model}
              </DialogDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Vehicle Summary */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Current Speed</p>
                  <p className="text-2xl font-bold">{vehicle.speed} km/h</p>
                </div>
                <Gauge className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Fuel Level</p>
                  <p className="text-2xl font-bold">{vehicle.fuel}%</p>
                </div>
                <Fuel className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Engine Hours</p>
                  <p className="text-2xl font-bold">{vehicle.engineHours.toLocaleString()}</p>
                </div>
                <Activity className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Mileage</p>
                  <p className="text-2xl font-bold">{vehicle.mileage.toLocaleString()} km</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

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
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Location</p>
                <p className="text-sm">{vehicle.location.address}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fuel Type</p>
                <p className="text-sm">{vehicle.fuelType}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Engine Size</p>
                <p className="text-sm">{vehicle.engineSize.toFixed(1)}L</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Driver</p>
                <p className="text-sm">{vehicle.driver}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge variant={vehicle.status === 'active' ? 'default' : 'secondary'}>
                  {vehicle.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Last Update</p>
                <p className="text-sm">{vehicle.lastUpdate.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};
