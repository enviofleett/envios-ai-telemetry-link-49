
"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Car, CalendarIcon, Users, TrendingUp, Plus, Mail, Phone, Wrench, FileText } from "lucide-react"

interface VehicleActivation {
  id: string
  vehicleId: string
  plateNumber: string
  model: string
  ownerName: string
  activationDate: string
  status: "active" | "pending" | "expired"
  nextInspection?: string
}

interface Appointment {
  id: string
  vehicleId: string
  plateNumber: string
  model: string
  serviceType: string
  scheduledDate: string
  scheduledTime: string
  status: "scheduled" | "in-progress" | "completed" | "cancelled"
  estimatedDuration: string
  notes?: string
}

interface Inspector {
  id: string
  name: string
  email: string
  phone: string
  certifications: string[]
  joinDate: string
  status: "active" | "inactive"
}

const mockActivations: VehicleActivation[] = [
  {
    id: "act-1",
    vehicleId: "FL-001",
    plateNumber: "ABC-1234",
    model: "Ford Transit 2022",
    ownerName: "John Smith",
    activationDate: "2024-03-01",
    status: "active",
    nextInspection: "2024-04-15",
  },
  {
    id: "act-2",
    vehicleId: "FL-002",
    plateNumber: "XYZ-5678",
    model: "Mercedes Sprinter 2023",
    ownerName: "Sarah Johnson",
    activationDate: "2024-03-05",
    status: "active",
    nextInspection: "2024-04-20",
  },
  {
    id: "act-3",
    vehicleId: "FL-003",
    plateNumber: "DEF-9012",
    model: "Iveco Daily 2021",
    ownerName: "Mike Wilson",
    activationDate: "2024-03-10",
    status: "pending",
  },
]

const mockAppointments: Appointment[] = [
  {
    id: "apt-1",
    vehicleId: "FL-001",
    plateNumber: "ABC-1234",
    model: "Ford Transit 2022",
    serviceType: "General Maintenance",
    scheduledDate: "2024-03-15",
    scheduledTime: "09:00",
    status: "scheduled",
    estimatedDuration: "2 hours",
    notes: "Oil change and brake inspection",
  },
  {
    id: "apt-2",
    vehicleId: "FL-002",
    plateNumber: "XYZ-5678",
    model: "Mercedes Sprinter 2023",
    serviceType: "Electrical Diagnostics",
    scheduledDate: "2024-03-16",
    scheduledTime: "14:00",
    status: "scheduled",
    estimatedDuration: "1.5 hours",
  },
  {
    id: "apt-3",
    vehicleId: "FL-003",
    plateNumber: "DEF-9012",
    model: "Iveco Daily 2021",
    serviceType: "Engine Repair",
    scheduledDate: "2024-03-18",
    scheduledTime: "10:00",
    status: "in-progress",
    estimatedDuration: "4 hours",
    notes: "Engine warning light investigation",
  },
]

const mockInspectors: Inspector[] = [
  {
    id: "insp-1",
    name: "Robert Martinez",
    email: "robert@workshop.com",
    phone: "+1 (555) 123-4567",
    certifications: ["ASE Certified", "Electrical Systems"],
    joinDate: "2023-01-15",
    status: "active",
  },
  {
    id: "insp-2",
    name: "Lisa Chen",
    email: "lisa@workshop.com",
    phone: "+1 (555) 987-6543",
    certifications: ["Diesel Specialist", "Safety Inspector"],
    joinDate: "2023-06-01",
    status: "active",
  },
]

