
"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  Settings,
  Eye,
  Edit,
  Plus,
  Mail,
  MapPin,
  BarChart3,
} from "lucide-react"

interface Workshop {
  id: string
  name: string
  representativeName: string
  email: string
  phone: string
  city: string
  country: string
  serviceTypes: string[]
  rating: number
  reviewCount: number
  status: "active" | "pending" | "suspended"
  joinDate: string
  activationFee: number
  totalRevenue: number
  connectedVehicles: number
  lastActivity: string
  verified: boolean
}

interface ServiceFee {
  id: string
  name: string
  defaultFee: number
  customFees: Record<string, number>
}

const mockWorkshops: Workshop[] = [
  {
    id: "ws-1",
    name: "AutoCare Plus",
    representativeName: "John Martinez",
    email: "john@autocareplus.com",
    phone: "+1 (555) 123-4567",
    city: "New York",
    country: "United States",
    serviceTypes: ["General Maintenance", "Electrical Services"],
    rating: 4.8,
    reviewCount: 124,
    status: "active",
    joinDate: "2023-01-15",
    activationFee: 149.99,
    totalRevenue: 8950.5,
    connectedVehicles: 45,
    lastActivity: "2024-03-14",
    verified: true,
  },
  {
    id: "ws-2",
    name: "Fleet Masters",
    representativeName: "Sarah Johnson",
    email: "sarah@fleetmasters.com",
    phone: "+1 (555) 987-6543",
    city: "Los Angeles",
    country: "United States",
    serviceTypes: ["General Maintenance", "Mechanical Services"],
    rating: 4.6,
    reviewCount: 98,
    status: "pending",
    joinDate: "2024-03-01",
    activationFee: 199.99,
    totalRevenue: 0,
    connectedVehicles: 0,
    lastActivity: "2024-03-10",
    verified: false,
  },
  {
    id: "ws-3",
    name: "QuickLube Commercial",
    representativeName: "Mike Chen",
    email: "mike@quicklube.com",
    phone: "+1 (555) 456-7890",
    city: "Chicago",
    country: "United States",
    serviceTypes: ["General Maintenance", "Tire Services"],
    rating: 4.3,
    reviewCount: 76,
    status: "suspended",
    joinDate: "2023-06-10",
    activationFee: 99.99,
    totalRevenue: 3240.75,
    connectedVehicles: 12,
    lastActivity: "2024-02-28",
    verified: true,
  },
]

const mockServiceFees: ServiceFee[] = [
  {
    id: "maintenance",
    name: "General Maintenance",
    defaultFee: 99.99,
    customFees: { "ws-1": 149.99, "ws-3": 99.99 },
  },
  {
    id: "mechanical",
    name: "Mechanical Services",
    defaultFee: 149.99,
    customFees: { "ws-2": 199.99 },
  },
  {
    id: "electrical",
    name: "Electrical Services",
    defaultFee: 129.99,
    customFees: { "ws-1": 149.99 },
  },
  {
    id: "diagnostics",
    name: "Diagnostics",
    defaultFee: 79.99,
    customFees: {},
  },
]

