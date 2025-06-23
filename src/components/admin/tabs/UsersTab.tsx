
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Users, Search, Plus, Edit, Shield, Mail, MoreHorizontal, Car, RefreshCw } from 'lucide-react';
import { useOptimizedUserData } from '@/hooks/useOptimizedUserData';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const UsersTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  const { data: usersData, isLoading, error, refetch } = useOptimizedUserData({
    page: currentPage,
    limit: 10,
    search: searchTerm,
    enabled: true
  });

  const users = usersData?.users || [];
  const pagination = usersData?.pagination;

  const getRoleIcon = (userRoles: Array<{ role: string }>) => {
    const role = userRoles?.[0]?.role || 'user';
    return role === 'admin' ? <Shield className="h-4 w-4" /> : <Users className="h-4 w-4" />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'active':
        return <Badge variant="default">Active</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Suspended</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getUserVehicleCount = async (userId: string) => {
    try {
      const { count, error } = await supabase
        .from('vehicles')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      
      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Failed to get vehicle count:', error);
      return 0;
    }
  };

  const handleEditUser = (user: any) => {
    toast.info(`Edit user functionality coming soon for ${user.name}`);
  };

  const handleSendEmail = (user: any) => {
    toast.info(`Email functionality coming soon for ${user.email}`);
  };

  const handleViewVehicles = (user: any) => {
    toast.info(`Vehicle management for ${user.name} coming soon`);
  };

  const handleSyncUserData = async (user: any) => {
    try {
      toast.info(`Syncing GP51 data for ${user.name}...`);
      // This would trigger a specific user sync from GP51
      const { data, error } = await supabase.functions.invoke('enhanced-bulk-import', {
        body: {
          action: 'sync_user_data',
          usernames: [user.gp51_username],
          conflictResolution: 'update'
        }
      });

      if (error) throw error;
      
      toast.success(`GP51 data synced successfully for ${user.name}`);
      refetch();
    } catch (error) {
      toast.error(`Failed to sync data for ${user.name}`);
    }
  };

  const handleAddUser = () => {
    toast.info('Add user functionality coming soon');
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-red-500">
            Failed to load user data. Please try again.
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
                <Users className="h-5 w-5" />
                User Management with GP51 Integration
              </CardTitle>
              <CardDescription>
                Manage users and their linked GP51 vehicle assignments
              </CardDescription>
            </div>
            <Button onClick={handleAddUser} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search users by name, email, or phone..."
              value={searchTerm}
              onChange={handleSearch}
              className="max-w-sm"
            />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Users ({pagination?.total || 0})</CardTitle>
          <CardDescription>
            All users with their GP51 integration status and vehicle assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">No users found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'Try adjusting your search criteria' : 'Add users to get started'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {getRoleIcon(user.user_roles)}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{user.name || 'Unknown User'}</p>
                          {getStatusBadge(user.registration_status)}
                        </div>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        {user.phone_number && (
                          <p className="text-sm text-muted-foreground">{user.phone_number}</p>
                        )}
                        {user.gp51_username && (
                          <p className="text-xs text-blue-600">GP51: {user.gp51_username}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Car className="h-3 w-3" />
                        <span>0 vehicles</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Joined: {new Date(user.created_at).toLocaleDateString()}
                      </div>
                      {user.gp51_sessions?.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          GP51 Connected
                        </Badge>
                      )}
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditUser(user)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit User
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleViewVehicles(user)}>
                          <Car className="h-4 w-4 mr-2" />
                          Manage Vehicles
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSendEmail(user)}>
                          <Mail className="h-4 w-4 mr-2" />
                          Send Email
                        </DropdownMenuItem>
                        {user.gp51_username && (
                          <DropdownMenuItem onClick={() => handleSyncUserData(user)}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Sync GP51 Data
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * pagination.limit) + 1} to {Math.min(currentPage * pagination.limit, pagination.total)} of {pagination.total} users
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === pagination.totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UsersTab;
