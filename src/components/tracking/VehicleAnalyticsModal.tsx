
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  Fuel,
  Gauge,
  Route,
  Download,
  CalendarIcon,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { format, subDays, isWithinInterval } from 'date-fns';
import type { EnhancedVehicle, FuelRecord, EngineRecord, MileageRecord } from '@/types/enhancedVehicle';
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
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

  if (!vehicle) return null;

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortConfig.direction === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  const sortData = <T extends Record<string, any>>(data: T[], key: string): T[] => {
    if (!sortConfig || sortConfig.key !== key) return data;

    return [...data].sort((a, b) => {
      const aValue = a[key];
      const bValue = b[key];

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue;
      }

      const aString = String(aValue).toLowerCase();
      const bString = String(bValue).toLowerCase();

      if (sortConfig.direction === "asc") {
        return aString < bString ? -1 : aString > bString ? 1 : 0;
      } else {
        return aString > bString ? -1 : aString < bString ? 1 : 0;
      }
    });
  };

  const filterDataByDate = <T extends { date: string }>(data: T[]): T[] => {
    if (!dateRange.from || !dateRange.to) return data;

    return data.filter((item) => {
      const itemDate = new Date(item.date);
      return isWithinInterval(itemDate, { start: dateRange.from!, end: dateRange.to! });
    });
  };

  const setQuickDateRange = (days: number) => {
    setDateRange({
      from: subDays(new Date(), days),
      to: new Date(),
    });
  };

  const getPerformanceBadge = (performance: string) => {
    switch (performance) {
      case "Excellent":
        return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
      case "Good":
        return <Badge className="bg-blue-100 text-blue-800">Good</Badge>;
      case "Poor":
        return <Badge variant="destructive">Poor</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getActivityBadge = (activity: string) => {
    switch (activity) {
      case "High":
        return <Badge className="bg-red-100 text-red-800">High</Badge>;
      case "Medium":
        return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      case "Low":
        return <Badge className="bg-gray-100 text-gray-800">Low</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Vehicle Analytics - {vehicle.plateNumber}
          </DialogTitle>
          <DialogDescription>
            Detailed analytics for {vehicle.model} (VIN: {vehicle.vin})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Date Range Filter */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Date Range Filter</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setQuickDateRange(7)}>
                    Last 7 Days
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setQuickDateRange(30)}>
                    Last 30 Days
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setQuickDateRange(90)}>
                    Last 90 Days
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-[140px] justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? format(dateRange.from, "MMM dd, yyyy") : "From Date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateRange?.from}
                        onSelect={(date) => setDateRange({ ...dateRange, from: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-[140px] justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.to ? format(dateRange.to, "MMM dd, yyyy") : "To Date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateRange?.to}
                        onSelect={(date) => setDateRange({ ...dateRange, to: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="fuel" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="fuel" className="flex items-center gap-2">
                <Fuel className="h-4 w-4" />
                Fuel Consumption
              </TabsTrigger>
              <TabsTrigger value="engine" className="flex items-center gap-2">
                <Gauge className="h-4 w-4" />
                Engine Time
              </TabsTrigger>
              <TabsTrigger value="mileage" className="flex items-center gap-2">
                <Route className="h-4 w-4" />
                Mileage
              </TabsTrigger>
            </TabsList>

            <TabsContent value="fuel" className="space-y-6">
              {(() => {
                const fuelData = filterDataByDate(generateFuelData(vehicle, 90));
                const sortedFuelData = sortData(fuelData, sortConfig?.key || "");
                const totalConsumption = fuelData.reduce((sum, record) => sum + record.consumption, 0);
                const avgEfficiency = fuelData.reduce((sum, record) => sum + record.efficiency, 0) / fuelData.length;
                const totalCost = fuelData.reduce((sum, record) => sum + record.cost, 0);
                const bestDay = fuelData.reduce(
                  (best, record) => (record.efficiency > best.efficiency ? record : best),
                  fuelData[0] || { efficiency: 0, date: "" },
                );

                return (
                  <>
                    {/* Summary Cards */}
                    <div className="grid gap-4 md:grid-cols-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Total Consumption</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{totalConsumption.toFixed(1)}L</div>
                          <p className="text-xs text-muted-foreground">in selected period</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Average Efficiency</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{avgEfficiency.toFixed(1)} km/L</div>
                          <p className="text-xs text-muted-foreground">fuel efficiency</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Total Cost</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">${totalCost.toFixed(2)}</div>
                          <p className="text-xs text-muted-foreground">fuel expenses</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Best Performance</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{bestDay?.efficiency?.toFixed(1) || 0} km/L</div>
                          <p className="text-xs text-muted-foreground">
                            {bestDay?.date ? format(new Date(bestDay.date), "MMM dd") : "N/A"}
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Fuel Consumption Table */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2">
                            <Fuel className="h-4 w-4" />
                            Fuel Consumption Data
                          </CardTitle>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Export CSV
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="border rounded-lg">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>
                                  <Button
                                    variant="ghost"
                                    onClick={() => handleSort("date")}
                                    className="h-auto p-0 font-semibold"
                                  >
                                    Date {getSortIcon("date")}
                                  </Button>
                                </TableHead>
                                <TableHead>
                                  <Button
                                    variant="ghost"
                                    onClick={() => handleSort("consumption")}
                                    className="h-auto p-0 font-semibold"
                                  >
                                    Consumption (L) {getSortIcon("consumption")}
                                  </Button>
                                </TableHead>
                                <TableHead>
                                  <Button
                                    variant="ghost"
                                    onClick={() => handleSort("efficiency")}
                                    className="h-auto p-0 font-semibold"
                                  >
                                    Efficiency (km/L) {getSortIcon("efficiency")}
                                  </Button>
                                </TableHead>
                                <TableHead>
                                  <Button
                                    variant="ghost"
                                    onClick={() => handleSort("cost")}
                                    className="h-auto p-0 font-semibold"
                                  >
                                    Cost ($) {getSortIcon("cost")}
                                  </Button>
                                </TableHead>
                                <TableHead>
                                  <Button
                                    variant="ghost"
                                    onClick={() => handleSort("distance")}
                                    className="h-auto p-0 font-semibold"
                                  >
                                    Distance (km) {getSortIcon("distance")}
                                  </Button>
                                </TableHead>
                                <TableHead>Performance</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {sortedFuelData.slice(0, 20).map((record, index) => (
                                <TableRow key={index}>
                                  <TableCell>{format(new Date(record.date), "MMM dd, yyyy")}</TableCell>
                                  <TableCell className="font-medium">{record.consumption}</TableCell>
                                  <TableCell className="font-medium">{record.efficiency}</TableCell>
                                  <TableCell>${record.cost}</TableCell>
                                  <TableCell>{record.distance}</TableCell>
                                  <TableCell>{getPerformanceBadge(record.performance)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                );
              })()}
            </TabsContent>

            <TabsContent value="engine" className="space-y-6">
              {(() => {
                const engineData = filterDataByDate(generateEngineData(vehicle, 90));
                const sortedEngineData = sortData(engineData, sortConfig?.key || "");
                const totalHours = engineData.reduce((sum, record) => sum + record.engineHours, 0);
                const totalIdleTime = engineData.reduce((sum, record) => sum + record.idleTime, 0);
                const avgUtilization = engineData.reduce((sum, record) => sum + record.utilization, 0) / engineData.length;

                return (
                  <>
                    {/* Summary Cards */}
                    <div className="grid gap-4 md:grid-cols-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Total Engine Hours</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{totalHours.toFixed(1)}h</div>
                          <p className="text-xs text-muted-foreground">in selected period</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Total Idle Time</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{totalIdleTime.toFixed(1)}h</div>
                          <p className="text-xs text-muted-foreground">
                            {((totalIdleTime / totalHours) * 100).toFixed(1)}% of total
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Average Utilization</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{avgUtilization.toFixed(1)}%</div>
                          <p className="text-xs text-muted-foreground">efficiency rate</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Productive Hours</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{(totalHours - totalIdleTime).toFixed(1)}h</div>
                          <p className="text-xs text-muted-foreground">active work time</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Engine Time Table */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2">
                            <Gauge className="h-4 w-4" />
                            Engine Time Data
                          </CardTitle>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Export CSV
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="border rounded-lg">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>
                                  <Button
                                    variant="ghost"
                                    onClick={() => handleSort("date")}
                                    className="h-auto p-0 font-semibold"
                                  >
                                    Date {getSortIcon("date")}
                                  </Button>
                                </TableHead>
                                <TableHead>
                                  <Button
                                    variant="ghost"
                                    onClick={() => handleSort("engineHours")}
                                    className="h-auto p-0 font-semibold"
                                  >
                                    Engine Hours {getSortIcon("engineHours")}
                                  </Button>
                                </TableHead>
                                <TableHead>
                                  <Button
                                    variant="ghost"
                                    onClick={() => handleSort("idleTime")}
                                    className="h-auto p-0 font-semibold"
                                  >
                                    Idle Time {getSortIcon("idleTime")}
                                  </Button>
                                </TableHead>
                                <TableHead>
                                  <Button
                                    variant="ghost"
                                    onClick={() => handleSort("utilization")}
                                    className="h-auto p-0 font-semibold"
                                  >
                                    Utilization (%) {getSortIcon("utilization")}
                                  </Button>
                                </TableHead>
                                <TableHead>Performance</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {sortedEngineData.slice(0, 20).map((record, index) => (
                                <TableRow key={index}>
                                  <TableCell>{format(new Date(record.date), "MMM dd, yyyy")}</TableCell>
                                  <TableCell className="font-medium">{record.engineHours}h</TableCell>
                                  <TableCell className="font-medium">{record.idleTime}h</TableCell>
                                  <TableCell className="font-medium">{record.utilization}%</TableCell>
                                  <TableCell>{getPerformanceBadge(record.performance)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                );
              })()}
            </TabsContent>

            <TabsContent value="mileage" className="space-y-6">
              {(() => {
                const mileageData = filterDataByDate(generateMileageData(vehicle, 90));
                const sortedMileageData = sortData(mileageData, sortConfig?.key || "");
                const totalDistance = mileageData.reduce((sum, record) => sum + record.distance, 0);
                const totalTrips = mileageData.reduce((sum, record) => sum + record.trips, 0);
                const avgDailyDistance = totalDistance / mileageData.length;

                return (
                  <>
                    {/* Summary Cards */}
                    <div className="grid gap-4 md:grid-cols-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Total Distance</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{totalDistance.toFixed(0)} km</div>
                          <p className="text-xs text-muted-foreground">in selected period</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Total Trips</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{totalTrips}</div>
                          <p className="text-xs text-muted-foreground">completed trips</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Daily Average</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{avgDailyDistance.toFixed(0)} km</div>
                          <p className="text-xs text-muted-foreground">per day</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Estimated Fuel</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {mileageData.reduce((sum, record) => sum + record.estimatedFuel, 0).toFixed(1)}L
                          </div>
                          <p className="text-xs text-muted-foreground">consumption</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Mileage Table */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2">
                            <Route className="h-4 w-4" />
                            Mileage Data
                          </CardTitle>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Export CSV
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="border rounded-lg">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>
                                  <Button
                                    variant="ghost"
                                    onClick={() => handleSort("date")}
                                    className="h-auto p-0 font-semibold"
                                  >
                                    Date {getSortIcon("date")}
                                  </Button>
                                </TableHead>
                                <TableHead>
                                  <Button
                                    variant="ghost"
                                    onClick={() => handleSort("distance")}
                                    className="h-auto p-0 font-semibold"
                                  >
                                    Distance (km) {getSortIcon("distance")}
                                  </Button>
                                </TableHead>
                                <TableHead>
                                  <Button
                                    variant="ghost"
                                    onClick={() => handleSort("trips")}
                                    className="h-auto p-0 font-semibold"
                                  >
                                    Trips {getSortIcon("trips")}
                                  </Button>
                                </TableHead>
                                <TableHead>
                                  <Button
                                    variant="ghost"
                                    onClick={() => handleSort("estimatedFuel")}
                                    className="h-auto p-0 font-semibold"
                                  >
                                    Est. Fuel (L) {getSortIcon("estimatedFuel")}
                                  </Button>
                                </TableHead>
                                <TableHead>Activity Level</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {sortedMileageData.slice(0, 20).map((record, index) => (
                                <TableRow key={index}>
                                  <TableCell>{format(new Date(record.date), "MMM dd, yyyy")}</TableCell>
                                  <TableCell className="font-medium">{record.distance} km</TableCell>
                                  <TableCell className="font-medium">{record.trips}</TableCell>
                                  <TableCell className="font-medium">{record.estimatedFuel}L</TableCell>
                                  <TableCell>{getActivityBadge(record.activity)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                );
              })()}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
