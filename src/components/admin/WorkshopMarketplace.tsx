
"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import {
  Search,
  Star,
  MapPin,
  Phone,
  Clock,
  Wrench,
  CheckCircle,
  Filter,
  ArrowRight,
  ThumbsUp,
  ThumbsDown,
  ChevronRight,
} from "lucide-react"

interface Workshop {
  id: string
  name: string
  logo?: string
  rating: number
  reviewCount: number
  specialties: string[]
  address: string
  phone: string
  hours: string
  description: string
  connectionFee: number
  verified: boolean
  featured: boolean
  distance?: string
  reviews: {
    author: string
    rating: number
    date: string
    comment: string
    helpful?: number
    notHelpful?: number
  }[]
  gallery?: string[]
  services: {
    name: string
    price: string
    duration: string
  }[]
}

const workshops: Workshop[] = [
  {
    id: "ws-1",
    name: "AutoCare Plus",
    logo: "/placeholder.svg?height=80&width=80",
    rating: 4.8,
    reviewCount: 124,
    specialties: ["Engine Repair", "Electrical Systems", "Fleet Maintenance"],
    address: "456 Service Rd, City, State",
    phone: "+1 (555) 123-4567",
    hours: "Mon-Fri: 8AM-6PM, Sat: 9AM-3PM",
    description:
      "AutoCare Plus is a certified service center specializing in commercial fleet maintenance with over 15 years of experience. Our ASE-certified technicians use state-of-the-art diagnostic equipment to ensure your vehicles receive the highest quality service.",
    connectionFee: 49.99,
    verified: true,
    featured: true,
    distance: "3.2 miles",
    reviews: [
      {
        author: "John D.",
        rating: 5,
        date: "2024-02-15",
        comment: "Excellent service! They fixed our fleet vehicles quickly and at a reasonable price.",
        helpful: 12,
        notHelpful: 1,
      },
      {
        author: "Sarah M.",
        rating: 4,
        date: "2024-01-22",
        comment: "Good service overall. Scheduling was easy and they completed the work on time.",
        helpful: 8,
        notHelpful: 2,
      },
    ],
    gallery: [
      "/placeholder.svg?height=200&width=300",
      "/placeholder.svg?height=200&width=300",
      "/placeholder.svg?height=200&width=300",
    ],
    services: [
      {
        name: "Oil Change",
        price: "$49.99",
        duration: "30 min",
      },
      {
        name: "Brake Service",
        price: "$199.99",
        duration: "2 hours",
      },
      {
        name: "Engine Diagnostic",
        price: "$89.99",
        duration: "1 hour",
      },
    ],
  },
  {
    id: "ws-2",
    name: "Fleet Masters",
    logo: "/placeholder.svg?height=80&width=80",
    rating: 4.6,
    reviewCount: 98,
    specialties: ["Preventive Maintenance", "Diesel Specialists", "Mobile Service"],
    address: "789 Fleet Ave, City, State",
    phone: "+1 (555) 987-6543",
    hours: "Mon-Sat: 7AM-7PM",
    description:
      "Fleet Masters specializes exclusively in commercial fleet maintenance with mobile service options. Our team of diesel specialists can handle everything from routine maintenance to major repairs, minimizing your fleet's downtime.",
    connectionFee: 59.99,
    verified: true,
    featured: false,
    distance: "5.7 miles",
    reviews: [
      {
        author: "Michael T.",
        rating: 5,
        date: "2024-02-28",
        comment: "Their mobile service is a game-changer for our fleet. Highly recommended!",
        helpful: 15,
        notHelpful: 0,
      },
    ],
    gallery: ["/placeholder.svg?height=200&width=300", "/placeholder.svg?height=200&width=300"],
    services: [
      {
        name: "Preventive Maintenance",
        price: "$149.99",
        duration: "1.5 hours",
      },
      {
        name: "Mobile Service Call",
        price: "$99.99",
        duration: "Varies",
      },
      {
        name: "Diesel Engine Repair",
        price: "From $299.99",
        duration: "3-8 hours",
      },
    ],
  },
  {
    id: "ws-3",
    name: "QuickLube Commercial",
    logo: "/placeholder.svg?height=80&width=80",
    rating: 4.3,
    reviewCount: 76,
    specialties: ["Quick Service", "Oil Changes", "Fluid Maintenance"],
    address: "123 Quick St, City, State",
    phone: "+1 (555) 456-7890",
    hours: "Mon-Sun: 8AM-8PM",
    description:
      "QuickLube Commercial offers fast, reliable maintenance services for fleet vehicles. We specialize in quick turnaround times without sacrificing quality, helping keep your fleet on the road with minimal downtime.",
    connectionFee: 39.99,
    verified: true,
    featured: false,
    distance: "2.1 miles",
    reviews: [
      {
        author: "Lisa R.",
        rating: 4,
        date: "2024-01-10",
        comment: "Fast service and reasonable prices. Perfect for basic maintenance needs.",
        helpful: 7,
        notHelpful: 1,
      },
    ],
    gallery: ["/placeholder.svg?height=200&width=300"],
    services: [
      {
        name: "Fleet Oil Change",
        price: "$39.99",
        duration: "20 min",
      },
      {
        name: "Fluid Check & Top-off",
        price: "$29.99",
        duration: "15 min",
      },
      {
        name: "Filter Replacement",
        price: "$24.99",
        duration: "15 min",
      },
    ],
  },
]

interface WorkshopMarketplaceProps {
  onWorkshopSelect: (workshop: Workshop) => void
}

