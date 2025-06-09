
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CreditCard, CheckCircle, ArrowRight, Calendar, Mail } from "lucide-react"

interface Vehicle {
  id: string
  plateNumber: string
  model: string
}

interface Workshop {
  id: string
  name: string
  logo?: string
  connectionFee: number
  verified: boolean
}

interface WorkshopActivationProps {
  workshop: Workshop
  vehicles: Vehicle[]
  onCancel: () => void
  onComplete: () => void
}

export function WorkshopActivation({ workshop, vehicles, onCancel, onComplete }: WorkshopActivationProps) {
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([])
  const [step, setStep] = useState<"select" | "payment" | "confirmation">("select")
  const [paymentMethod, setPaymentMethod] = useState<"credit" | "invoice">("credit")
  const [cardNumber, setCardNumber] = useState("")
  const [cardName, setCardName] = useState("")
  const [cardExpiry, setCardExpiry] = useState("")
  const [cardCvc, setCardCvc] = useState("")
  const [showConfirmation, setShowConfirmation] = useState(false)

  const totalFee = workshop.connectionFee * selectedVehicles.length

  const handleVehicleToggle = (vehicleId: string) => {
    setSelectedVehicles((prev) =>
      prev.includes(vehicleId) ? prev.filter((id) => id !== vehicleId) : [...prev, vehicleId],
    )
  }

  const handleContinue = () => {
    if (step === "select") {
      setStep("payment")
    } else if (step === "payment") {
      setStep("confirmation")
      setShowConfirmation(true)
    }
  }

  const handleBack = () => {
    if (step === "payment") {
      setStep("select")
    } else if (step === "confirmation") {
      setStep("payment")
    }
  }

  const handleComplete = () => {
    onComplete()
    setShowConfirmation(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 rounded-md">
            <AvatarImage src={workshop.logo || "/placeholder.svg"} alt={workshop.name} />
            <AvatarFallback className="rounded-md">
              {workshop.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-1">
              {workshop.name}
              {workshop.verified && <CheckCircle className="h-4 w-4 text-blue-500 fill-blue-500" />}
            </h3>
            <p className="text-sm text-muted-foreground">Workshop Activation</p>
          </div>
        </div>
        <Badge className="bg-blue-100 text-blue-800">Step {step === "select" ? "1/2" : "2/2"}</Badge>
      </div>

      <Separator />

      {step === "select" && (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Select Vehicles to Activate</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Choose which vehicles you want to activate with this workshop. A one-time connection fee of $
              {workshop.connectionFee.toFixed(2)} applies per vehicle.
            </p>

            <div className="space-y-2">
              {vehicles.map((vehicle) => (
                <div key={vehicle.id} className="flex items-center space-x-2 border p-3 rounded-lg">
                  <Checkbox
                    id={vehicle.id}
                    checked={selectedVehicles.includes(vehicle.id)}
                    onCheckedChange={() => handleVehicleToggle(vehicle.id)}
                  />
                  <div className="flex-1 grid gap-1.5">
                    <Label htmlFor={vehicle.id} className="font-medium">
                      {vehicle.plateNumber}
                    </Label>
                    <p className="text-sm text-muted-foreground">{vehicle.model}</p>
                  </div>
                  <div className="text-sm font-medium">${workshop.connectionFee.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-muted/20 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-medium">Total Connection Fee:</span>
              <span className="text-xl font-bold">${totalFee.toFixed(2)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              This is a one-time fee that activates your selected vehicles with {workshop.name} for priority service and
              special rates.
            </p>
          </div>
        </div>
      )}

      {step === "payment" && (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Payment Method</h4>
            <div className="flex gap-4 mb-4">
              <div
                className={`flex-1 border rounded-lg p-3 cursor-pointer ${
                  paymentMethod === "credit" ? "border-primary bg-primary/5" : ""
                }`}
                onClick={() => setPaymentMethod("credit")}
              >
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  <span className="font-medium">Credit Card</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Pay now with credit or debit card</p>
              </div>
              <div
                className={`flex-1 border rounded-lg p-3 cursor-pointer ${
                  paymentMethod === "invoice" ? "border-primary bg-primary/5" : ""
                }`}
                onClick={() => setPaymentMethod("invoice")}
              >
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  <span className="font-medium">Invoice</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Receive an invoice for payment later</p>
              </div>
            </div>

            {paymentMethod === "credit" && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="cardName">Cardholder Name</Label>
                  <Input
                    id="cardName"
                    placeholder="John Smith"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="cardExpiry">Expiry Date</Label>
                    <Input
                      id="cardExpiry"
                      placeholder="MM/YY"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="cardCvc">CVC</Label>
                    <Input
                      id="cardCvc"
                      placeholder="123"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === "invoice" && (
              <div className="border rounded-lg p-4 bg-muted/20">
                <p className="text-sm">
                  An invoice for ${totalFee.toFixed(2)} will be sent to your registered email address. Payment is due
                  within 30 days.
                </p>
              </div>
            )}
          </div>

          <div className="bg-muted/20 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-medium">Total Connection Fee:</span>
              <span className="text-xl font-bold">${totalFee.toFixed(2)}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              <p>
                Activating {selectedVehicles.length} vehicle(s) with {workshop.name}
              </p>
              <p className="mt-1">
                By proceeding, you agree to the workshop's terms of service and activation policies.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        {step === "select" ? (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        ) : (
          <Button variant="outline" onClick={handleBack}>
            Back
          </Button>
        )}
        <Button onClick={handleContinue} disabled={selectedVehicles.length === 0}>
          {step === "select" ? "Continue to Payment" : "Complete Activation"}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Activation Successful
            </DialogTitle>
            <DialogDescription>Your vehicles have been activated with the workshop</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <h4 className="font-medium">Activation Complete</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedVehicles.length} vehicle(s) activated with {workshop.name}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm">
                A confirmation email has been sent to your registered email address with all the details.
              </p>
              <p className="text-sm">
                You can now schedule maintenance appointments with {workshop.name} for your activated vehicles.
              </p>
            </div>

            <div className="flex items-center gap-2 p-3 border rounded-lg">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <h4 className="font-medium">Schedule Your First Appointment</h4>
                <p className="text-sm text-muted-foreground">Book a service appointment with your new workshop</p>
              </div>
              <Button variant="outline" size="sm" className="ml-auto">
                Schedule Now
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleComplete} className="w-full">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
