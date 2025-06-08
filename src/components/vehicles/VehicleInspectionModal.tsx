
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Car, CheckCircle, AlertTriangle, XCircle, Calendar, Save, Send, BarChart3 } from 'lucide-react';

interface InspectionItem {
  id: string;
  category: string;
  item: string;
  rating: "ok" | "attention" | "immediate" | "na" | "";
  notes?: string;
}

interface InspectionData {
  vehicleId: string;
  plateNumber: string;
  model: string;
  mileage: number;
  engineHours?: number;
  inspectorId: string;
  inspectorName: string;
  inspectionDate: string;
  nextInspectionType: "mileage" | "engine-hours" | "date";
  nextInspectionValue: string;
  items: InspectionItem[];
  overallNotes: string;
}

interface VehicleInspectionModalProps {
  vehicle: any | null;
  isOpen: boolean;
  onClose: () => void;
}

const inspectionCategories = [
  {
    id: "exterior",
    name: "Exterior & Lighting",
    items: [
      "Headlights (High/Low Beam)",
      "Tail Lights", 
      "Brake Lights (incl. 3rd Brake Light)",
      "Turn Signals (Front/Rear)",
      "Hazard Lights",
      "Reverse Lights",
      "License Plate Lights",
      "Windshield Wipers & Blades",
      "Windshield & Windows (Chips/Cracks)",
      "Side Mirrors (Condition/Adjustment)",
      "Horn Operation",
      "Body Panels (Dents/Scratches/Rust)",
    ],
  },
  {
    id: "interior",
    name: "Interior & Safety",
    items: [
      "Dashboard Warning Lights",
      "Seatbelts (Functionality/Condition)",
      "Seats (Condition/Adjustment)",
      "HVAC (Heating, Ventilation, A/C)",
      "Power Windows/Locks",
      "Radio/Infotainment System",
      "Interior Lights",
    ],
  },
  {
    id: "tires",
    name: "Tires & Wheels",
    items: [
      "Tire Tread Depth (all tires)",
      "Tire Pressure (all tires)",
      "Tire Wear Pattern (Even/Uneven)",
      "Wheel Condition (Rims/Hubcaps)",
      "Spare Tire/Tire Repair Kit Condition",
    ],
  },
  {
    id: "underhood",
    name: "Under Hood (Fluids & Components)",
    items: [
      "Engine Oil Level & Condition",
      "Coolant Level & Condition",
      "Brake Fluid Level & Condition",
      "Power Steering Fluid Level & Condition",
      "Washer Fluid Level",
      "Battery (Terminals/Hold-down)",
      "Drive Belts (Cracks/Wear)",
      "Hoses (Leaks/Cracks)",
      "Air Filter Condition",
      "Fluid Leaks (visible)",
    ],
  },
  {
    id: "undervehicle",
    name: "Under Vehicle (Suspension, Steering, Brakes, Exhaust)",
    items: [
      "Suspension Components (Shocks/Struts/Springs)",
      "Steering Components (Tie Rods/Ball Joints)",
      "Brake Pads & Rotors (Front/Rear)",
      "Brake Lines & Hoses (Leaks/Cracks)",
      "Exhaust System (Leaks/Corrosion/Mounts)",
      "Underbody (Rust/Damage)",
    ],
  },
  {
    id: "roadtest",
    name: "Road Test",
    items: [
      "Engine Performance (Acceleration/Power)",
      "Transmission Shifting (Smoothness/Timing)",
      "Brake Operation (Stopping power/Noise/Pulling)",
      "Steering (Play/Pulling/Noise)",
      "Suspension (Ride Comfort/Noises over bumps)",
      "Unusual Noises/Vibrations",
    ],
  },
];