export function WorkshopMarketplace({ onWorkshopSelect }: WorkshopMarketplaceProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null)
  const [showWorkshopDetails, setShowWorkshopDetails] = useState(false)

  const filteredWorkshops = workshops.filter((workshop) =>
    workshop.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleWorkshopClick = (workshop: Workshop) => {
    setSelectedWorkshop(workshop)
    setShowWorkshopDetails(true)
  }

  const handleSelectWorkshop = () => {
    if (selectedWorkshop) {
      onWorkshopSelect(selectedWorkshop)
      setShowWorkshopDetails(false)
    }
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

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Approved Workshops</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search workshops..."
                className="pl-8 w-[200px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredWorkshops.map((workshop) => (
            <Card
              key={workshop.id}
              className={`cursor-pointer transition-all hover:border-primary/50 ${
                workshop.featured ? "border-primary/20 bg-primary/5" : ""
              }`}
              onClick={() => handleWorkshopClick(workshop)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 rounded-md">
                      <AvatarImage src={workshop.logo || "/placeholder.svg"} alt={workshop.name} />
                      <AvatarFallback className="rounded-md">
                        {workshop.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base flex items-center gap-1">
                        {workshop.name}
                        {workshop.verified && <CheckCircle className="h-4 w-4 text-blue-500 fill-blue-500" />}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {workshop.distance}
                      </CardDescription>
                    </div>
                  </div>
                  {workshop.featured && <Badge className="bg-primary text-primary-foreground">Featured</Badge>}
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex items-center justify-between mb-2">
                  {renderStars(workshop.rating)}
                  <span className="text-xs text-muted-foreground">{workshop.reviewCount} reviews</span>
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {workshop.specialties.slice(0, 3).map((specialty, index) => (
                    <Badge key={index} variant="outline" className="bg-muted/50">
                      {specialty}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{workshop.description}</p>
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="ghost" className="w-full justify-between" size="sm">
                  View Details
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* Workshop Details Dialog */}
      <Dialog open={showWorkshopDetails} onOpenChange={setShowWorkshopDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedWorkshop && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  {selectedWorkshop.name}
                  {selectedWorkshop.verified && <CheckCircle className="h-4 w-4 text-blue-500 fill-blue-500" />}
                </DialogTitle>
                <DialogDescription>Certified fleet maintenance provider</DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="services">Services</TabsTrigger>
                  <TabsTrigger value="reviews">Reviews</TabsTrigger>
                  <TabsTrigger value="gallery">Gallery</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-16 w-16 rounded-md">
                        <AvatarImage src={selectedWorkshop.logo || "/placeholder.svg"} alt={selectedWorkshop.name} />
                        <AvatarFallback className="rounded-md">
                          {selectedWorkshop.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-xl font-semibold">{selectedWorkshop.name}</h3>
                        <div className="flex items-center">
                          {renderStars(selectedWorkshop.rating)}
                          <span className="ml-2 text-sm text-muted-foreground">
                            ({selectedWorkshop.reviewCount} reviews)
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Approved Partner</Badge>
                  </div>

                  <Separator />

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-3">
                      <h4 className="font-medium">About</h4>
                      <p className="text-sm text-muted-foreground">{selectedWorkshop.description}</p>

                      <h4 className="font-medium pt-2">Specialties</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedWorkshop.specialties.map((specialty, index) => (
                          <Badge key={index} variant="outline" className="bg-muted/50">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium">Contact Information</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{selectedWorkshop.address}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{selectedWorkshop.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{selectedWorkshop.hours}</span>
                        </div>
                      </div>

                      <div className="pt-4">
                        <h4 className="font-medium">Connection Fee</h4>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-2xl font-bold">${selectedWorkshop.connectionFee}</span>
                          <span className="text-sm text-muted-foreground">One-time fee</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          This fee activates your vehicles with this workshop for priority service and special rates.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setShowWorkshopDetails(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSelectWorkshop}>
                      Select Workshop
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="services" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Available Services</CardTitle>
                      <CardDescription>
                        Services and pricing for fleet vehicles (special rates may apply)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {selectedWorkshop.services.map((service, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/20"
                          >
                            <div>
                              <h4 className="font-medium">{service.name}</h4>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {service.duration}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">{service.price}</div>
                              <Button variant="outline" size="sm">
                                Book Service
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="reviews" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Customer Reviews</CardTitle>
                      <CardDescription>
                        {selectedWorkshop.reviewCount} reviews with an average rating of{" "}
                        {selectedWorkshop.rating.toFixed(1)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {selectedWorkshop.reviews.map((review, index) => (
                          <div key={index} className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <span className="font-medium">{review.author}</span>
                                <span className="text-sm text-muted-foreground ml-2">{review.date}</span>
                              </div>
                              <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-sm mb-2">{review.comment}</p>
                            {(review.helpful !== undefined || review.notHelpful !== undefined) && (
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <ThumbsUp className="h-3 w-3" />
                                  <span>{review.helpful}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <ThumbsDown className="h-3 w-3" />
                                  <span>{review.notHelpful}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="gallery" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Workshop Gallery</CardTitle>
                      <CardDescription>Photos of the facility and equipment</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-3">
                        {selectedWorkshop.gallery?.map((image, index) => (
                          <div key={index} className="overflow-hidden rounded-md">
                            <img
                              src={image || "/placeholder.svg"}
                              alt={`${selectedWorkshop.name} gallery image ${index + 1}`}
                              className="h-auto w-full object-cover transition-all hover:scale-105"
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
