
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, Search, RefreshCw, Eye, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  registration_status: string;
  role: string;
  created_at: string;
  updated_at: string;
  // Joined from auth.users via edge function or separate query
  email?: string;
  vehicle_count?: number;
  sync_status?: string;
}

const UsersTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();
  const pageSize = 10;

  // Fetch users from user_profiles table with proper error handling
  const { data: usersData, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-users', searchTerm, currentPage],
    queryFn: async () => {
      try {
        let query = supabase
          .from('user_profiles')
          .select(`
            id,
            first_name,
            last_name,
            phone_number,
            registration_status,
            role,
            created_at,
            updated_at
          `, { count: 'exact' })
          .order('created_at', { ascending: false });

        if (searchTerm && searchTerm.length >= 2) {
          query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,phone_number.ilike.%${searchTerm}%`);
        }

        const offset = (currentPage - 1) * pageSize;
        query = query.range(offset, offset + pageSize - 1);

        const { data, error, count } = await query;

        if (error) {
          console.error('Error fetching users:', error);
          throw error;
        }

        // Get email addresses from auth.users table separately
        const userIds = data?.map(user => user.id) || [];
        let emailMap = new Map<string, string>();
        
        if (userIds.length > 0) {
          try {
            const { data: authData } = await supabase
              .from('envio_users')
              .select('id, email')
              .in('id', userIds);
            
            if (authData) {
              emailMap = new Map(authData.map(user => [user.id, user.email || '']));
            }
          } catch (emailError) {
            console.warn('Could not fetch email data:', emailError);
          }
        }

        // Enhance user data with email and vehicle count
        const enhancedUsers = (data || []).map(user => ({
          ...user,
          email: emailMap.get(user.id) || 'N/A',
          vehicle_count: 0, // Will be populated separately if needed
          sync_status: 'unknown'
        }));

        return {
          users: enhancedUsers,
          totalCount: count || 0,
          totalPages: Math.ceil((count || 0) / pageSize)
        };
      } catch (error) {
        console.error('Failed to fetch users:', error);
        throw new Error('Failed to fetch users. Please try again.');
      }
    },
    retry: 2,
    retryDelay: 1000,
  });

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('gp51-scheduled-sync');
      
      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Manual Sync Started",
          description: data.skipped ? "Sync already in progress" : "GP51 data synchronization initiated"
        });
        refetch();
      } else {
        throw new Error(data?.error || 'Manual sync failed');
      }
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Failed to start manual sync",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const getDisplayName = (user: UserProfile) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    if (user.first_name) return user.first_name;
    if (user.last_name) return user.last_name;
    return 'Unknown User';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending_email_verification': return 'bg-yellow-100 text-yellow-800';
      case 'pending_admin_approval': return 'bg-orange-100 text-orange-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'user': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Users className="h-5 w-5" />
            Error Loading Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">Failed to load users. Please try again.</p>
          <Button onClick={() => refetch()} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management
          </CardTitle>
          <CardDescription>
            Manage user accounts, roles, and permissions with GP51 integration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex gap-2">
              <Button className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Add User
              </Button>
              <Button 
                variant="outline" 
                onClick={handleManualSync}
                disabled={isSyncing}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Syncing...' : 'Sync GP51'}
              </Button>
            </div>
            
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Users Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="font-semibold text-blue-800">Total Users</div>
              <div className="text-2xl font-bold text-blue-600">
                {usersData?.totalCount || 0}
              </div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="font-semibold text-green-800">Active Users</div>
              <div className="text-2xl font-bold text-green-600">
                {usersData?.users?.filter(u => u.registration_status === 'active').length || 0}
              </div>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <div className="font-semibold text-yellow-800">Pending Approval</div>
              <div className="text-2xl font-bold text-yellow-600">
                {usersData?.users?.filter(u => u.registration_status === 'pending_admin_approval').length || 0}
              </div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="font-semibold text-purple-800">Admin Users</div>
              <div className="text-2xl font-bold text-purple-600">
                {usersData?.users?.filter(u => u.role === 'admin').length || 0}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Users List</CardTitle>
          <CardDescription>
            {isLoading ? 'Loading users...' : `Showing ${usersData?.users?.length || 0} of ${usersData?.totalCount || 0} users`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div>
                      <div className="w-32 h-4 bg-gray-200 rounded"></div>
                      <div className="w-48 h-3 bg-gray-200 rounded mt-1"></div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-16 h-6 bg-gray-200 rounded"></div>
                    <div className="w-12 h-6 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : usersData?.users && usersData.users.length > 0 ? (
            <div className="space-y-3">
              {usersData.users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {getDisplayName(user).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{getDisplayName(user)}</p>
                      <p className="text-sm text-muted-foreground">
                        {user.email} • Phone: {user.phone_number || 'Not provided'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Joined: {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(user.registration_status)}>
                      {user.registration_status?.replace(/_/g, ' ')}
                    </Badge>
                    <Badge className={getRoleColor(user.role)}>
                      {user.role}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? 'No users found matching your search.' : 'No users found.'}
              </p>
            </div>
          )}

          {/* Pagination */}
          {usersData && usersData.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {usersData.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(usersData.totalPages, prev + 1))}
                disabled={currentPage === usersData.totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UsersTab;
