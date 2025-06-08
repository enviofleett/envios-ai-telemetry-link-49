
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EditOwnerProfile } from './EditOwnerProfile';
import { useOwnerManagement } from '@/hooks/useOwnerManagement';
import { User, Search, Car, Edit, Plus } from 'lucide-react';

interface EnvioUser {
  id: string;
  name: string;
  email: string;
  phone_number: string | null;
  city: string | null;
  gp51_username: string | null;
  gp51_user_type: number;
  registration_status: string;
  created_at: string;
  updated_at: string;
}

export function OwnerManagement() {
  const { owners, isLoadingOwners, updateOwner } = useOwnerManagement();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOwner, setSelectedOwner] = useState<EnvioUser | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const filteredOwners = owners.filter(owner =>
    owner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    owner.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (owner.gp51_username && owner.gp51_username.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleEditOwner = (owner: EnvioUser) => {
    setSelectedOwner(owner);
    setIsEditDialogOpen(true);
  };

  const handleSaveOwner = (updatedOwner: EnvioUser) => {
    updateOwner(updatedOwner);
    setIsEditDialogOpen(false);
    setSelectedOwner(null);
  };

  const getGP51UserTypeLabel = (userType: number) => {
    const labels = {
      1: 'Company Admin',
      2: 'Sub Admin',
      3: 'End User',
      4: 'Device User'
    };
    return labels[userType as keyof typeof labels] || 'Unknown';
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      approved: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (isLoadingOwners) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Owner Management</CardTitle>
          <CardDescription>Loading owner data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Vehicle Owner Management
              </CardTitle>
              <CardDescription>
                Manage vehicle owners, their profiles, and vehicle assignments
              </CardDescription>
            </div>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New Owner
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search owners..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Badge variant="outline" className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {filteredOwners.length} owners
            </Badge>
          </div>

          {/* Owners Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Owner</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>GP51 Integration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Vehicles</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOwners.map((owner) => (
                  <TableRow key={owner.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src="/placeholder.svg" />
                          <AvatarFallback>
                            {owner.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{owner.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {owner.city || 'No city specified'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm">{owner.email}</p>
                        <p className="text-sm text-muted-foreground">
                          {owner.phone_number || 'No phone'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          {owner.gp51_username || 'Not linked'}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {getGP51UserTypeLabel(owner.gp51_user_type)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(owner.registration_status)}>
                        {owner.registration_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Car className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">0</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditOwner(owner)}
                        className="flex items-center gap-1"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredOwners.length === 0 && (
            <div className="text-center py-8">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No owners found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'Try adjusting your search criteria' : 'No vehicle owners registered yet'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Owner Dialog */}
      {selectedOwner && (
        <EditOwnerProfile
          owner={selectedOwner}
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setSelectedOwner(null);
          }}
          onSave={handleSaveOwner}
        />
      )}
    </div>
  );
}
