
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Shield,
  Eye,
  EyeOff,
  Upload,
  Save,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Facebook,
  Instagram,
  Twitter,
} from 'lucide-react';

interface MerchantProfile {
  fullName: string;
  brandName: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  description: string;
  socialMedia: {
    facebook: string;
    instagram: string;
    twitter: string;
  };
  avatar: string;
  joinDate: string;
  status: string;
  verificationLevel: string;
}

interface BankAccount {
  accountName: string;
  accountNumber: string;
  bankName: string;
  routingNumber: string;
  accountType: string;
}

interface NotificationSettings {
  orderNotifications: boolean;
  paymentNotifications: boolean;
  marketingEmails: boolean;
  productUpdates: boolean;
  systemAlerts: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
}

const mockProfile: MerchantProfile = {
  fullName: 'John Smith',
  brandName: 'AutoCare Pro',
  email: 'john@autocarepro.com',
  phone: '+1 (555) 123-4567',
  address: '123 Business St, City, State 12345',
  website: 'https://autocarepro.com',
  description:
    'Professional automotive services and parts supplier with over 10 years of experience in fleet management solutions.',
  socialMedia: {
    facebook: 'https://facebook.com/autocarepro',
    instagram: 'https://instagram.com/autocarepro',
    twitter: '',
  },
  avatar: '/placeholder.svg',
  joinDate: 'January 2024',
  status: 'approved',
  verificationLevel: 'verified',
};

const mockBankAccount: BankAccount = {
  accountName: 'AutoCare Pro LLC',
  accountNumber: '****1234',
  bankName: 'First National Bank',
  routingNumber: '****5678',
  accountType: 'Business Checking',
};

const mockNotificationSettings: NotificationSettings = {
  orderNotifications: true,
  paymentNotifications: true,
  marketingEmails: false,
  productUpdates: true,
  systemAlerts: true,
  emailNotifications: true,
  smsNotifications: false,
};

