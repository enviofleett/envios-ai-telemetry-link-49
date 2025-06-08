
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import {
  Car,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Fuel,
  BarChart3,
  TrendingUp,
  Calendar,
  Users,
  FileText,
  Settings,
  Plus,
  ChevronRight,
  Wrench,
  Download,
} from "lucide-react"
import { useEnhancedVehicleData } from '@/hooks/useEnhancedVehicleData'
import { useGP51ConnectionHealth } from '@/hooks/useGP51ConnectionHealth'

interface DashboardContentProps {
  activeTab?: string
}

export function DashboardContent({ activeTab }: DashboardContentProps) {
  const [activeSection, setActiveSection] = useState("dashboard")
  const { vehicles, metrics, isLoading } = useEnhancedVehicleData()
  const { status: connectionStatus } = useGP51ConnectionHealth()

  // Function to render the appropriate section based on URL hash
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "") || "dashboard"
      setActiveSection(hash)
    }

    handleHashChange() // Set initial state based on URL
    window.addEventListener("hashchange", handleHashChange)
    return () => window.removeEventListener("hashchange", handleHashChange)
  }, [])

  // Calculate real-time metrics
  const totalVehicles = vehicles.length
  const activeVehicles = vehicles.filter(v => v.status === 'online').length
  const maintenanceDue = vehicles.filter(v => v.status?.toLowerCase().includes('maintenance')).length
  const offlineVehicles = totalVehicles - activeVehicles

  // Default dashboard content
  return (
    <div className="w-full">
      <div className={activeSection === "dashboard" ? "space-y-6" : "hidden"}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Fleet Dashboard</h2>
          <div className="flex items-center space-x-2">
            <Button variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              Today
            </Button>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Vehicle
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalVehicles}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">GP51 Connected</span>
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Vehicles</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{activeVehicles}</div>
              <p className="text-xs text-muted-foreground">
                {totalVehicles > 0 ? Math.round((activeVehicles / totalVehicles) * 100) : 0}% of total fleet
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Maintenance Due</CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{maintenanceDue}</div>
              <p className="text-xs text-muted-foreground">
                Vehicles requiring attention
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Connection Status</CardTitle>
              <div className={`h-4 w-4 rounded-full ${connectionStatus?.status === 'connected' ? 'bg-green-500' : 'bg-red-500'}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">GP51</div>
              <p className="text-xs text-muted-foreground">
                <span className={connectionStatus?.status === 'connected' ? 'text-green-600' : 'text-red-600'}>
                  {connectionStatus?.status === 'connected' ? 'Online' : 'Offline'}
                </span>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-7">
          {/* Left Column - Charts and Analytics */}
          <div className="lg:col-span-4 space-y-6">
            {/* Fleet Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Fleet Performance</CardTitle>
                <CardDescription>Vehicle utilization and efficiency metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center bg-muted/20 rounded-lg">
                  <div className="text-center">
                    <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">Performance Analytics</p>
                    <p className="text-sm text-muted-foreground">Interactive charts and metrics</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activities */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
                <CardDescription>Latest fleet operations and updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {vehicles.slice(0, 4).map((vehicle, index) => (
                    <div key={vehicle.id} className="flex items-center space-x-4">
                      <div className={`w-2 h-2 rounded-full ${vehicle.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Vehicle {vehicle.deviceName} {vehicle.status === 'online' ? 'is online' : 'went offline'}</p>
                        <p className="text-xs text-muted-foreground">
                          {vehicle.lastUpdate ? new Date(vehicle.lastUpdate).toLocaleTimeString() : 'No recent data'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Quick Info and Actions */}
          <div className="lg:col-span-3 space-y-6">
            {/* Vehicle Status Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Vehicle Status</CardTitle>
                <CardDescription>Real-time fleet status overview</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Online</span>
                  </div>
                  <span className="text-sm font-medium">{activeVehicles} vehicles</span>
                </div>
                <Progress value={totalVehicles > 0 ? (activeVehicles / totalVehicles) * 100 : 0} className="h-2" />

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm">Offline</span>
                  </div>
                  <span className="text-sm font-medium">{offlineVehicles} vehicles</span>
                </div>
                <Progress value={totalVehicles > 0 ? (offlineVehicles / totalVehicles) * 100 : 0} className="h-2" />

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                    <span className="text-sm">Maintenance</span>
                  </div>
                  <span className="text-sm font-medium">{maintenanceDue} vehicles</span>
                </div>
                <Progress value={totalVehicles > 0 ? (maintenanceDue / totalVehicles) * 100 : 0} className="h-2" />
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common fleet management tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" onClick={() => window.location.hash = "vehicles"}>
                  <Plus className="mr-2 h-4 w-4" />
                  Manage Vehicles
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => window.location.hash = "maintenance"}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule Maintenance
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => window.location.hash = "tracking"}>
                  <MapPin className="mr-2 h-4 w-4" />
                  Live Tracking
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => window.location.hash = "reports"}>
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Vehicles Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Vehicle Activity</CardTitle>
                <CardDescription>Latest updates from your fleet vehicles</CardDescription>
              </div>
              <Button variant="outline" onClick={() => window.location.hash = "vehicles"}>
                View All
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Last Update</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicles.slice(0, 5).map((vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell className="font-medium">{vehicle.deviceName}</TableCell>
                    <TableCell>
                      <Badge className={vehicle.status === 'online' ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                        {vehicle.status === 'online' ? 'Active' : 'Offline'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                        {vehicle.location || 'Unknown'}
                      </div>
                    </TableCell>
                    <TableCell>{vehicle.lastUpdate ? new Date(vehicle.lastUpdate).toLocaleString() : 'No data'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Settings Section */}
      <div className={activeSection === "settings" ? "space-y-6" : "hidden"}>
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Settings & Configuration</h2>
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="topups">Top-ups</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="system">System Settings</TabsTrigger>
            <TabsTrigger value="integrations">API Integrations</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage user accounts, roles, permissions, and activity logs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <Input placeholder="Search users..." className="max-w-sm" />
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                </div>

                <div className="space-y-6">
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Last Active</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">John Smith</TableCell>
                          <TableCell>john.smith@envio.com</TableCell>
                          <TableCell>
                            <Select defaultValue="admin">
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="manager">Manager</SelectItem>
                                <SelectItem value="operator">Operator</SelectItem>
                                <SelectItem value="viewer">Viewer</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-800">Active</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">2 hours ago</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="outline" size="sm">Edit</Button>
                              <Button variant="outline" size="sm">Logs</Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="topups" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-sm">SMS</span>
                    </div>
                    SMS Notification Bundles
                  </CardTitle>
                  <CardDescription>Purchase SMS credits for vehicle alerts and notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Current Balance</span>
                      <span className="text-lg font-bold text-blue-600">1,247 SMS</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Expires: December 31, 2024</p>
                  </div>

                  <div className="space-y-3">
                    <div className="border rounded-lg p-4 hover:bg-muted/20 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Starter Pack</h4>
                          <p className="text-sm text-muted-foreground">500 SMS messages</p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">$19.99</div>
                          <div className="text-xs text-muted-foreground">$0.04 per SMS</div>
                        </div>
                      </div>
                      <Button className="w-full mt-3" variant="outline">Purchase</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Theme Settings</CardTitle>
                <CardDescription>Customize the appearance of your dashboard</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium">Color Theme</label>
                  <div className="grid gap-3">
                    <div className="flex items-center space-x-3 border rounded-lg p-3 hover:bg-muted/20 transition-colors">
                      <input type="radio" name="theme" value="light" defaultChecked className="rounded" />
                      <div className="flex items-center gap-3">
                        <div className="h-6 w-6 rounded bg-white border-2 border-gray-200"></div>
                        <div>
                          <div className="font-medium">Light Mode</div>
                          <div className="text-sm text-muted-foreground">Clean and bright interface</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button>Apply Theme</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Configuration</CardTitle>
                <CardDescription>Configure system-wide settings and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Time Zone</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="utc">UTC</SelectItem>
                        <SelectItem value="est">Eastern Time</SelectItem>
                        <SelectItem value="pst">Pacific Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Data Retention (days)</label>
                    <Input type="number" placeholder="365" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>API Integrations</CardTitle>
                <CardDescription>Manage third-party service integrations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">GP51 Tracking Service</p>
                      <p className="text-sm text-muted-foreground">Real-time location tracking</p>
                    </div>
                    <Badge className={connectionStatus?.status === 'connected' ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {connectionStatus?.status === 'connected' ? 'Connected' : 'Disconnected'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Reports Section */}
      <div className={activeSection === "reports" ? "space-y-6" : "hidden"}>
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Reports & Analytics</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button>Generate Report</Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Fleet Utilization</CardTitle>
              <CardDescription>Vehicle usage efficiency metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] flex items-center justify-center bg-muted/20 rounded-lg">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Utilization Chart</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Costs</CardTitle>
              <CardDescription>Cost analysis over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] flex items-center justify-center bg-muted/20 rounded-lg">
                <div className="text-center">
                  <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Cost Chart</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>Overall fleet performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] flex items-center justify-center bg-muted/20 rounded-lg">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Performance Chart</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