const VehicleInspectionModal: React.FC<VehicleInspectionModalProps> = ({
  vehicle,
  isOpen,
  onClose
}) => {
  const [inspectionData, setInspectionData] = useState<InspectionData>({
    vehicleId: vehicle?.deviceid || "",
    plateNumber: vehicle?.plateNumber || "",
    model: vehicle?.devicename || "",
    mileage: vehicle?.mileage || 0,
    engineHours: 0,
    inspectorId: "insp-1",
    inspectorName: "Robert Martinez",
    inspectionDate: new Date().toISOString().split("T")[0],
    nextInspectionType: "mileage",
    nextInspectionValue: "",
    items: [],
    overallNotes: "",
  });
  const [currentCategory, setCurrentCategory] = useState("exterior");

  // Initialize inspection items when component mounts
  React.useEffect(() => {
    if (vehicle && inspectionData.items.length === 0) {
      const items: InspectionItem[] = [];

      inspectionCategories.forEach((category) => {
        category.items.forEach((item) => {
          items.push({
            id: `${category.id}-${item.replace(/\s+/g, "-").toLowerCase()}`,
            category: category.id,
            item,
            rating: "",
            notes: "",
          });
        });
      });

      setInspectionData(prev => ({
        ...prev,
        vehicleId: vehicle.deviceid || "",
        plateNumber: vehicle.plateNumber || "",
        model: vehicle.devicename || "",
        mileage: vehicle.mileage || 0,
        items,
      }));
    }
  }, [vehicle]);

  const handleRatingChange = (itemId: string, rating: string) => {
    setInspectionData((prev) => ({
      ...prev,
      items: prev.items.map((item) => (item.id === itemId ? { ...item, rating: rating as any } : item)),
    }));
  };

  const handleNotesChange = (itemId: string, notes: string) => {
    setInspectionData((prev) => ({
      ...prev,
      items: prev.items.map((item) => (item.id === itemId ? { ...item, notes } : item)),
    }));
  };

  const calculateScore = () => {
    const ratedItems = inspectionData.items.filter((item) => item.rating && item.rating !== "na");
    if (ratedItems.length === 0) return 0;

    const scores = {
      ok: 100,
      attention: 70,
      immediate: 30,
    };

    const totalScore = ratedItems.reduce((sum, item) => {
      return sum + (scores[item.rating as keyof typeof scores] || 0);
    }, 0);

    return Math.round(totalScore / ratedItems.length);
  };

  const getCategoryScore = (categoryId: string) => {
    const categoryItems = inspectionData.items.filter(
      (item) => item.category === categoryId && item.rating && item.rating !== "na",
    );
    if (categoryItems.length === 0) return 0;

    const scores = {
      ok: 100,
      attention: 70,
      immediate: 30,
    };

    const totalScore = categoryItems.reduce((sum, item) => {
      return sum + (scores[item.rating as keyof typeof scores] || 0);
    }, 0);

    return Math.round(totalScore / categoryItems.length);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (score >= 70) return <Badge className="bg-yellow-100 text-yellow-800">Good</Badge>;
    return <Badge className="bg-red-100 text-red-800">Needs Attention</Badge>;
  };

  const getRatingIcon = (rating: string) => {
    switch (rating) {
      case "ok":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "attention":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "immediate":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "na":
        return <div className="h-4 w-4 rounded-full bg-gray-300" />;
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />;
    }
  };

  const handleSaveInspection = () => {
    console.log("Saving inspection:", inspectionData);
    // TODO: Implement save functionality
  };

  const handleSubmitInspection = () => {
    console.log("Submitting inspection:", inspectionData);
    // TODO: Implement submit functionality
    onClose();
  };

  const overallScore = calculateScore();
  const completedItems = inspectionData.items.filter((item) => item.rating).length;
  const totalItems = inspectionData.items.length;
  const progressPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  if (!vehicle) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Vehicle Inspection - {vehicle.devicename}
          </DialogTitle>
          <DialogDescription>
            Conduct comprehensive vehicle inspection with intelligent scoring
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleSaveInspection}>
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
            <Button onClick={handleSubmitInspection} disabled={progressPercentage < 100}>
              <Send className="h-4 w-4 mr-2" />
              Submit Inspection
            </Button>
          </div>

          {/* Vehicle Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Vehicle Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="mileage">Current Mileage</Label>
                  <Input
                    id="mileage"
                    type="number"
                    value={inspectionData.mileage}
                    onChange={(e) => setInspectionData((prev) => ({ ...prev, mileage: Number.parseInt(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="engine-hours">Engine Hours (Optional)</Label>
                  <Input
                    id="engine-hours"
                    type="number"
                    value={inspectionData.engineHours || ""}
                    onChange={(e) =>
                      setInspectionData((prev) => ({ ...prev, engineHours: Number.parseInt(e.target.value) || 0 }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inspection-date">Inspection Date</Label>
                  <Input
                    id="inspection-date"
                    type="date"
                    value={inspectionData.inspectionDate}
                    onChange={(e) => setInspectionData((prev) => ({ ...prev, inspectionDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Overall Score</Label>
                  <div className="flex items-center gap-2">
                    <span className={`text-2xl font-bold ${getScoreColor(overallScore)}`}>{overallScore}%</span>
                    {getScoreBadge(overallScore)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Inspection Progress</span>
                <span className="text-sm text-muted-foreground">
                  {completedItems} of {totalItems} items completed
                </span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </CardContent>
          </Card>

          {/* Inspection Categories */}
          <Tabs value={currentCategory} onValueChange={setCurrentCategory}>
            <TabsList className="grid w-full grid-cols-6">
              {inspectionCategories.map((category) => {
                const score = getCategoryScore(category.id);
                return (
                  <TabsTrigger key={category.id} value={category.id} className="relative">
                    <div className="flex flex-col items-center">
                      <span className="text-xs">{category.name.split(" ")[0]}</span>
                      {score > 0 && <span className={`text-xs font-bold ${getScoreColor(score)}`}>{score}%</span>}
                    </div>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {inspectionCategories.map((category) => (
              <TabsContent key={category.id} value={category.id} className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{category.name}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-lg font-bold ${getScoreColor(getCategoryScore(category.id))}`}>
                          {getCategoryScore(category.id)}%
                        </span>
                        {getCategoryScore(category.id) > 0 && getScoreBadge(getCategoryScore(category.id))}
                      </div>
                    </CardTitle>
                    <CardDescription>
                      Rate each item: OK / Needs Attention / Needs Immediate Repair / N/A
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {category.items.map((item) => {
                      const itemData = inspectionData.items.find((i) => i.item === item && i.category === category.id);
                      return (
                        <div key={item} className="space-y-3 p-4 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <Label className="font-medium">{item}</Label>
                            {itemData && getRatingIcon(itemData.rating)}
                          </div>
                          <RadioGroup
                            value={itemData?.rating || ""}
                            onValueChange={(value) => handleRatingChange(itemData?.id || "", value)}
                          >
                            <div className="flex gap-4">
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="ok" id={`${item}-ok`} />
                                <Label htmlFor={`${item}-ok`} className="text-green-600">
                                  OK
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="attention" id={`${item}-attention`} />
                                <Label htmlFor={`${item}-attention`} className="text-yellow-600">
                                  Needs Attention
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="immediate" id={`${item}-immediate`} />
                                <Label htmlFor={`${item}-immediate`} className="text-red-600">
                                  Immediate Repair
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="na" id={`${item}-na`} />
                                <Label htmlFor={`${item}-na`} className="text-gray-600">
                                  N/A
                                </Label>
                              </div>
                            </div>
                          </RadioGroup>
                          {itemData?.rating && itemData.rating !== "ok" && itemData.rating !== "na" && (
                            <div className="space-y-2">
                              <Label htmlFor={`${item}-notes`} className="text-sm">
                                Notes (Optional)
                              </Label>
                              <Textarea
                                id={`${item}-notes`}
                                value={itemData.notes || ""}
                                onChange={(e) => handleNotesChange(itemData.id, e.target.value)}
                                placeholder="Add specific details about the issue..."
                                rows={2}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>

          {/* Next Inspection Scheduling */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Next Inspection Schedule
              </CardTitle>
              <CardDescription>Set when the next inspection should be performed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup
                value={inspectionData.nextInspectionType}
                onValueChange={(value: any) => setInspectionData((prev) => ({ ...prev, nextInspectionType: value }))}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="mileage" id="mileage-based" />
                  <Label htmlFor="mileage-based">Based on Mileage</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="engine-hours" id="hours-based" />
                  <Label htmlFor="hours-based">Based on Engine Hours</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="date" id="date-based" />
                  <Label htmlFor="date-based">Based on Date</Label>
                </div>
              </RadioGroup>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="next-inspection-value">
                    {inspectionData.nextInspectionType === "mileage" && "Next Inspection Mileage"}
                    {inspectionData.nextInspectionType === "engine-hours" && "Next Inspection Engine Hours"}
                    {inspectionData.nextInspectionType === "date" && "Next Inspection Date"}
                  </Label>
                  <Input
                    id="next-inspection-value"
                    type={inspectionData.nextInspectionType === "date" ? "date" : "number"}
                    value={inspectionData.nextInspectionValue}
                    onChange={(e) => setInspectionData((prev) => ({ ...prev, nextInspectionValue: e.target.value }))}
                    placeholder={
                      inspectionData.nextInspectionType === "mileage"
                        ? "e.g., 50000"
                        : inspectionData.nextInspectionType === "engine-hours"
                          ? "e.g., 1000"
                          : ""
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Overall Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Overall Inspection Notes</CardTitle>
              <CardDescription>Add any additional observations or recommendations</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={inspectionData.overallNotes}
                onChange={(e) => setInspectionData((prev) => ({ ...prev, overallNotes: e.target.value }))}
                placeholder="Add general notes about the vehicle condition, recommendations, or any other observations..."
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Inspection Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Inspection Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center">
                  <div className={`text-3xl font-bold ${getScoreColor(overallScore)}`}>{overallScore}%</div>
                  <div className="text-sm text-muted-foreground">Overall Score</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {inspectionData.items.filter((item) => item.rating === "ok").length}
                  </div>
                  <div className="text-sm text-muted-foreground">Items OK</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">
                    {inspectionData.items.filter((item) => item.rating === "immediate").length}
                  </div>
                  <div className="text-sm text-muted-foreground">Immediate Repairs</div>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <h4 className="font-medium">Category Breakdown</h4>
                {inspectionCategories.map((category) => {
                  const score = getCategoryScore(category.id);
                  return (
                    <div key={category.id} className="flex items-center justify-between">
                      <span className="text-sm">{category.name}</span>
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${getScoreColor(score)}`}>{score}%</span>
                        {score > 0 && (
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                score >= 90 ? "bg-green-500" : score >= 70 ? "bg-yellow-500" : "bg-red-500"
                              }`}
                              style={{ width: `${score}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VehicleInspectionModal;
