
"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Building2, User, MapPin, Wrench, Car, Zap, Settings, Plus } from "lucide-react"

interface WorkshopFormData {
  workshopName: string
  description: string
  representativeName: string
  email: string
  phone: string
  address: string
  city: string
  country: string
  serviceTypes: string[]
  operatingHours: string
  certifications: string[]
  website?: string
}

interface ServiceType {
  id: string
  name: string
  icon: any
  activationFee: number
}

const serviceTypes: ServiceType[] = [
  { id: "maintenance", name: "General Maintenance", icon: Wrench, activationFee: 99.99 },
  { id: "mechanical", name: "Mechanical Services", icon: Settings, activationFee: 149.99 },
  { id: "electrical", name: "Electrical Services", icon: Zap, activationFee: 129.99 },
  { id: "bodywork", name: "Body Work & Paint", icon: Car, activationFee: 199.99 },
  { id: "diagnostics", name: "Diagnostics", icon: Settings, activationFee: 79.99 },
  { id: "tires", name: "Tire Services", icon: Car, activationFee: 59.99 },
]

const countries = ["United States", "Canada", "United Kingdom", "Germany", "France", "Australia", "Japan", "Brazil"]

interface WorkshopRegistrationProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: WorkshopFormData) => void
  userRole: "admin" | "user"
}

export function WorkshopRegistration({ isOpen, onClose, onSubmit, userRole }: WorkshopRegistrationProps) {
  const [formData, setFormData] = useState<WorkshopFormData>({
    workshopName: "",
    description: "",
    representativeName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "",
    serviceTypes: [],
    operatingHours: "",
    certifications: [],
    website: "",
  })

  const [showActivationFees, setShowActivationFees] = useState(false)
  const [customActivationFees, setCustomActivationFees] = useState<Record<string, number>>({})

  const handleServiceTypeChange = (serviceTypeId: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      serviceTypes: checked
        ? [...prev.serviceTypes, serviceTypeId]
        : prev.serviceTypes.filter((id) => id !== serviceTypeId),
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    onClose()
  }

  const handleActivationFeeChange = (serviceTypeId: string, fee: number) => {
    setCustomActivationFees((prev) => ({
      ...prev,
      [serviceTypeId]: fee,
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Register New Workshop
          </DialogTitle>
          <DialogDescription>
            Add a new workshop to the platform. All workshops are subject to verification.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Workshop Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Workshop Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="workshopName">Workshop Name *</Label>
                  <Input
                    id="workshopName"
                    value={formData.workshopName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, workshopName: e.target.value }))}
                    placeholder="Enter workshop name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website (Optional)</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => setFormData((prev) => ({ ...prev, website: e.target.value }))}
                    placeholder="https://workshop-website.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Workshop Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your workshop services, experience, and specialties..."
                  rows={3}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="operatingHours">Operating Hours *</Label>
                <Input
                  id="operatingHours"
                  value={formData.operatingHours}
                  onChange={(e) => setFormData((prev) => ({ ...prev, operatingHours: e.target.value }))}
                  placeholder="e.g., Mon-Fri: 8AM-6PM, Sat: 9AM-3PM"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Representative Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Representative Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="representativeName">Representative Name *</Label>
                  <Input
                    id="representativeName"
                    value={formData.representativeName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, representativeName: e.target.value }))}
                    placeholder="Full name of workshop representative"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="+1 (555) 123-4567"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="contact@workshop.com"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Location Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Street Address *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                  placeholder="123 Workshop Street"
                  required
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                    placeholder="Enter city"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country *</Label>
                  <Select
                    value={formData.country}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, country: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Service Types */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Service Types *</CardTitle>
              <CardDescription>
                Select all service types your workshop provides. Each service type has an activation fee.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {serviceTypes.map((serviceType) => (
                  <div key={serviceType.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      id={serviceType.id}
                      checked={formData.serviceTypes.includes(serviceType.id)}
                      onCheckedChange={(checked) => handleServiceTypeChange(serviceType.id, checked as boolean)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <serviceType.icon className="h-4 w-4" />
                        <Label htmlFor={serviceType.id} className="font-medium">
                          {serviceType.name}
                        </Label>
                      </div>
                      <div className="text-sm text-muted-foreground">Activation Fee: ${serviceType.activationFee}</div>
                    </div>
                  </div>
                ))}
              </div>

              {userRole === "admin" && (
                <div className="pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowActivationFees(!showActivationFees)}>
                    <Settings className="h-4 w-4 mr-2" />
                    Configure Activation Fees
                  </Button>

                  {showActivationFees && (
                    <Card className="mt-4">
                      <CardHeader>
                        <CardTitle className="text-base">Admin: Custom Activation Fees</CardTitle>
                        <CardDescription>Set custom activation fees for this workshop</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {serviceTypes.map((serviceType) => (
                          <div key={serviceType.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <serviceType.icon className="h-4 w-4" />
                              <span className="text-sm">{serviceType.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">$</span>
                              <Input
                                type="number"
                                step="0.01"
                                className="w-20"
                                placeholder={serviceType.activationFee.toString()}
                                value={customActivationFees[serviceType.id] || ""}
                                onChange={(e) =>
                                  handleActivationFeeChange(serviceType.id, Number.parseFloat(e.target.value))
                                }
                              />
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Certifications */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Certifications (Optional)</CardTitle>
              <CardDescription>List any relevant certifications, licenses, or accreditations</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="e.g., ASE Certified, ISO 9001, Manufacturer Authorized, etc."
                value={formData.certifications.join(", ")}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    certifications: e.target.value
                      .split(",")
                      .map((cert) => cert.trim())
                      .filter((cert) => cert),
                  }))
                }
                rows={2}
              />
            </CardContent>
          </Card>

          {/* Submission */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              <Plus className="h-4 w-4 mr-2" />
              Register Workshop
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
