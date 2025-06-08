
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import {
  Store,
  Users,
  DollarSign,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  Settings,
  Eye,
  Mail,
  Phone,
  BarChart3,
  AlertTriangle,
  Search,
} from "lucide-react";

interface Merchant {
  id: string;
  fullName: string;
  brandName: string;
  email: string;
  phone: string;
  socialMedia: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  categories: string[];
  tags: string[];
  status: "pending" | "approved" | "rejected" | "suspended";
  joinDate: string;
  totalSales: number;
  totalOrders: number;
  rating: number;
  reviewCount: number;
  lastActive: string;
  rejectionReason?: string;
}

interface CommissionRate {
  category: string;
  rate: number;
}

const mockMerchants: Merchant[] = [
  {
    id: "merchant-1",
    fullName: "John Smith",
    brandName: "AutoCare Pro",
    email: "john@autocarepo.com",
    phone: "+1 (555) 123-4567",
    socialMedia: {
      facebook: "https://facebook.com/autocarepro",
      instagram: "https://instagram.com/autocarepro",
    },
    categories: ["Auto Parts & Accessories", "Security & Safety"],
    tags: ["brake service", "oil change", "car detailing"],
    status: "approved",
    joinDate: "2024-01-15",
    totalSales: 15420.5,
    totalOrders: 89,
    rating: 4.8,
    reviewCount: 67,
    lastActive: "2024-03-14",
  },
  {
    id: "merchant-2",
    fullName: "Sarah Johnson",
    brandName: "Smart Vehicle Solutions",
    email: "sarah@smartvehicle.com",
    phone: "+1 (555) 987-6543",
    socialMedia: {
      instagram: "https://instagram.com/smartvehicle",
      twitter: "https://twitter.com/smartvehicle",
    },
    categories: ["Smart Vehicle Gadgets"],
    tags: ["gps tracker", "dash cam", "vehicle monitoring"],
    status: "pending",
    joinDate: "2024-03-10",
    totalSales: 0,
    totalOrders: 0,
    rating: 0,
    reviewCount: 0,
    lastActive: "2024-03-12",
  },
  {
    id: "merchant-3",
    fullName: "Mike Wilson",
    brandName: "Fleet Support Services",
    email: "mike@fleetsupport.com",
    phone: "+1 (555) 456-7890",
    socialMedia: {
      facebook: "https://facebook.com/fleetsupport",
    },
    categories: ["Vehicle Ownership Support"],
    tags: ["insurance", "registration", "documentation"],
    status: "rejected",
    joinDate: "2024-02-28",
    totalSales: 0,
    totalOrders: 0,
    rating: 0,
    reviewCount: 0,
    lastActive: "2024-03-01",
    rejectionReason: "Incomplete documentation provided",
  },
];

const defaultCommissionRates: CommissionRate[] = [
  { category: "Auto Parts & Accessories", rate: 8.5 },
  { category: "Security & Safety", rate: 10.0 },
  { category: "Smart Vehicle Gadgets", rate: 12.0 },
  { category: "Vehicle Ownership Support", rate: 15.0 },
];

