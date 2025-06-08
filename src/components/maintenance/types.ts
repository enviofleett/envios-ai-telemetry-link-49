
export interface MaintenanceItem {
  id: string;
  vehicleId: string;
  plateNumber: string;
  model: string;
  serviceType: string;
  scheduledDate: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'overdue';
  workshop?: string;
  priority: 'low' | 'medium' | 'high';
}

export interface Workshop {
  id: string;
  name: string;
  representativeName: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  serviceTypes: string[];
  rating: number;
  reviewCount: number;
  activationFee: number;
  operatingHours: string;
  verified: boolean;
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  model: string;
  year: number;
  status: 'active' | 'inactive' | 'maintenance';
}
