
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  RefreshCw, 
  Search, 
  ExternalLink,
  Download,
  User,
  Building,
  Mail,
  Phone
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GPS51User {
  id: string;
  gp51_username: string;
  user_type: number;
  nickname: string;
  company_name: string;
  email: string;
  phone: string;
  qq: string;
  wechat: string;
  multi_login: number;
  is_active: boolean;
  last_sync_at: string;
  envio_users?: {
    name: string;
    email: string;
  };
}

const getUserTypeLabel = (userType: number): string => {
  const types: Record<number, string> = {
    3: 'Sub Admin',
    4: 'Company Admin',
    11: 'End User',
    99: 'Device'
  };
  return types[userType] || 'Unknown';
};

const GP51UserManagement: React.FC = () => {
  const [users, setUsers] = useState<GPS51User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<GPS51User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUserInfo, setCurrentUserInfo] = useState<any>(null);

  useEffect(() => {
    loadUsers();
    loadCurrentUserInfo();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('gps51-data', {
        body: {
          action: 'users',
          filters: {
            activeOnly: false
          }
        }
      });

      if (error) throw error;

      if (data?.success) {
        setUsers(data.data || []);
      } else {
        throw new Error(data?.error || 'Failed to load users');
      }
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCurrentUserInfo = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('gp51-user-management', {
        body: {
          action: 'get_current_user_info'
        }
      });

      if (error) throw error;

      if (data?.success) {
        setCurrentUserInfo(data.data);
      }
    } catch (error) {
      console.error('Failed to load current user info:', error);
    }
  };

  const filterUsers = () => {
    if (!searchTerm) {
      setFilteredUsers(users);
      return;
    }

    const filtered = users.filter(user =>
      user.gp51_username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  const exportUserData = async (username?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('gp51-user-management', {
        body: {
          action: 'export_user_data',
          targetUsername: username
        }
      });

      if (error) throw error;

      if (data?.success) {
        const blob = new Blob([JSON.stringify(data.data, null, 2)], {
          type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gps51-user-export-${username || 'current'}-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        toast.success('User data exported successfully');
      } else {
        throw new Error(data?.error || 'Failed to export user data');
      }
    } catch (error) {
      console.error('Failed to export user data:', error);
      toast.error('Failed to export user data');
    }
  };

  const syncUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('gps51-import', {
        body: {
          action: 'users',
          options: {
            skipExisting: false,
            validateData: true
          }
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('Users synced successfully');
        await loadUsers();
      } else {
        throw new Error(data?.error || 'Failed to sync users');
      }
    } catch (error) {
      console.error('Failed to sync users:', error);
      toast.error('Failed to sync users');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">GPS51 User Management</h2>
          <p className="text-gray-600">Manage GPS51 users and their information</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={syncUsers} variant="outline" size="sm" disabled={isLoading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync Users
          </Button>
          <Button onClick={loadUsers} variant="outline" size="sm" disabled={isLoading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Current User Info */}
      {currentUserInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Current GPS51 User
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Username</Label>
                <p className="text-sm">{currentUserInfo.username}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Display Name</Label>
                <p className="text-sm">{currentUserInfo.displayName || 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">User Type</Label>
                <Badge variant="secondary">{currentUserInfo.userTypeLabel}</Badge>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Company</Label>
                <p className="text-sm">{currentUserInfo.company || 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Email</Label>
                <p className="text-sm">{currentUserInfo.contact?.email || 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Phone</Label>
                <p className="text-sm">{currentUserInfo.contact?.phone || 'N/A'}</p>
              </div>
            </div>
            <div className="mt-4">
              <Button onClick={() => exportUserData()} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export My Data
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              GPS51 Users ({filteredUsers.length})
            </CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p>Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <Alert>
              <AlertDescription>
                No users found. Try adjusting your search or sync users from GPS51.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div key={user.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{user.gp51_username}</h3>
                        {user.nickname && (
                          <p className="text-sm text-gray-600">{user.nickname}</p>
                        )}
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {getUserTypeLabel(user.user_type)}
                          </Badge>
                          {user.multi_login === 1 && (
                            <Badge variant="outline" className="text-xs">
                              Multi-login
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        onClick={() => exportUserData(user.gp51_username)} 
                        variant="outline" 
                        size="sm"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                    {user.company_name && (
                      <div className="flex items-center space-x-2">
                        <Building className="h-4 w-4 text-gray-400" />
                        <span>{user.company_name}</span>
                      </div>
                    )}
                    {user.email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span>{user.email}</span>
                      </div>
                    )}
                    {user.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{user.phone}</span>
                      </div>
                    )}
                  </div>

                  {user.envio_users && (
                    <div className="mt-3 p-2 bg-green-50 rounded border-l-4 border-green-400">
                      <p className="text-sm text-green-800">
                        <strong>Linked to Envio:</strong> {user.envio_users.name} ({user.envio_users.email})
                      </p>
                    </div>
                  )}

                  <div className="mt-3 text-xs text-gray-500">
                    Last synced: {user.last_sync_at ? new Date(user.last_sync_at).toLocaleString() : 'Never'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GP51UserManagement;
