
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User, Download, Search, UserCheck, Building, Mail, Phone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface UserDetails {
  username: string;
  displayName: string;
  userType: number;
  userTypeLabel: string;
  company: string;
  contact: {
    email: string;
    phone: string;
    qq: string;
    wechat: string;
  };
  permissions: {
    multiLogin: boolean;
  };
}

const GP51UserManagement: React.FC = () => {
  const [currentUserData, setCurrentUserData] = useState<UserDetails | null>(null);
  const [targetUsername, setTargetUsername] = useState('');
  const [targetUserData, setTargetUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const getCurrentUserInfo = async () => {
    try {
      setIsLoading(true);
      console.log('Getting current user info...');

      const { data, error } = await supabase.functions.invoke('gp51-user-management', {
        body: { action: 'get_current_user_info' }
      });

      if (error) throw error;

      if (data.success) {
        setCurrentUserData(data.data);
        toast({
          title: "User Info Retrieved",
          description: `Loaded details for ${data.data.displayName || data.data.username}`
        });
      } else {
        throw new Error(data.error || 'Failed to get user info');
      }
    } catch (error) {
      console.error('Failed to get current user info:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to get user info',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getUserDetails = async () => {
    if (!targetUsername.trim()) {
      toast({
        title: "Error",
        description: "Please enter a username to search",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      console.log(`Getting user details for: ${targetUsername}`);

      const { data, error } = await supabase.functions.invoke('gp51-user-management', {
        body: { 
          action: 'get_user_details',
          targetUsername: targetUsername.trim()
        }
      });

      if (error) throw error;

      if (data.success) {
        setTargetUserData(data.data);
        toast({
          title: "User Found",
          description: `Retrieved details for ${data.data.showname || data.data.username}`
        });
      } else {
        throw new Error(data.error || 'Failed to get user details');
      }
    } catch (error) {
      console.error('Failed to get user details:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to get user details',
        variant: "destructive"
      });
      setTargetUserData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const exportUserData = async () => {
    try {
      setIsLoading(true);
      console.log('Exporting complete user data...');

      const { data, error } = await supabase.functions.invoke('gp51-user-management', {
        body: { action: 'export_user_data' }
      });

      if (error) throw error;

      if (data.success) {
        // Create downloadable file
        const blob = new Blob([JSON.stringify(data.data, null, 2)], {
          type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `gp51-user-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast({
          title: "Export Complete",
          description: data.message
        });
      } else {
        throw new Error(data.error || 'Export failed');
      }
    } catch (error) {
      console.error('Failed to export user data:', error);
      toast({
        title: "Export Error",
        description: error instanceof Error ? error.message : 'Failed to export data',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getUserTypeBadgeColor = (userType: number) => {
    switch (userType) {
      case 3: return 'bg-blue-100 text-blue-800';
      case 4: return 'bg-purple-100 text-purple-800';
      case 11: return 'bg-green-100 text-green-800';
      case 99: return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            GP51 User Management
          </CardTitle>
          <CardDescription>
            Manage and retrieve user information from the GP51 platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={getCurrentUserInfo} 
              disabled={isLoading}
              variant="outline"
            >
              <UserCheck className="h-4 w-4 mr-2" />
              Get Current User Info
            </Button>
            <Button 
              onClick={exportUserData} 
              disabled={isLoading}
              variant="outline"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Complete Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {currentUserData && (
        <Card>
          <CardHeader>
            <CardTitle>Current User Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Username</Label>
                <p className="text-sm text-muted-foreground">{currentUserData.username}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Display Name</Label>
                <p className="text-sm text-muted-foreground">{currentUserData.displayName || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">User Type</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={getUserTypeBadgeColor(currentUserData.userType)}>
                    {currentUserData.userTypeLabel}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium flex items-center gap-1">
                  <Building className="h-4 w-4" />
                  Company
                </Label>
                <p className="text-sm text-muted-foreground">{currentUserData.company || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <p className="text-sm text-muted-foreground">{currentUserData.contact.email || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  Phone
                </Label>
                <p className="text-sm text-muted-foreground">{currentUserData.contact.phone || 'N/A'}</p>
              </div>
            </div>
            <div className="pt-2">
              <Label className="text-sm font-medium">Permissions</Label>
              <div className="flex gap-2 mt-1">
                <Badge variant={currentUserData.permissions.multiLogin ? "default" : "secondary"}>
                  Multi-Login: {currentUserData.permissions.multiLogin ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Search Other Users</CardTitle>
          <CardDescription>
            Query details for any user by username (requires appropriate permissions)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="Enter username to search"
                value={targetUsername}
                onChange={(e) => setTargetUsername(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && getUserDetails()}
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={getUserDetails} 
                disabled={isLoading || !targetUsername.trim()}
              >
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </div>

          {targetUserData && (
            <div className="mt-4 p-4 border rounded-lg bg-muted/50">
              <h4 className="font-medium mb-3">User Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-medium">Username:</span> {targetUserData.username}
                </div>
                <div>
                  <span className="font-medium">Display Name:</span> {targetUserData.showname || 'N/A'}
                </div>
                <div>
                  <span className="font-medium">User Type:</span> {targetUserData.usertype}
                </div>
                <div>
                  <span className="font-medium">Company:</span> {targetUserData.companyname || 'N/A'}
                </div>
                <div>
                  <span className="font-medium">Email:</span> {targetUserData.email || 'N/A'}
                </div>
                <div>
                  <span className="font-medium">Phone:</span> {targetUserData.phone || 'N/A'}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GP51UserManagement;