export function AdminWorkshopManagement() {
  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null)
  const [showWorkshopDetails, setShowWorkshopDetails] = useState(false)
  const [showFeeSettings, setShowFeeSettings] = useState(false)
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [serviceFees, setServiceFees] = useState(mockServiceFees)
  const [approvalAction, setApprovalAction] = useState<"approve" | "reject" | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending Approval</Badge>
      case "suspended":
        return <Badge variant="destructive">Suspended</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const handleWorkshopAction = (workshop: Workshop, action: "approve" | "reject" | "suspend" | "activate") => {
    setSelectedWorkshop(workshop)
    if (action === "approve" || action === "reject") {
      setApprovalAction(action)
      setShowApprovalDialog(true)
    } else {
      // Handle suspend/activate directly
      console.log(`${action} workshop:`, workshop.id)
    }
  }

  const handleApprovalSubmit = () => {
    if (selectedWorkshop && approvalAction) {
      console.log(`${approvalAction} workshop:`, selectedWorkshop.id, rejectionReason)
      setShowApprovalDialog(false)
      setRejectionReason("")
      setApprovalAction(null)
      setSelectedWorkshop(null)
    }
  }

  const handleFeeUpdate = (serviceId: string, workshopId: string, newFee: number) => {
    setServiceFees((prev) =>
      prev.map((service) =>
        service.id === serviceId
          ? {
              ...service,
              customFees: { ...service.customFees, [workshopId]: newFee },
            }
          : service,
      ),
    )
  }

  const totalRevenue = mockWorkshops.reduce((sum, workshop) => sum + workshop.totalRevenue, 0)
  const activeWorkshops = mockWorkshops.filter((w) => w.status === "active").length
  const pendingApprovals = mockWorkshops.filter((w) => w.status === "pending").length
  const totalVehicles = mockWorkshops.reduce((sum, workshop) => sum + workshop.connectedVehicles, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Workshop Management</h2>
          <p className="text-muted-foreground">Manage workshop registrations, approvals, and fee structures</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowFeeSettings(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Fee Settings
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Workshop
          </Button>
        </div>
      </div>

      {/* Admin Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Workshops</CardTitle>
            <Building2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockWorkshops.length}</div>
            <p className="text-xs text-muted-foreground">{activeWorkshops} active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingApprovals}</div>
            <p className="text-xs text-muted-foreground">Require review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From activation fees</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected Vehicles</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVehicles}</div>
            <p className="text-xs text-muted-foreground">Across all workshops</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="workshops" className="w-full">
        <TabsList>
          <TabsTrigger value="workshops">Workshop Directory</TabsTrigger>
          <TabsTrigger value="approvals">
            Pending Approvals
            {pendingApprovals > 0 && <Badge className="ml-2 bg-yellow-100 text-yellow-800">{pendingApprovals}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="workshops" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Workshops</CardTitle>
              <CardDescription>Manage all registered workshops on the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Workshop</TableHead>
                    <TableHead>Representative</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Services</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Vehicles</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockWorkshops.map((workshop) => (
                    <TableRow key={workshop.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 rounded-md">
                            <AvatarImage src="/placeholder.svg" alt={workshop.name} />
                            <AvatarFallback className="rounded-md text-xs">
                              {workshop.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium flex items-center gap-1">
                              {workshop.name}
                              {workshop.verified && <CheckCircle className="h-3 w-3 text-blue-500 fill-blue-500" />}
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                              {workshop.rating} ({workshop.reviewCount})
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{workshop.representativeName}</div>
                          <div className="text-sm text-muted-foreground">{workshop.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div>{workshop.city}</div>
                          <div className="text-sm text-muted-foreground">{workshop.country}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {workshop.serviceTypes.slice(0, 2).map((service, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {service}
                            </Badge>
                          ))}
                          {workshop.serviceTypes.length > 2 && (
                            <span className="text-xs text-muted-foreground">+{workshop.serviceTypes.length - 2}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(workshop.status)}</TableCell>
                      <TableCell>${workshop.totalRevenue.toLocaleString()}</TableCell>
                      <TableCell>{workshop.connectedVehicles}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedWorkshop(workshop)
                              setShowWorkshopDetails(true)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          {workshop.status === "active" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleWorkshopAction(workshop, "suspend")}
                            >
                              <XCircle className="h-4 w-4 text-red-500" />
                            </Button>
                          ) : workshop.status === "suspended" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleWorkshopAction(workshop, "activate")}
                            >
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approvals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Workshop Approvals</CardTitle>
              <CardDescription>Review and approve new workshop registrations</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingApprovals > 0 ? (
                <div className="space-y-4">
                  {mockWorkshops
                    .filter((w) => w.status === "pending")
                    .map((workshop) => (
                      <Card key={workshop.id} className="border-yellow-200">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-12 w-12 rounded-md">
                                <AvatarImage src="/placeholder.svg" alt={workshop.name} />
                                <AvatarFallback className="rounded-md">
                                  {workshop.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="font-semibold text-lg">{workshop.name}</h3>
                                <div className="space-y-1 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-2">
                                    <Users className="h-3 w-3" />
                                    {workshop.representativeName}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Mail className="h-3 w-3" />
                                    {workshop.email}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-3 w-3" />
                                    {workshop.city}, {workshop.country}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setSelectedWorkshop(workshop)
                                  setShowWorkshopDetails(true)
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Review Details
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => handleWorkshopAction(workshop, "reject")}
                                className="text-red-600 hover:text-red-700"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </Button>
                              <Button onClick={() => handleWorkshopAction(workshop, "approve")}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve
                              </Button>
                            </div>
                          </div>
                          <div className="mt-4">
                            <div className="flex flex-wrap gap-2">
                              {workshop.serviceTypes.map((service, index) => (
                                <Badge key={index} variant="outline">
                                  {service}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No pending approvals</p>
                  <p className="text-sm">All workshop registrations have been reviewed</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Month</CardTitle>
                <CardDescription>Workshop activation fee revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  <BarChart3 className="h-8 w-8 mr-2" />
                  Revenue Chart Placeholder
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Workshop Growth</CardTitle>
                <CardDescription>New workshop registrations over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  <TrendingUp className="h-8 w-8 mr-2" />
                  Growth Chart Placeholder
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top Performing Workshops</CardTitle>
              <CardDescription>Workshops ranked by revenue and vehicle connections</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Workshop</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Vehicles</TableHead>
                    <TableHead>Rating</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockWorkshops
                    .filter((w) => w.status === "active")
                    .sort((a, b) => b.totalRevenue - a.totalRevenue)
                    .map((workshop, index) => (
                      <TableRow key={workshop.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6 rounded-md">
                              <AvatarImage src="/placeholder.svg" alt={workshop.name} />
                              <AvatarFallback className="rounded-md text-xs">
                                {workshop.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            {workshop.name}
                          </div>
                        </TableCell>
                        <TableCell>${workshop.totalRevenue.toLocaleString()}</TableCell>
                        <TableCell>{workshop.connectedVehicles}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                            {workshop.rating}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Workshop Details Dialog */}
      <Dialog open={showWorkshopDetails} onOpenChange={setShowWorkshopDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedWorkshop && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {selectedWorkshop.name} - Admin Review
                </DialogTitle>
                <DialogDescription>Complete workshop information for administrative review</DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Workshop Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">Status</Label>
                        <div className="mt-1">{getStatusBadge(selectedWorkshop.status)}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Join Date</Label>
                        <div className="mt-1">{selectedWorkshop.joinDate}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Activation Fee</Label>
                        <div className="mt-1">${selectedWorkshop.activationFee}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Total Revenue</Label>
                        <div className="mt-1">${selectedWorkshop.totalRevenue.toLocaleString()}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Connected Vehicles</Label>
                        <div className="mt-1">{selectedWorkshop.connectedVehicles}</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">Representative</Label>
                        <div className="mt-1">{selectedWorkshop.representativeName}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Email</Label>
                        <div className="mt-1">{selectedWorkshop.email}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Phone</Label>
                        <div className="mt-1">{selectedWorkshop.phone}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Location</Label>
                        <div className="mt-1">
                          {selectedWorkshop.city}, {selectedWorkshop.country}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Service Types</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {selectedWorkshop.serviceTypes.map((service, index) => (
                        <Badge key={index} variant="outline">
                          {service}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setShowWorkshopDetails(false)}>
                    Close
                  </Button>
                  {selectedWorkshop.status === "pending" && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => handleWorkshopAction(selectedWorkshop, "reject")}
                        className="text-red-600 hover:text-red-700"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                      <Button onClick={() => handleWorkshopAction(selectedWorkshop, "approve")}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve Workshop
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Approval/Rejection Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{approvalAction === "approve" ? "Approve Workshop" : "Reject Workshop"}</DialogTitle>
            <DialogDescription>
              {approvalAction === "approve"
                ? "Confirm workshop approval and activation"
                : "Provide a reason for workshop rejection"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedWorkshop && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="font-medium">{selectedWorkshop.name}</div>
                <div className="text-sm text-muted-foreground">{selectedWorkshop.representativeName}</div>
              </div>
            )}

            {approvalAction === "reject" && (
              <div className="space-y-2">
                <Label htmlFor="rejection-reason">Reason for Rejection *</Label>
                <Textarea
                  id="rejection-reason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a detailed reason for rejecting this workshop application..."
                  rows={4}
                  required
                />
              </div>
            )}

            {approvalAction === "approve" && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch id="send-welcome" defaultChecked />
                  <Label htmlFor="send-welcome">Send welcome email to workshop</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="auto-verify" defaultChecked />
                  <Label htmlFor="auto-verify">Mark as verified workshop</Label>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleApprovalSubmit}
              variant={approvalAction === "reject" ? "destructive" : "default"}
              disabled={approvalAction === "reject" && !rejectionReason.trim()}
            >
              {approvalAction === "approve" ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Workshop
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Workshop
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fee Settings Dialog */}
      <Dialog open={showFeeSettings} onOpenChange={setShowFeeSettings}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Service Fee Management</DialogTitle>
            <DialogDescription>Configure activation fees for different service categories</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {serviceFees.map((service) => (
              <Card key={service.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{service.name}</CardTitle>
                  <CardDescription>Default fee: ${service.defaultFee}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Default Activation Fee</Label>
                      <div className="flex items-center gap-2">
                        <span>$</span>
                        <Input
                          type="number"
                          step="0.01"
                          className="w-24"
                          value={service.defaultFee}
                          onChange={(e) => {
                            const newFee = Number.parseFloat(e.target.value)
                            setServiceFees((prev) =>
                              prev.map((s) => (s.id === service.id ? { ...s, defaultFee: newFee } : s)),
                            )
                          }}
                        />
                      </div>
                    </div>

                    {Object.keys(service.customFees).length > 0 && (
                      <div>
                        <Label className="text-sm font-medium">Custom Workshop Fees</Label>
                        <div className="mt-2 space-y-2">
                          {Object.entries(service.customFees).map(([workshopId, fee]) => {
                            const workshop = mockWorkshops.find((w) => w.id === workshopId)
                            return (
                              <div key={workshopId} className="flex items-center justify-between text-sm">
                                <span>{workshop?.name || workshopId}</span>
                                <div className="flex items-center gap-2">
                                  <span>$</span>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    className="w-20 h-8"
                                    value={fee}
                                    onChange={(e) =>
                                      handleFeeUpdate(service.id, workshopId, Number.parseFloat(e.target.value))
                                    }
                                  />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowFeeSettings(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowFeeSettings(false)}>
              <Settings className="h-4 w-4 mr-2" />
              Save Fee Settings
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
