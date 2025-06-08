
import { useState, useEffect } from 'react';
import { Activity, Gauge, Shield, Tool } from 'lucide-react';

export interface MarketplaceProduct {
  id: string;
  title: string;
  description: string;
  fullDescription: string;
  price: string;
  priceUnit: string;
  rating: number;
  reviewCount: number;
  popular: boolean;
  icon: any;
  category: string;
  features: string[];
  screenshots: string[];
  reviews: {
    author: string;
    rating: number;
    date: string;
    comment: string;
    helpful: number;
    notHelpful: number;
  }[];
  compatibility: string[];
  size: string;
  version: string;
  lastUpdated: string;
  developer: string;
  merchantId: string;
}

const mockProducts: MarketplaceProduct[] = [
  {
    id: "tel-1",
    title: "Advanced Driver Analytics",
    description: "Get detailed insights into driver behavior, including harsh braking, rapid acceleration, and cornering.",
    fullDescription: "Transform your fleet management with our comprehensive driver analytics solution. Monitor and analyze driver behavior in real-time with advanced algorithms that detect harsh braking, rapid acceleration, sharp cornering, and speeding incidents.",
    price: "$29.99",
    priceUnit: "per vehicle/month",
    rating: 4.8,
    reviewCount: 1247,
    popular: true,
    icon: Activity,
    category: "telemetry",
    features: [
      "Real-time driver behavior monitoring",
      "Harsh braking and acceleration detection", 
      "Speed limit violation alerts",
      "Driver scoring and ranking",
      "Customizable safety thresholds"
    ],
    screenshots: [
      "/placeholder.svg?height=300&width=500&text=Driver+Dashboard",
      "/placeholder.svg?height=300&width=500&text=Analytics+Report"
    ],
    reviews: [
      {
        author: "Fleet Manager Pro",
        rating: 5,
        date: "2024-02-15",
        comment: "Excellent analytics platform! Helped us reduce accidents by 40% in just 3 months.",
        helpful: 23,
        notHelpful: 1
      }
    ],
    compatibility: ["All vehicle types", "iOS", "Android", "Web Dashboard"],
    size: "Cloud-based",
    version: "2.4.1",
    lastUpdated: "March 1, 2024",
    developer: "FleetTech Solutions",
    merchantId: "merchant-1"
  },
  {
    id: "tel-2", 
    title: "Fuel Optimization Suite",
    description: "Advanced fuel consumption analytics with route optimization to reduce fuel costs by up to 15%.",
    fullDescription: "Maximize your fleet's fuel efficiency with our comprehensive optimization suite. Our advanced algorithms analyze driving patterns, route efficiency, and vehicle performance.",
    price: "$19.99",
    priceUnit: "per vehicle/month",
    rating: 4.6,
    reviewCount: 892,
    popular: false,
    icon: Gauge,
    category: "telemetry",
    features: [
      "Real-time fuel consumption tracking",
      "Route optimization algorithms",
      "Fuel efficiency scoring",
      "Cost analysis and reporting"
    ],
    screenshots: [],
    reviews: [],
    compatibility: ["All vehicle types", "GPS required"],
    size: "Cloud-based", 
    version: "1.8.3",
    lastUpdated: "February 28, 2024",
    developer: "EcoFleet Technologies",
    merchantId: "merchant-2"
  },
  {
    id: "ins-1",
    title: "Fleet Comprehensive Coverage", 
    description: "Full coverage insurance for your entire fleet with 24/7 roadside assistance and accident management.",
    fullDescription: "Protect your entire fleet with our comprehensive insurance coverage designed specifically for commercial vehicles.",
    price: "Custom Quote",
    priceUnit: "",
    rating: 4.7,
    reviewCount: 634,
    popular: true,
    icon: Shield,
    category: "insurance",
    features: [
      "Comprehensive fleet coverage",
      "24/7 roadside assistance", 
      "Dedicated accident management",
      "Telematics-based pricing"
    ],
    screenshots: [],
    reviews: [],
    compatibility: ["All commercial vehicles"],
    size: "Policy documents",
    version: "2024.1", 
    lastUpdated: "March 1, 2024",
    developer: "FleetGuard Insurance",
    merchantId: "merchant-3"
  },
  {
    id: "part-1",
    title: "Premium Brake Kit",
    description: "High-performance brake pads and rotors designed for commercial vehicles with heavy loads.",
    fullDescription: "Ensure maximum safety and performance with our premium brake kit specifically engineered for commercial fleet vehicles.",
    price: "$249.99",
    priceUnit: "per kit",
    rating: 4.9,
    reviewCount: 456,
    popular: true,
    icon: Tool,
    category: "parts",
    features: [
      "High-performance brake pads",
      "Premium rotors included",
      "Heavy-duty hardware kit",
      "50,000-mile warranty"
    ],
    screenshots: [],
    reviews: [],
    compatibility: ["Most commercial vehicles"],
    size: "Complete kit",
    version: "Gen 3",
    lastUpdated: "February 15, 2024", 
    developer: "ProFleet Parts",
    merchantId: "merchant-4"
  }
];

export const useMarketplaceProducts = () => {
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const fetchProducts = async () => {
      setIsLoading(true);
      
      // In a real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setProducts(mockProducts);
      setIsLoading(false);
    };

    fetchProducts();
  }, []);

  return {
    products,
    isLoading
  };
};
