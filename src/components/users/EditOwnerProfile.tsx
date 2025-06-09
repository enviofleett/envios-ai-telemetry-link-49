
"use client"

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { User, Upload, Save, X, CheckCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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

interface EditOwnerProfileProps {
  owner: EnvioUser;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedOwner: EnvioUser) => void;
}

export function EditOwnerProfile({ owner, isOpen, onClose, onSave }: EditOwnerProfileProps) {
  const [formData, setFormData] = useState<EnvioUser>(owner);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setFormData(owner);
    setAvatarFile(null);
    setAvatarPreview(null);
    setErrors({});
  }, [owner]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (formData.phone_number && !/^\+?[\d\s\-()]+$/.test(formData.phone_number)) {
      newErrors.phone_number = "Please enter a valid phone number";
    }

    if (formData.gp51_username && formData.gp51_username.length < 3) {
      newErrors.gp51_username = "GP51 username must be at least 3 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof EnvioUser, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }

      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }

      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors below and try again",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Update user in the database
      const { data: updatedUser, error } = await supabase
        .from('envio_users')
        .update({
          name: formData.name,
          email: formData.email,
          phone_number: formData.phone_number,
          city: formData.city,
          gp51_username: formData.gp51_username,
          gp51_user_type: formData.gp51_user_type,
          registration_status: formData.registration_status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', formData.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      onSave(updatedUser);

      toast({
        title: "Profile Updated",
        description: "Owner profile has been successfully updated",
      });

      onClose();
    } catch (error: any) {
      console.error('Failed to update owner profile:', error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData(owner);
    setAvatarFile(null);
    setAvatarPreview(null);
    setErrors({});
    onClose();
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
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Approved
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Pending
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Edit Owner Profile
          </DialogTitle>
          <DialogDescription>
            Update the vehicle owner's information and GP51 integration details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={avatarPreview || "/placeholder.svg"} />
              <AvatarFallback>
                {formData.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <Label htmlFor="avatar" className="text-sm font-medium">
                Profile Picture
              </Label>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" asChild>
                  <label htmlFor="avatar" className="cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Photo
                  </label>
                </Button>
                <input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                {avatarPreview && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setAvatarPreview(null);
                      setAvatarFile(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">JPG, PNG or GIF. Max size 5MB.</p>
            </div>
          </div>

          <Separator />

          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Personal Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone_number">Phone Number</Label>
                <Input
                  id="phone_number"
                  value={formData.phone_number || ''}
                  onChange={(e) => handleInputChange("phone_number", e.target.value)}
                  className={errors.phone_number ? "border-red-500" : ""}
                />
                {errors.phone_number && <p className="text-sm text-red-500">{errors.phone_number}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city || ''}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="created_at">Join Date</Label>
                <Input
                  id="created_at"
                  value={new Date(formData.created_at).toLocaleDateString()}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Join date cannot be modified</p>
              </div>

              <div className="space-y-2">
                <Label>Registration Status</Label>
                <div className="flex items-center gap-2">
                  {getStatusBadge(formData.registration_status)}
                  <Select
                    value={formData.registration_status}
                    onValueChange={(value) => handleInputChange("registration_status", value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* GP51 Integration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">GP51 Integration</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="gp51_username">GP51 Username</Label>
                <Input
                  id="gp51_username"
                  value={formData.gp51_username || ''}
                  onChange={(e) => handleInputChange("gp51_username", e.target.value)}
                  className={errors.gp51_username ? "border-red-500" : ""}
                  placeholder="Enter GP51 username"
                />
                {errors.gp51_username && <p className="text-sm text-red-500">{errors.gp51_username}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gp51_user_type">GP51 User Type</Label>
                <Select
                  value={formData.gp51_user_type.toString()}
                  onValueChange={(value) => handleInputChange("gp51_user_type", parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Company Admin</SelectItem>
                    <SelectItem value="2">Sub Admin</SelectItem>
                    <SelectItem value="3">End User</SelectItem>
                    <SelectItem value="4">Device User</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Current: {getGP51UserTypeLabel(formData.gp51_user_type)}
                </p>
              </div>
            </div>
          </div>

          {/* Summary of Changes */}
          {JSON.stringify(formData) !== JSON.stringify(owner) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Changes to be saved:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                {formData.name !== owner.name && <li>• Name updated</li>}
                {formData.email !== owner.email && <li>• Email address updated</li>}
                {formData.phone_number !== owner.phone_number && <li>• Phone number updated</li>}
                {formData.city !== owner.city && <li>• City updated</li>}
                {formData.gp51_username !== owner.gp51_username && <li>• GP51 username updated</li>}
                {formData.gp51_user_type !== owner.gp51_user_type && <li>• GP51 user type updated</li>}
                {formData.registration_status !== owner.registration_status && <li>• Registration status updated</li>}
                {avatarPreview && <li>• Profile picture updated</li>}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
