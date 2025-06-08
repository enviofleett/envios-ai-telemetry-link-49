
"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Building2,
  Car,
  CreditCard,
  Calendar,
  DollarSign,
  CheckCircle,
  Star,
  MapPin,
  Clock,
  AlertCircle,
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
  activationFee: number
  operatingHours: string
  verified: boolean
}

interface Vehicle {
  id: string
  plateNumber: string
  model: string
  year: number
  status: "active" | "inactive" | "maintenance"
}

interface ConnectionData {
  workshopId: string
  selectedVehicles: string[]
  billingCycle: "quarterly" | "yearly"
  paymentMethod: string
  totalAmount: number
}

interface WorkshopConnectionProps {
  workshop: Workshop
  userVehicles: Vehicle[]
  isOpen: boolean
  onClose: () => void
  onConnect: (data: ConnectionData) => void
}

export function WorkshopConnection({ workshop, userVehicles, isOpen, onClose, onConnect }: WorkshopConnectionProps) {
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([])
  const [billingCycle, setBillingCycle] = useState<"quarterly" | "yearly">("quarterly")
  const [paymentMethod, setPaymentMethod] = useState("")
  const [cardNumber, setCardNumber] = useState("")
  const [expiryDate, setExpiryDate] = useState("")
  const [cvv, setCvv] = useState("")
  const [cardName, setCardName] = useState("")
  const [step, setStep] = useState(1)

  const handleVehicleSelection = (vehicleId: string, checked: boolean) => {
    setSelectedVehicles((prev) => (checked ? [...prev, vehicleId] : prev.filter((id) => id !== vehicleId)))
  }

  const calculateTotal = () => {
    const baseAmount = workshop.activationFee * selectedVehicles.length
    const discount = billingCycle === "yearly" ? 0.15 : 0 // 15% discount for yearly
    const discountAmount = baseAmount * discount
    return baseAmount - discountAmount
  }

  const handleConnect = () => {
    const connectionData: ConnectionData = {
      workshopId: workshop.id,
      selectedVehicles,
      billingCycle,
      paymentMethod,
      totalAmount: calculateTotal(),
    }
    onConnect(connectionData)
    onClose()
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${i < Math.floor(rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
          />
        ))}
        <span className="ml-1 text-sm text-muted-foreground">{rating.toFixed(1)}</span>
      </div>
    )
  }

  const getVehicleStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case "inactive":
        return <Badge variant="outline">Inactive</Badge>
      case "maintenance":
        return <Badge className="bg-orange-100 text-orange-800">In Maintenance</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Connect to {workshop.name}
          </DialogTitle>
          <DialogDescription>Connect your vehicles to this workshop for maintenance services</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Workshop Summary */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 rounded-md">
                  <AvatarImage src="/placeholder.svg" alt={workshop.name} />
                  <AvatarFallback className="rounded-md">
                    {workshop.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">{workshop.name}</h3>
                    {workshop.verified && <CheckCircle className="h-4 w-4 text-blue-500 fill-blue-500" />}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {workshop.city}, {workshop.country}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {workshop.operatingHours}
                    </div>
                  </div>
                  {renderStars(workshop.rating)}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {workshop.serviceTypes.map((service, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {service}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Activation Fee</div>
                  <div className="text-2xl font-bold">${workshop.activationFee}</div>
                  <div className="text-xs text-muted-foreground">per vehicle</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {step === 1 && (
            <>
              {/* Vehicle Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="h-5 w-5" />
                    Select Vehicles
                  </CardTitle>
                  <CardDescription>Choose which vehicles you want to connect to this workshop</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {userVehicles.length > 0 ? (
                    userVehicles.map((vehicle) => (
                      <div key={vehicle.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                        <Checkbox
                          id={vehicle.id}
                          checked={selectedVehicles.includes(vehicle.id)}
                          onCheckedChange={(checked) => handleVehicleSelection(vehicle.id, checked as boolean)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{vehicle.plateNumber}</div>
                              <div className="text-sm text-muted-foreground">
                                {vehicle.model} ({vehicle.year})
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getVehicleStatusBadge(vehicle.status)}
                              <span className="text-sm font-medium">${workshop.activationFee}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Car className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No vehicles available</p>
                      <p className="text-sm">Add vehicles to your fleet to connect them to workshops</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Billing Cycle */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Billing Cycle
                  </CardTitle>
                  <CardDescription>Choose how often you want to be billed</CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={billingCycle} onValueChange={(value: any) => setBillingCycle(value)}>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg">
                      <RadioGroupItem value="quarterly" id="quarterly" />
                      <Label htmlFor="quarterly" className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">Quarterly Billing</div>
                            <div className="text-sm text-muted-foreground">Billed every 3 months</div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">Standard Rate</div>
                            <div className="text-sm text-muted-foreground">No discount</div>
                          </div>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg">
                      <RadioGroupItem value="yearly" id="yearly" />
                      <Label htmlFor="yearly" className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">Yearly Billing</div>
                            <div className="text-sm text-muted-foreground">Billed annually</div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-green-600">15% Discount</div>
                            <div className="text-sm text-muted-foreground">Save on annual payment</div>
                          </div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* Cost Summary */}
              {selectedVehicles.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Cost Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span>Base cost ({selectedVehicles.length} vehicles)</span>
                      <span>${(workshop.activationFee * selectedVehicles.length).toFixed(2)}</span>
                    </div>
                    {billingCycle === "yearly" && (
                      <div className="flex justify-between text-green-600">
                        <span>Annual discount (15%)</span>
                        <span>-${(workshop.activationFee * selectedVehicles.length * 0.15).toFixed(2)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total ({billingCycle})</span>
                      <span>${calculateTotal().toFixed(2)}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {billingCycle === "quarterly" ? "Charged every 3 months" : "Charged annually"}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {step === 2 && (
            <>
              {/* Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Information
                  </CardTitle>
                  <CardDescription>Enter your payment details to complete the connection</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="payment-method">Payment Method</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="credit-card">Credit Card</SelectItem>
                        <SelectItem value="debit-card">Debit Card</SelectItem>
                        <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(paymentMethod === "credit-card" || paymentMethod === "debit-card") && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="card-name">Cardholder Name</Label>
                        <Input
                          id="card-name"
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                          placeholder="John Doe"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="card-number">Card Number</Label>
                        <Input
                          id="card-number"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          placeholder="1234 5678 9012 3456"
                        />
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="expiry">Expiry Date</Label>
                          <Input
                            id="expiry"
                            value={expiryDate}
                            onChange={(e) => setExpiryDate(e.target.value)}
                            placeholder="MM/YY"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cvv">CVV</Label>
                          <Input id="cvv" value={cvv} onChange={(e) => setCvv(e.target.value)} placeholder="123" />
                        </div>
                      </div>
                    </>
                  )}

                  {paymentMethod === "bank-transfer" && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-blue-900">Bank Transfer Instructions</h4>
                          <p className="text-sm text-blue-700 mt-1">
                            You will receive bank transfer details via email after confirming this connection. Your
                            workshop connection will be activated once payment is received.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Final Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Connection Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h4 className="font-medium mb-2">Workshop</h4>
                      <div className="text-sm text-muted-foreground">{workshop.name}</div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Vehicles ({selectedVehicles.length})</h4>
                      <div className="text-sm text-muted-foreground">
                        {selectedVehicles.map((id) => userVehicles.find((v) => v.id === id)?.plateNumber).join(", ")}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Billing Cycle</h4>
                      <div className="text-sm text-muted-foreground capitalize">{billingCycle}</div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Total Amount</h4>
                      <div className="text-lg font-semibold">${calculateTotal().toFixed(2)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <div className="flex gap-2">
              {step === 2 && (
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
              )}
              {step === 1 ? (
                <Button onClick={() => setStep(2)} disabled={selectedVehicles.length === 0}>
                  Continue to Payment
                </Button>
              ) : (
                <Button
                  onClick={handleConnect}
                  disabled={!paymentMethod || (paymentMethod !== "bank-transfer" && (!cardNumber || !cardName))}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Connect Workshop
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