export const MerchantSettings: React.FC = () => {
  const [profile, setProfile] = useState(mockProfile);
  const [bankAccount, setBankAccount] = useState(mockBankAccount);
  const [notifications, setNotifications] = useState(mockNotificationSettings);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleProfileUpdate = () => {
    // Here you would typically send the updated profile to the backend
    alert('Profile updated successfully!');
  };

  const handleBankAccountUpdate = () => {
    // Here you would typically send the updated bank account info to the backend
    alert('Bank account information updated successfully!');
  };

  const handleNotificationUpdate = () => {
    // Here you would typically send the updated notification settings to the backend
    alert('Notification settings updated successfully!');
  };

  const handlePasswordChange = () => {
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match!');
      return;
    }
    if (newPassword.length < 8) {
      alert('Password must be at least 8 characters long!');
      return;
    }
    // Here you would typically send the password change request to the backend
    alert('Password changed successfully!');
    setShowPasswordDialog(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleAccountDeactivation = () => {
    // Here you would typically send the account deactivation request to the backend
    alert('Account deactivation request submitted. You will receive a confirmation email.');
    setShowDeleteDialog(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Account Settings</h2>
          <p className="text-muted-foreground">Manage your merchant account and preferences</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Verified Account
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="business">Business Info</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details and contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile.avatar || '/placeholder.svg'} alt={profile.fullName} />
                  <AvatarFallback className="text-lg">
                    {profile.fullName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload New Photo
                  </Button>
                  <p className="text-sm text-muted-foreground">JPG, PNG or GIF. Max size 2MB.</p>
                </div>
              </div>

              <Separator />

              {/* Personal Details */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={profile.fullName}
                    onChange={(e) => setProfile((prev) => ({ ...prev, fullName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile((prev) => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={profile.phone}
                    onChange={(e) => setProfile((prev) => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={profile.website}
                    onChange={(e) => setProfile((prev) => ({ ...prev, website: e.target.value }))}
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Business Address</Label>
                <Input
                  id="address"
                  value={profile.address}
                  onChange={(e) => setProfile((prev) => ({ ...prev, address: e.target.value }))}
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleProfileUpdate}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>Manage your store details and social media presence</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="brandName">Brand/Store Name</Label>
                <Input
                  id="brandName"
                  value={profile.brandName}
                  onChange={(e) => setProfile((prev) => ({ ...prev, brandName: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Business Description</Label>
                <Textarea
                  id="description"
                  value={profile.description}
                  onChange={(e) => setProfile((prev) => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  placeholder="Describe your business, services, and what makes you unique..."
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Social Media Links</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="facebook">Facebook</Label>
                    <div className="relative">
                      <Facebook className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="facebook"
                        className="pl-10"
                        value={profile.socialMedia.facebook}
                        onChange={(e) =>
                          setProfile((prev) => ({
                            ...prev,
                            socialMedia: { ...prev.socialMedia, facebook: e.target.value },
                          }))
                        }
                        placeholder="https://facebook.com/yourstore"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram</Label>
                    <div className="relative">
                      <Instagram className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="instagram"
                        className="pl-10"
                        value={profile.socialMedia.instagram}
                        onChange={(e) =>
                          setProfile((prev) => ({
                            ...prev,
                            socialMedia: { ...prev.socialMedia, instagram: e.target.value },
                          }))
                        }
                        placeholder="https://instagram.com/yourstore"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="twitter">Twitter</Label>
                    <div className="relative">
                      <Twitter className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="twitter"
                        className="pl-10"
                        value={profile.socialMedia.twitter}
                        onChange={(e) =>
                          setProfile((prev) => ({
                            ...prev,
                            socialMedia: { ...prev.socialMedia, twitter: e.target.value },
                          }))
                        }
                        placeholder="https://twitter.com/yourstore"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleProfileUpdate}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
              <CardDescription>Manage your bank account for receiving payments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 text-blue-800 font-medium">
                  <CheckCircle className="h-4 w-4" />
                  Bank Account Verified
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  Your bank account has been verified and is ready to receive payments.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="accountName">Account Name</Label>
                  <Input
                    id="accountName"
                    value={bankAccount.accountName}
                    onChange={(e) => setBankAccount((prev) => ({ ...prev, accountName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    value={bankAccount.bankName}
                    onChange={(e) => setBankAccount((prev) => ({ ...prev, bankName: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    value={bankAccount.accountNumber}
                    onChange={(e) => setBankAccount((prev) => ({ ...prev, accountNumber: e.target.value }))}
                    placeholder="Enter full account number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="routingNumber">Routing Number</Label>
                  <Input
                    id="routingNumber"
                    value={bankAccount.routingNumber}
                    onChange={(e) => setBankAccount((prev) => ({ ...prev, routingNumber: e.target.value }))}
                    placeholder="Enter routing number"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountType">Account Type</Label>
                <Input
                  id="accountType"
                  value={bankAccount.accountType}
                  onChange={(e) => setBankAccount((prev) => ({ ...prev, accountType: e.target.value }))}
                />
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-800 font-medium">
                  <AlertTriangle className="h-4 w-4" />
                  Payment Schedule
                </div>
                <p className="text-sm text-yellow-700 mt-1">
                  Payments are processed weekly on Fridays. Funds typically arrive within 1-2 business days.
                </p>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleBankAccountUpdate}>
                  <Save className="h-4 w-4 mr-2" />
                  Update Bank Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose how you want to receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Order Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">New Orders</div>
                      <div className="text-sm text-muted-foreground">Get notified when you receive new orders</div>
                    </div>
                    <Switch
                      checked={notifications.orderNotifications}
                      onCheckedChange={(checked) =>
                        setNotifications((prev) => ({ ...prev, orderNotifications: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Payment Notifications</div>
                      <div className="text-sm text-muted-foreground">Get notified when payments are processed</div>
                    </div>
                    <Switch
                      checked={notifications.paymentNotifications}
                      onCheckedChange={(checked) =>
                        setNotifications((prev) => ({ ...prev, paymentNotifications: checked }))
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Marketing & Updates</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Marketing Emails</div>
                      <div className="text-sm text-muted-foreground">Receive promotional emails and offers</div>
                    </div>
                    <Switch
                      checked={notifications.marketingEmails}
                      onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, marketingEmails: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Product Updates</div>
                      <div className="text-sm text-muted-foreground">Get notified about new features and updates</div>
                    </div>
                    <Switch
                      checked={notifications.productUpdates}
                      onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, productUpdates: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">System Alerts</div>
                      <div className="text-sm text-muted-foreground">Important system notifications and alerts</div>
                    </div>
                    <Switch
                      checked={notifications.systemAlerts}
                      onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, systemAlerts: checked }))}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Delivery Methods</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Email Notifications</div>
                      <div className="text-sm text-muted-foreground">Receive notifications via email</div>
                    </div>
                    <Switch
                      checked={notifications.emailNotifications}
                      onCheckedChange={(checked) =>
                        setNotifications((prev) => ({ ...prev, emailNotifications: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">SMS Notifications</div>
                      <div className="text-sm text-muted-foreground">Receive notifications via text message</div>
                    </div>
                    <Switch
                      checked={notifications.smsNotifications}
                      onCheckedChange={(checked) =>
                        setNotifications((prev) => ({ ...prev, smsNotifications: checked }))
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleNotificationUpdate}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your account security and privacy</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Password</h3>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">Change Password</div>
                    <div className="text-sm text-muted-foreground">Last changed 3 months ago</div>
                  </div>
                  <Button variant="outline" onClick={() => setShowPasswordDialog(true)}>
                    Change Password
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Account Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Account Status</span>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Verification Level</span>
                    <Badge className="bg-blue-100 text-blue-800">Verified</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Member Since</span>
                    <span className="text-sm text-muted-foreground">{profile.joinDate}</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-red-600">Danger Zone</h3>
                <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-red-800">Deactivate Account</div>
                      <div className="text-sm text-red-600">
                        Permanently deactivate your merchant account. This action cannot be undone.
                      </div>
                    </div>
                    <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Deactivate
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>Enter your current password and choose a new one</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handlePasswordChange}>
              <Shield className="h-4 w-4 mr-2" />
              Change Password
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Account Deactivation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Deactivate Account</DialogTitle>
            <DialogDescription>
              This action will permanently deactivate your merchant account. All your products will be removed from the
              marketplace and you will no longer be able to receive orders.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800 font-medium">
                <AlertTriangle className="h-4 w-4" />
                Warning: This action cannot be undone
              </div>
              <ul className="text-sm text-red-700 mt-2 space-y-1">
                <li>• All your products will be removed from the marketplace</li>
                <li>• Pending orders will be cancelled</li>
                <li>• You will lose access to your merchant dashboard</li>
                <li>• Your account data will be permanently deleted</li>
              </ul>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-deactivation">Type "DEACTIVATE" to confirm account deactivation</Label>
              <Input id="confirm-deactivation" placeholder="Type DEACTIVATE here" />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleAccountDeactivation}>
              <Trash2 className="h-4 w-4 mr-2" />
              Deactivate Account
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