export const AdminMerchantManagement: React.FC = () => {
  const [merchants, setMerchants] = useState(mockMerchants);
  const [commissionRates, setCommissionRates] = useState(defaultCommissionRates);
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [showMerchantDetails, setShowMerchantDetails] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showCommissionSettings, setShowCommissionSettings] = useState(false);
  const [approvalAction, setApprovalAction] = useState<"approve" | "reject" | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending Approval</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "suspended":
        return <Badge className="bg-orange-100 text-orange-800">Suspended</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const handleMerchantAction = (merchant: Merchant, action: "approve" | "reject" | "suspend" | "activate") => {
    setSelectedMerchant(merchant);
    if (action === "approve" || action === "reject") {
      setApprovalAction(action);
      setShowApprovalDialog(true);
    } else {
      // Handle suspend/activate directly
      setMerchants((prev) =>
        prev.map((m) => (m.id === merchant.id ? { ...m, status: action === "suspend" ? "suspended" : "approved" } : m)),
      );
    }
  };

  const handleApprovalSubmit = () => {
    if (selectedMerchant && approvalAction) {
      setMerchants((prev) =>
        prev.map((m) =>
          m.id === selectedMerchant.id
            ? {
                ...m,
                status: approvalAction,
                rejectionReason: approvalAction === "reject" ? rejectionReason : undefined,
              }
            : m,
        ),
      );
      setShowApprovalDialog(false);
      setRejectionReason("");
      setApprovalAction(null);
      setSelectedMerchant(null);
    }
  };

  const handleCommissionUpdate = (category: string, newRate: number) => {
    setCommissionRates((prev) => prev.map((rate) => (rate.category === category ? { ...rate, rate: newRate } : rate)));
  };

  const filteredMerchants = merchants.filter(
    (merchant) =>
      merchant.brandName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      merchant.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      merchant.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const pendingCount = merchants.filter((m) => m.status === "pending").length;
  const approvedCount = merchants.filter((m) => m.status === "approved").length;
  const totalRevenue = merchants.reduce((sum, merchant) => sum + merchant.totalSales, 0);
  const totalCommission = commissionRates.reduce((sum, rate) => {
    const categoryRevenue = merchants
      .filter((m) => m.categories.includes(rate.category))
      .reduce((catSum, merchant) => catSum + merchant.totalSales, 0);
    return sum + (categoryRevenue * rate.rate) / 100;
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Merchant Management</h2>
          <p className="text-muted-foreground">Manage merchant registrations, approvals, and commission settings</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowCommissionSettings(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Commission Settings
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Merchants</CardTitle>
            <Store className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{merchants.length}</div>
            <p className="text-xs text-muted-foreground">{approvedCount} approved</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
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
            <p className="text-xs text-muted-foreground">Gross merchant sales</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commission Earned</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCommission.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Platform commission</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="merchants" className="w-full">
        <TabsList>
          <TabsTrigger value="merchants">All Merchants</TabsTrigger>
          <TabsTrigger value="approvals">
            Pending Approvals
            {pendingCount > 0 && <Badge className="ml-2 bg-yellow-100 text-yellow-800">{pendingCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="merchants" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search merchants..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Merchants</CardTitle>
              <CardDescription>Manage all registered merchants on the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Merchant</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Categories</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sales</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMerchants.map((merchant) => (
                    <TableRow key={merchant.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src="/placeholder.svg" alt={merchant.brandName} />
                            <AvatarFallback>
                              {merchant.brandName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{merchant.brandName}</div>
                            <div className="text-sm text-muted-foreground">{merchant.fullName}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm">{merchant.email}</div>
                          <div className="text-sm text-muted-foreground">{merchant.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {merchant.categories.slice(0, 2).map((category, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {category}
                            </Badge>
                          ))}
                          {merchant.categories.length > 2 && (
                            <span className="text-xs text-muted-foreground">+{merchant.categories.length - 2}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(merchant.status)}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">${merchant.totalSales.toLocaleString()}</div>
                          <div className="text-sm text-muted-foreground">{merchant.totalOrders} orders</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {merchant.rating > 0 ? (
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                            <span className="text-sm">{merchant.rating}</span>
                            <span className="text-xs text-muted-foreground">({merchant.reviewCount})</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">No reviews</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedMerchant(merchant);
                              setShowMerchantDetails(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {merchant.status === "pending" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMerchantAction(merchant, "approve")}
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMerchantAction(merchant, "reject")}
                                className="text-red-600 hover:text-red-700"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {merchant.status === "approved" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMerchantAction(merchant, "suspend")}
                              className="text-orange-600 hover:text-orange-700"
                            >
                              <AlertTriangle className="h-4 w-4" />
                            </Button>
                          )}
                          {merchant.status === "suspended" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMerchantAction(merchant, "activate")}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
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
              <CardTitle>Pending Merchant Approvals</CardTitle>
              <CardDescription>Review and approve new merchant registrations</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingCount > 0 ? (
                <div className="space-y-4">
                  {merchants
                    .filter((m) => m.status === "pending")
                    .map((merchant) => (
                      <Card key={merchant.id} className="border-yellow-200">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-12 w-12">
                                <AvatarImage src="/placeholder.svg" alt={merchant.brandName} />
                                <AvatarFallback>
                                  {merchant.brandName
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="font-semibold text-lg">{merchant.brandName}</h3>
                                <div className="space-y-1 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-2">
                                    <Users className="h-3 w-3" />
                                    {merchant.fullName}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Mail className="h-3 w-3" />
                                    {merchant.email}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Phone className="h-3 w-3" />
                                    {merchant.phone}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setSelectedMerchant(merchant);
                                  setShowMerchantDetails(true);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Review Details
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => handleMerchantAction(merchant, "reject")}
                                className="text-red-600 hover:text-red-700"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </Button>
                              <Button onClick={() => handleMerchantAction(merchant, "approve")}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve
                              </Button>
                            </div>
                          </div>
                          <div className="mt-4">
                            <div className="flex flex-wrap gap-2">
                              {merchant.categories.map((category, index) => (
                                <Badge key={index} variant="outline">
                                  {category}
                                </Badge>
                              ))}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-1">
                              {merchant.tags.map((tag, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {tag}
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
                  <p className="text-sm">All merchant registrations have been reviewed</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Category</CardTitle>
                <CardDescription>Sales performance across different categories</CardDescription>
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
                <CardTitle>Merchant Growth</CardTitle>
                <CardDescription>New merchant registrations over time</CardDescription>
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
              <CardTitle>Top Performing Merchants</CardTitle>
              <CardDescription>Merchants ranked by sales and performance</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Merchant</TableHead>
                    <TableHead>Sales</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Commission Earned</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {merchants
                    .filter((m) => m.status === "approved")
                    .sort((a, b) => b.totalSales - a.totalSales)
                    .map((merchant, index) => {
                      const commission = merchant.categories.reduce((sum, category) => {
                        const rate = commissionRates.find((r) => r.category === category)?.rate || 0;
                        return sum + (merchant.totalSales * rate) / 100;
                      }, 0);

                      return (
                        <TableRow key={merchant.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                                {index + 1}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src="/placeholder.svg" alt={merchant.brandName} />
                                <AvatarFallback className="text-xs">
                                  {merchant.brandName
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              {merchant.brandName}
                            </div>
                          </TableCell>
                          <TableCell>${merchant.totalSales.toLocaleString()}</TableCell>
                          <TableCell>{merchant.totalOrders}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                              {merchant.rating}
                            </div>
                          </TableCell>
                          <TableCell>${commission.toLocaleString()}</TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Merchant Details Dialog */}
      <Dialog open={showMerchantDetails} onOpenChange={setShowMerchantDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedMerchant && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  {selectedMerchant.brandName} - Admin Review
                </DialogTitle>
                <DialogDescription>Complete merchant information for administrative review</DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Merchant Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">Status</Label>
                        <div className="mt-1">{getStatusBadge(selectedMerchant.status)}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Full Name</Label>
                        <div className="mt-1">{selectedMerchant.fullName}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Brand Name</Label>
                        <div className="mt-1">{selectedMerchant.brandName}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Join Date</Label>
                        <div className="mt-1">{selectedMerchant.joinDate}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Last Active</Label>
                        <div className="mt-1">{selectedMerchant.lastActive}</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">Email</Label>
                        <div className="mt-1">{selectedMerchant.email}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Phone</Label>
                        <div className="mt-1">{selectedMerchant.phone}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Social Media</Label>
                        <div className="mt-1 space-y-1">
                          {selectedMerchant.socialMedia.facebook && (
                            <div className="text-sm">Facebook: {selectedMerchant.socialMedia.facebook}</div>
                          )}
                          {selectedMerchant.socialMedia.instagram && (
                            <div className="text-sm">Instagram: {selectedMerchant.socialMedia.instagram}</div>
                          )}
                          {selectedMerchant.socialMedia.twitter && (
                            <div className="text-sm">Twitter: {selectedMerchant.socialMedia.twitter}</div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Categories</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {selectedMerchant.categories.map((category, index) => (
                          <Badge key={index} variant="outline">
                            {category}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Tags</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {selectedMerchant.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Performance Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-4">
                    <div>
                      <Label className="text-sm font-medium">Total Sales</Label>
                      <div className="text-2xl font-bold">${selectedMerchant.totalSales.toLocaleString()}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Total Orders</Label>
                      <div className="text-2xl font-bold">{selectedMerchant.totalOrders}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Rating</Label>
                      <div className="text-2xl font-bold">{selectedMerchant.rating || "N/A"}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Reviews</Label>
                      <div className="text-2xl font-bold">{selectedMerchant.reviewCount}</div>
                    </div>
                  </CardContent>
                </Card>

                {selectedMerchant.status === "rejected" && selectedMerchant.rejectionReason && (
                  <Card className="border-red-200 bg-red-50">
                    <CardHeader>
                      <CardTitle className="text-lg text-red-800">Rejection Reason</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-red-700">{selectedMerchant.rejectionReason}</p>
                    </CardContent>
                  </Card>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setShowMerchantDetails(false)}>
                    Close
                  </Button>
                  {selectedMerchant.status === "pending" && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => handleMerchantAction(selectedMerchant, "reject")}
                        className="text-red-600 hover:text-red-700"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                      <Button onClick={() => handleMerchantAction(selectedMerchant, "approve")}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve Merchant
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
            <DialogTitle>{approvalAction === "approve" ? "Approve Merchant" : "Reject Merchant"}</DialogTitle>
            <DialogDescription>
              {approvalAction === "approve"
                ? "Confirm merchant approval and activation"
                : "Provide a reason for merchant rejection"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedMerchant && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="font-medium">{selectedMerchant.brandName}</div>
                <div className="text-sm text-muted-foreground">{selectedMerchant.fullName}</div>
                <div className="text-sm text-muted-foreground">{selectedMerchant.email}</div>
              </div>
            )}

            {approvalAction === "reject" && (
              <div className="space-y-2">
                <Label htmlFor="rejection-reason">Reason for Rejection *</Label>
                <Textarea
                  id="rejection-reason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a detailed reason for rejecting this merchant application..."
                  rows={4}
                  required
                />
              </div>
            )}

            {approvalAction === "approve" && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch id="send-welcome" defaultChecked />
                  <Label htmlFor="send-welcome">Send welcome email to merchant</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="auto-activate" defaultChecked />
                  <Label htmlFor="auto-activate">Automatically activate merchant account</Label>
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
                  Approve Merchant
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Merchant
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Commission Settings Dialog */}
      <Dialog open={showCommissionSettings} onOpenChange={setShowCommissionSettings}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Commission Rate Management</DialogTitle>
            <DialogDescription>
              Configure commission percentages for different product/service categories
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Category Commission Rates</CardTitle>
                <CardDescription>
                  Set the commission percentage that the platform earns from each category
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {commissionRates.map((rate) => (
                  <div key={rate.category} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{rate.category}</div>
                      <div className="text-sm text-muted-foreground">
                        Current revenue: $
                        {merchants
                          .filter((m) => m.categories.includes(rate.category))
                          .reduce((sum, m) => sum + m.totalSales, 0)
                          .toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        className="w-20 text-right"
                        value={rate.rate}
                        onChange={(e) => handleCommissionUpdate(rate.category, Number.parseFloat(e.target.value) || 0)}
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Commission Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-sm font-medium">Total Platform Revenue</Label>
                    <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Total Commission Earned</Label>
                    <div className="text-2xl font-bold text-green-600">${totalCommission.toLocaleString()}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowCommissionSettings(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowCommissionSettings(false)}>
              <Settings className="h-4 w-4 mr-2" />
              Save Commission Settings
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminMerchantManagement;
