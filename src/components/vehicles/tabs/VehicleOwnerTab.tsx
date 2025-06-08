
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Mail, Phone, MapPin } from 'lucide-react';
import { Vehicle } from '@/services/unifiedVehicleData';

interface VehicleOwnerTabProps {
  vehicle: Vehicle;
}

// Mock owner data
const mockOwner = {
  id: "owner-1",
  name: "John Smith",
  email: "john.smith@company.com",
  phone: "+1 (555) 123-4567",
  address: "123 Main St, City, State 12345",
  avatar: "/placeholder.svg",
  licenseNumber: "D123456789",
  licenseExpiry: "2025-06-15",
  joinDate: "2023-01-15",
};

export const VehicleOwnerTab: React.FC<VehicleOwnerTabProps> = ({ vehicle }) => {
  const [showEditProfile, setShowEditProfile] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Vehicle Owner Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={mockOwner.avatar} />
            <AvatarFallback>
              {mockOwner.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-xl font-semibold">{mockOwner.name}</h3>
            <p className="text-muted-foreground">Vehicle Owner</p>
          </div>
        </div>

        <Separator />

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <h4 className="font-medium">Contact Information</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{mockOwner.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{mockOwner.phone}</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span className="text-sm">{mockOwner.address}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium">License Information</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">License Number:</span>
                <span className="font-mono text-sm">{mockOwner.licenseNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expiry Date:</span>
                <span>{mockOwner.licenseExpiry}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Join Date:</span>
                <span>{mockOwner.joinDate}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button variant="outline">
            <Mail className="h-4 w-4 mr-2" />
            Send Message
          </Button>
          <Button variant="outline">
            <Phone className="h-4 w-4 mr-2" />
            Call Owner
          </Button>
          <Button onClick={() => setShowEditProfile(true)}>
            <User className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