export function WorkshopDashboard() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [showAddInspector, setShowAddInspector] = useState(false)
  const [newInspector, setNewInspector] = useState({
    name: "",
    email: "",
    phone: "",
    certifications: "",
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "expired":
        return <Badge variant="destructive">Expired</Badge>
      case "scheduled":
        return <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>
      case "in-progress":
        return <Badge className="bg-orange-100 text-orange-800">In Progress</Badge>
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const handleAddInspector = () => {
    // In a real app, this would make an API call
    console.log("Adding inspector:", newInspector)
    setShowAddInspector(false)
    setNewInspector({ name: "", email: "", phone: "", certifications: "" })
  }

  const todayAppointments = mockAppointments.filter(
    (apt) => apt.scheduledDate === new Date().toISOString().split("T")[0],
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Workshop Dashboard</h2>
          <p className="text-muted-foreground">Manage your workshop operations and vehicle inspections</p>
        </div>
        <Button onClick={() => (window.location.href = "#inspection")}>
          <FileText className="h-4 w-4 mr-2" />
          Vehicle Inspection
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Vehicles</CardTitle>
            <Car className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockActivations.filter((a) => a.status === "active").length}</div>
            <p className="text-xs text-muted-foreground">
              +{mockActivations.filter((a) => a.activationDate >= "2024-03-01").length} this month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
            <CalendarIcon className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayAppointments.length}</div>
            <p className="text-xs text-muted-foreground">
              {mockAppointments.filter((a) => a.status === "scheduled").length} scheduled total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inspectors</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockInspectors.filter((i) => i.status === "active").length}</div>
            <p className="text-xs text-muted-foreground">Active inspectors</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$12,450</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activations">Vehicle Activations</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="inspectors">Inspectors</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Calendar */}
            <Card>
              <CardHeader>
                <CardTitle>Appointment Calendar</CardTitle>
                <CardDescription>View and manage upcoming appointments</CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest vehicle activations and appointments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockActivations.slice(0, 3).map((activation) => (
                    <div key={activation.id} className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <Car className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activation.plateNumber} activated</p>
                        <p className="text-xs text-muted-foreground">{activation.activationDate}</p>
                      </div>
                      {getStatusBadge(activation.status)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Today's Appointments */}
          <Card>
            <CardHeader>
              <CardTitle>Today's Schedule</CardTitle>
              <CardDescription>Appointments scheduled for today</CardDescription>
            </CardHeader>
            <CardContent>
              {todayAppointments.length > 0 ? (
                <div className="space-y-3">
                  {todayAppointments.map((appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Wrench className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {appointment.plateNumber} - {appointment.serviceType}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {appointment.scheduledTime} • {appointment.estimatedDuration}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(appointment.status)}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No appointments scheduled for today</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Activations</CardTitle>
              <CardDescription>Vehicles connected to your workshop</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Activation Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Next Inspection</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockActivations.map((activation) => (
                    <TableRow key={activation.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{activation.plateNumber}</div>
                          <div className="text-sm text-muted-foreground">{activation.model}</div>
                        </div>
                      </TableCell>
                      <TableCell>{activation.ownerName}</TableCell>
                      <TableCell>{activation.activationDate}</TableCell>
                      <TableCell>{getStatusBadge(activation.status)}</TableCell>
                      <TableCell>{activation.nextInspection || "Not scheduled"}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          <FileText className="h-4 w-4 mr-2" />
                          Inspect
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appointments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appointment Management</CardTitle>
              <CardDescription>View and manage all workshop appointments</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Service Type</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockAppointments.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{appointment.plateNumber}</div>
                          <div className="text-sm text-muted-foreground">{appointment.model}</div>
                        </div>
                      </TableCell>
                      <TableCell>{appointment.serviceType}</TableCell>
                      <TableCell>
                        <div>
                          <div>{appointment.scheduledDate}</div>
                          <div className="text-sm text-muted-foreground">{appointment.scheduledTime}</div>
                        </div>
                      </TableCell>
                      <TableCell>{appointment.estimatedDuration}</TableCell>
                      <TableCell>{getStatusBadge(appointment.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                          <Button variant="outline" size="sm">
                            <FileText className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inspectors" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Workshop Inspectors</h3>
            <Button onClick={() => setShowAddInspector(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Inspector
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mockInspectors.map((inspector) => (
              <Card key={inspector.id}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={`/placeholder.svg?height=40&width=40`} />
                      <AvatarFallback>
                        {inspector.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">{inspector.name}</CardTitle>
                      <CardDescription>{getStatusBadge(inspector.status)}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{inspector.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{inspector.phone}</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-1">Certifications</h4>
                    <div className="flex flex-wrap gap-1">
                      {inspector.certifications.map((cert, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">Joined: {inspector.joinDate}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Inspector Dialog */}
      <Dialog open={showAddInspector} onOpenChange={setShowAddInspector}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Inspector</DialogTitle>
            <DialogDescription>Create a new inspector account for your workshop</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={newInspector.name}
                onChange={(e) => setNewInspector((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Enter inspector's full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={newInspector.email}
                onChange={(e) => setNewInspector((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="inspector@workshop.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={newInspector.phone}
                onChange={(e) => setNewInspector((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="certifications">Certifications</Label>
              <Input
                id="certifications"
                value={newInspector.certifications}
                onChange={(e) => setNewInspector((prev) => ({ ...prev, certifications: e.target.value }))}
                placeholder="ASE Certified, Electrical Systems, etc."
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowAddInspector(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddInspector}>
              <Plus className="h-4 w-4 mr-2" />
              Add Inspector
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
